import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const UpdateRetailerSchema = z.object({
  isSuspended: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();
    const { id } = await params;

    const retailer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        gstNumber: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        addresses: true,
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
        conversations: {
          include: {
            order: { select: { id: true, orderNumber: true } },
            messages: { take: 5, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!retailer || retailer.role === "OWNER") {
      return NextResponse.json({ error: "Retailer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, retailer });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch retailer profile" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id: retailerId } = await params;
    const body = await req.json();

    const result = UpdateRetailerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid retailer update payload" }, { status: 400 });
    }

    // Prevent modifying owner account through this endpoint
    const targetUser = await prisma.user.findUnique({ where: { id: retailerId } });
    if (!targetUser || targetUser.role === "OWNER") {
      return NextResponse.json({ error: "Cannot modify this account" }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: retailerId },
      data: result.data,
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
        isVerified: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.userId,
        action: result.data.isSuspended !== undefined ? "RETAILER_SUSPENSION_TOGGLED" : "RETAILER_VERIFIED_TOGGLED",
        entity: "User",
        entityId: retailerId,
        detailsJson: JSON.stringify(result.data),
      },
    });

    return NextResponse.json({ success: true, retailer: updated });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Retailer update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update retailer" }, { status: 400 });
  }
}
