import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, handleAuthError } from "@/lib/auth";

const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name cannot exceed 100 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(16, "Phone number cannot exceed 16 characters"),
  businessName: z.string().trim().max(120).optional(),
  gstNumber: z.string().trim().max(20).optional(),
});

export async function GET() {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        addresses: {
          orderBy: { isDefault: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        businessName: user.businessName,
        gstNumber: user.gstNumber,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireUser();
    const body = await req.json();

    const result = ProfileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, phone, businessName, gstNumber } = result.data;

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        phone,
        businessName: businessName || null,
        gstNumber: gstNumber || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        businessName: updated.businessName,
        gstNumber: updated.gstNumber,
        role: updated.role,
      },
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 400 });
  }
}
