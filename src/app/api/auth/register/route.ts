import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address (e.g. yourname@gmail.com)"),
    phone: z.string().trim().min(8, "Phone number is required"),
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
    const clientIp = getClientIp(req);
    const regLimit = checkRateLimit(`register:ip:${clientIp}`, 60, 15 * 60 * 1000);
    if (!regLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": regLimit.retryAfterSeconds.toString() } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, phone, businessName, gstNumber, password } = result.data;

    const phoneNorm = normalizeIndianPhoneNumber(phone);
    const normalizedPhone = phoneNorm.valid ? phoneNorm.normalized : phone.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Check duplicate phone if phone provided
    if (normalizedPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: phone.trim() },
          ],
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "An account with this phone number already exists. Please sign in instead." },
          { status: 409 }
        );
      }
    }

    // Secure bcrypt hashing (12 rounds)
    const passwordHash = await hashPassword(password);

    // Create user in PENDING approval status
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone || "+91 00000 00000",
        businessName: businessName?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        passwordHash,
        role: "CUSTOMER",
        approvalStatus: "PENDING",
        isVerified: false,
      },
    });

    // Create persistent admin notification
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

    // Return pending approval response - NEVER issue session cookie for unapproved account
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
          phone: user.phone,
          approvalStatus: "PENDING",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
