import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid email or password format" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

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
