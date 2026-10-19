import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id } = await params;

    const tier = await prisma.pricingTier.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.userId,
        action: "PRICING_TIER_DELETED",
        entity: "PricingTier",
        entityId: id,
        detailsJson: JSON.stringify({ variantId: tier.variantId, minQty: tier.minQty }),
      },
    });

    return NextResponse.json({ success: true, message: "Pricing tier removed" });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || "Failed to remove tier" }, { status: 400 });
  }
}
