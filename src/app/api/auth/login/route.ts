import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizeIndianPhoneNumber } from "@/lib/phone";

const LoginSchema = z
  .object({
    email: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => Boolean((data.identifier || data.email || data.phone)?.trim()), {
    message: "Please enter your registered email address or mobile number",
    path: ["identifier"],
  });

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid email or password format" },
        { status: 400 }
      );
    }

    const { password } = result.data;
    const rawIdentifier = (
      result.data.identifier ||
      result.data.email ||
      result.data.phone ||
      ""
    ).trim();
    const clientIp = getClientIp(req);

    // 1. IP-level brute force protection (max 60 attempts per 15 min per IP)
    const ipRate = checkRateLimit(`login:ip:${clientIp}`, 60, 15 * 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts from this network. Please wait ${ipRate.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429, headers: { "Retry-After": ipRate.retryAfterSeconds.toString() } }
      );
    }

    // 2. Account-level brute force protection (max 6 attempts per 15 min per account)
    const rateLimitKey = `login:id:${rawIdentifier.toLowerCase()}`;
    const accountRate = checkRateLimit(rateLimitKey, 6, 15 * 60 * 1000);
    if (!accountRate.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts for this account. Please wait ${accountRate.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429, headers: { "Retry-After": accountRate.retryAfterSeconds.toString() } }
      );
    }

    let user = null;
    if (rawIdentifier.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: rawIdentifier.toLowerCase() },
      });
    } else {
      const phoneNorm = normalizeIndianPhoneNumber(rawIdentifier);
      const digitsOnly = rawIdentifier.replace(/\D/g, "");
      const last10 = digitsOnly.slice(-10);
      const normalizedE164 = phoneNorm.valid ? phoneNorm.normalized : rawIdentifier;
      const formattedWithSpaces =
        last10.length === 10 ? `+91 ${last10.slice(0, 5)} ${last10.slice(5)}` : rawIdentifier;

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedE164 },
            { phone: formattedWithSpaces },
            { phone: last10 },
            { phone: rawIdentifier },
            ...(last10.length === 10 ? [{ phone: { endsWith: last10 } }] : []),
            { email: rawIdentifier.toLowerCase() },
          ],
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Clear failed attempt counter on successful password verification
    resetRateLimit(rateLimitKey);
    resetRateLimit(`login:id:${user.email.toLowerCase()}`);
    resetRateLimit(`login:email:${user.email.toLowerCase()}`);

    if (user.role === "CUSTOMER") {
      if (user.approvalStatus === "PENDING") {
        return NextResponse.json(
          {
            error:
              "Your account is awaiting admin approval. You will be able to log in after your account has been approved by Jagdamba Mobile administration.",
            approvalStatus: "PENDING",
          },
          { status: 403 }
        );
      }

      if (user.approvalStatus === "REJECTED") {
        return NextResponse.json(
          {
            error:
              "Your registration request has been rejected. Please contact Jagdamba Mobile administration for assistance.",
            approvalStatus: "REJECTED",
          },
          { status: 403 }
        );
      }

      if (user.approvalStatus === "SUSPENDED" || user.isSuspended) {
        return NextResponse.json(
          {
            error:
              "Your retailer account is currently suspended. Please contact Jagdamba Mobile administration.",
            approvalStatus: "SUSPENDED",
          },
          { status: 403 }
        );
      }
    }

    // Record login event in notification delivery (informational history)
    try {
      await prisma.notificationDelivery.create({
        data: {
          type: "USER_LOGIN",
          recipient: "ADMIN",
          title: `Successful Sign In: ${user.name}`,
          body: `${user.name} (${user.email}) successfully logged in with role ${user.role}.`,
          status: "SENT",
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entity: "User",
          entityId: user.id,
          detailsJson: JSON.stringify({
            role: user.role,
            email: user.email,
            time: new Date().toISOString(),
          }),
        },
      });
    } catch (logErr) {
      console.warn("Failed to record login audit log:", logErr);
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "CUSTOMER" | "OWNER",
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
        approvalStatus: user.approvalStatus || "APPROVED",
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Login API error:", errorMsg);

    if (
      errorMsg.includes("does not exist in the current database") ||
      errorMsg.includes("Can't reach database server") ||
      errorMsg.includes("Authentication failed against database server")
    ) {
      return NextResponse.json(
        { error: "Database service is initializing or unreachable. Please retry in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
