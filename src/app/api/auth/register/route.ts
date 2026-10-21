import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address (e.g. yourname@gmail.com)"),
    phone: z.string().trim().optional().default(""),
    businessName: z.string().trim().optional(),
    gstNumber: z.string().trim().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== "") {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, phone, businessName, gstNumber, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate account
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Secure bcrypt hashing (12 rounds)
    const passwordHash = await hashPassword(password);

    // Public signup is strictly locked to CUSTOMER role and starts in PENDING approval status
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || "+91 00000 00000",
        businessName: businessName?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        passwordHash,
        role: "CUSTOMER",
        approvalStatus: "PENDING",
        isVerified: false,
      },
    });

    // Create persistent admin notification for the registration request
    await prisma.notificationDelivery.create({
      data: {
        type: "NEW_REGISTRATION",
        recipient: "ADMIN",
        title: "New Retailer Registration Request",
        body: `Applicant ${user.name} (${user.email}${user.businessName ? ` - ${user.businessName}` : ""}) has submitted a registration request awaiting approval.`,
        status: "PENDING",
      },
    });

    // Record audit log entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTRATION_SUBMITTED",
        entity: "User",
        entityId: user.id,
        detailsJson: JSON.stringify({
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          phone: user.phone,
          gstNumber: user.gstNumber,
          approvalStatus: "PENDING",
        }),
      },
    });

    // Return pending approval response - DO NOT create or issue an authenticated session cookie
    return NextResponse.json(
      {
        success: true,
        approvalStatus: "PENDING",
        pendingApproval: true,
        message:
          "Your registration has been submitted successfully. Your account is awaiting admin approval. You will be able to log in after your account has been approved.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          approvalStatus: "PENDING",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
