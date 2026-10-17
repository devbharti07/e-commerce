import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const RegisterSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid business email is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  businessName: z.string().min(2, "Shop / Retail business name is required"),
  gstNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, phone, businessName, gstNumber, password } = result.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Wholesale registrations default to CUSTOMER role (public admin registration is forbidden)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        businessName,
        gstNumber: gstNumber || null,
        passwordHash,
        role: "CUSTOMER",
        isVerified: true,
      },
    });

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: "CUSTOMER" as const,
      name: user.name,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Failed to create retailer account" },
      { status: 500 }
    );
  }
}
