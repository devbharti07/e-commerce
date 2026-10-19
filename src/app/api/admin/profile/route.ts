import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError, verifyPassword, hashPassword } from "@/lib/auth";

const UpdateAdminProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function GET() {
  try {
    const owner = await requireOwner();
    const user = await prisma.user.findUnique({
      where: { id: owner.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const parsed = UpdateAdminProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: owner.userId },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (parsed.data.name) dataToUpdate.name = parsed.data.name.trim();
    if (parsed.data.phone) dataToUpdate.phone = parsed.data.phone.trim();

    // Password change verification
    if (parsed.data.newPassword) {
      if (!parsed.data.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }

      const validCurrent = await verifyPassword(
        parsed.data.currentPassword,
        currentUser.passwordHash
      );
      if (!validCurrent) {
        return NextResponse.json(
          { error: "Current password does not match our records" },
          { status: 400 }
        );
      }

      dataToUpdate.passwordHash = await hashPassword(parsed.data.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: owner.userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.userId,
        action: parsed.data.newPassword ? "ADMIN_PASSWORD_CHANGED" : "ADMIN_PROFILE_UPDATED",
        entity: "User",
        entityId: owner.userId,
        detailsJson: JSON.stringify({
          updatedFields: Object.keys(dataToUpdate).filter((k) => k !== "passwordHash"),
          passwordChanged: !!parsed.data.newPassword,
        }),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Admin profile error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 400 });
  }
}
