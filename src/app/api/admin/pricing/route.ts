import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const AddTierSchema = z.object({
  variantId: z.string().min(1),
  minQty: z.number().int().min(2),
  maxQty: z.number().int().optional().nullable(),
  unitPrice: z.number().int().positive(), // in paise
});

const UpdateMinOrderValueSchema = z.object({
  minOrderValuePaise: z.number().int().positive(),
});

export async function GET() {
  try {
    await requireOwner();

    const [variants, minOrderSetting] = await Promise.all([
      prisma.productVariant.findMany({
        include: {
          product: { include: { brand: true } },
          pricingTiers: { orderBy: { minQty: "asc" } },
        },
        orderBy: { sku: "asc" },
      }),
      prisma.siteSetting.findUnique({
        where: { key: "MIN_ORDER_VALUE" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      variants,
      minOrderValue: minOrderSetting ? parseInt(minOrderSetting.value) || 2500000 : 2500000,
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch pricing data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    if (body.action === "SET_MIN_ORDER_VALUE") {
      const parsed = UpdateMinOrderValueSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid minimum order value" }, { status: 400 });
      }

      const updated = await prisma.siteSetting.upsert({
        where: { key: "MIN_ORDER_VALUE" },
        update: { value: parsed.data.minOrderValuePaise.toString() },
        create: {
          key: "MIN_ORDER_VALUE",
          value: parsed.data.minOrderValuePaise.toString(),
          isPublic: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: owner.userId,
          action: "MIN_ORDER_VALUE_UPDATED",
          entity: "SiteSetting",
          entityId: "MIN_ORDER_VALUE",
          detailsJson: JSON.stringify({ minOrderValuePaise: parsed.data.minOrderValuePaise }),
        },
      });

      return NextResponse.json({ success: true, setting: updated });
    }

    // Default action: Add or update pricing tier
    const parsed = AddTierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid tier data" },
        { status: 400 }
      );
    }

    const { variantId, minQty, maxQty, unitPrice } = parsed.data;

    const tier = await prisma.$transaction(async (tx) => {
      const createdTier = await tx.pricingTier.upsert({
        where: {
          variantId_minQty: {
            variantId,
            minQty,
          },
        },
        update: {
          maxQty: maxQty || null,
          unitPrice,
        },
        create: {
          variantId,
          minQty,
          maxQty: maxQty || null,
          unitPrice,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "PRICING_TIER_CONFIGURED",
          entity: "PricingTier",
          entityId: createdTier.id,
          detailsJson: JSON.stringify({ variantId, minQty, maxQty, unitPrice }),
        },
      });

      return createdTier;
    });

    return NextResponse.json({ success: true, tier }, { status: 201 });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Pricing configuration error:", error);
    return NextResponse.json({ error: error.message || "Failed to configure pricing" }, { status: 400 });
  }
}
