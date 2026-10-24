import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, handleAuthError, verifyPassword, hashPassword } from "@/lib/auth";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export async function POST(req: Request) {
  try {
    // 1. Authoritative session verification (never trust client-supplied ID)
    const session = await requireUser();

    // 2. Parse request JSON body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    // 3. Schema validation
    const result = ChangePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // 4. Fetch the authenticated user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        approvalStatus: true,
        isSuspended: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 5. Verify the current password against stored hash using project's existing bcrypt utility
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "The current password you entered is incorrect" },
        { status: 400 }
      );
    }

    // 6. Securely hash the new password using existing bcrypt config (12 rounds)
    const newPasswordHash = await hashPassword(newPassword);

    // 7. Update ONLY the authenticated user's passwordHash field
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newPasswordHash },
    });

    // 8. Record audit log entry (never logging plaintext passwords or hashes)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGED",
          entity: "User",
          entityId: user.id,
          detailsJson: JSON.stringify({
            email: user.email,
            role: user.role,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log for password change:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been changed successfully.",
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;

    console.error("Change password API error:", error);
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }
}
