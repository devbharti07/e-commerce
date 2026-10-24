/**
 * Phone number normalization and masking utilities for customer accounts and profiles.
 * Jagdamba Mobile wholesale platform.
 */

export interface PhoneNormalizationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normalizes and validates Indian and international phone numbers into canonical E.164 format.
 * E.g., "+91 98765 43210", "9876543210", "09876543210" -> "+919876543210".
 */
export function normalizeIndianPhoneNumber(rawPhone: string): PhoneNormalizationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { valid: false, normalized: "", error: "Phone number is required" };
  }

  // Remove whitespace, dashes, parens, dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "");

  // If starts with 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // If starts with +91
  if (cleaned.startsWith("+91")) {
    const digits = cleaned.slice(3);
    if (!/^\d{10}$/.test(digits)) {
      return {
        valid: false,
        normalized: "",
        error: "Indian mobile numbers must be exactly 10 digits after +91",
      };
    }
    if (!/^[6-9]/.test(digits)) {
      return {
        valid: false,
        normalized: "",
        error: "Indian mobile numbers must begin with 6, 7, 8, or 9",
      };
    }
    return { valid: true, normalized: `+91${digits}` };
  }

  // If starts with 91 followed by 10 digits
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  // If starts with leading 0 followed by 10 digits
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+91${cleaned.slice(1)}` };
  }

  // If bare 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+91${cleaned}` };
  }

  // Generic international E.164 (+ followed by 10-15 digits)
  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    normalized: "",
    error: "Please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210)",
  };
}

/**
 * Masks a phone number for secure display in UI, admin table, and logs.
 * E.g., "+919876543210" -> "+91 98•••• ••10"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length <= 4) return "••••";

  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    const last3 = cleaned.slice(-3);
    const first2 = cleaned.slice(3, 5);
    return `+91 ${first2}••• ••${last3.slice(1)}`;
  }

  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-2);
  const maskedLength = Math.max(3, cleaned.length - 5);
  return `${prefix}${"•".repeat(maskedLength)}${suffix}`;
}
