import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

const AdjustSchema = z.object({
  variantId: z.string().min(1),
  changeQty: z.number().int(),
  reason: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const result = AdjustSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid adjustment request" }, { status: 400 });
    }

    const { variantId, changeQty, reason } = result.data;

    // Concurrency transaction ensuring onHandStock never drops below reservedStock
    const updated = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        throw new Error("Product variant not found");
      }

      const newOnHand = variant.onHandStock + changeQty;
      if (newOnHand < variant.reservedStock) {
        throw new Error(
          `Cannot reduce stock below reserved units (${variant.reservedStock} units currently reserved for approved orders).`
        );
      }

      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          onHandStock: newOnHand,
        },
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          variantId,
          changeQty,
          reason,
          balanceOnHand: updatedVariant.onHandStock,
          balanceReserved: updatedVariant.reservedStock,
          performedById: owner.userId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "INVENTORY_ADJUSTMENT",
          entity: "ProductVariant",
          entityId: variantId,
          detailsJson: JSON.stringify({
            changeQty,
            reason,
            newOnHand,
          }),
        },
      });

      return updatedVariant;
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json({ error: error.message || "Adjustment failed" }, { status: 400 });
  }
}
