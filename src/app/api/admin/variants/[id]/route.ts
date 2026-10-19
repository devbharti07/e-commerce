import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const UpdateVariantSchema = z.object({
  sku: z.string().min(3).optional(),
  ramGb: z.number().int().positive().optional(),
  storageGb: z.number().int().positive().optional(),
  colorName: z.string().min(1).optional(),
  colorHex: z.string().optional(),
  baseWholesalePrice: z.number().int().positive().optional(),
  minOrderQty: z.number().int().positive().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();
    const { id } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: { include: { brand: true } },
        pricingTiers: { orderBy: { minQty: "asc" } },
        orderItems: { take: 5, orderBy: { id: "desc" }, include: { order: true } },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, variant });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch variant" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id: variantId } = await params;
    const body = await req.json();

    const result = UpdateVariantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid variant update payload" },
        { status: 400 }
      );
    }

    const currentVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!currentVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Check SKU if changing
    if (result.data.sku && result.data.sku.toUpperCase().trim() !== currentVariant.sku) {
      const existing = await prisma.productVariant.findUnique({
        where: { sku: result.data.sku.toUpperCase().trim() },
      });
      if (existing) {
        return NextResponse.json(
          { error: `SKU "${result.data.sku}" is already in use by another variant.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          ...result.data,
          sku: result.data.sku ? result.data.sku.toUpperCase().trim() : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "VARIANT_UPDATED",
          entity: "ProductVariant",
          entityId: variantId,
          detailsJson: JSON.stringify(result.data),
        },
      });

      return variant;
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Variant update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update variant" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id: variantId } = await params;

    // Toggle availability off safely rather than deleting to preserve orders
    const disabled = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isAvailable: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.userId,
        action: "VARIANT_DISABLED",
        entity: "ProductVariant",
        entityId: variantId,
        detailsJson: JSON.stringify({ isAvailable: false }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Variant disabled from wholesale catalog",
      variant: disabled,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || "Failed to disable variant" }, { status: 400 });
  }
}
