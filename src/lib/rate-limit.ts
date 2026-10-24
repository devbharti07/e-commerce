/**
 * Jagdamba Mobile - Production Rate Limiter & Abuse Prevention Utility
 * Sliding window rate limiter for distributed/serverless & standard environments.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store with periodic automatic pruning to prevent memory leaks
const rateLimitStore = new Map<string, RateLimitRecord>();

// Prune expired records every 5 minutes
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPruneTime = Date.now();

function pruneExpiredRecords() {
  const now = Date.now();
  if (now - lastPruneTime < PRUNE_INTERVAL_MS) return;
  lastPruneTime = now;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in ms
  retryAfterSeconds: number;
}

/**
 * Checks and updates rate limit for a given key using a sliding window.
 * @param key Identifier (e.g. `login:ip:127.0.0.1` or `otp:phone:+919876543210`)
 * @param limit Maximum allowed attempts within window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  pruneExpiredRecords();

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetTime: newRecord.resetTime,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  return {
    allowed: true,
    limit,
    remaining,
    resetTime: record.resetTime,
    retryAfterSeconds,
  };
}

/**
 * Resets/clears rate limit counter for a specific key upon successful action (e.g., successful login)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Extracts client IP safely from request headers with fallback
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // If multiple IPs are present, the first one is the client IP
    const clientIp = forwarded.split(",")[0].trim();
    if (clientIp) return clientIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}
