import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "jagdamba_wholesale_super_secret_jwt_key_2026_secured"
);

export const AUTH_COOKIE_NAME = "jm_auth_token";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "OWNER";
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export async function requireUser(): Promise<TokenPayload> {
  const session = await getCurrentUser();
  if (!session || !session.userId) {
    throw new AuthError("Unauthorized", 401);
  }

  // Authoritative server-side verification against PostgreSQL database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      approvalStatus: true,
      isSuspended: true,
    },
  });

  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  if (user.isSuspended || user.approvalStatus === "SUSPENDED") {
    throw new AuthError("Forbidden: Retailer account is suspended", 403);
  }

  if (user.role === "CUSTOMER" && user.approvalStatus !== "APPROVED") {
    throw new AuthError("Forbidden: Account is awaiting admin approval", 403);
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role as "CUSTOMER" | "OWNER",
    name: user.name,
  };
}

export async function requireOwner(): Promise<TokenPayload> {
  const user = await requireUser();
  if (user.role !== "OWNER") {
    throw new AuthError("Forbidden: Owner access required", 403);
  }
  return user;
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED" || error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN" || error.message.includes("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
  }
  return null;
}
