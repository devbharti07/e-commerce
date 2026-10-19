import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const CreateVariantSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  sku: z.string().min(3, "SKU is required"),
  ramGb: z.number().int().positive("RAM must be positive"),
  storageGb: z.number().int().positive("Storage must be positive"),
  colorName: z.string().min(1, "Color name is required"),
  colorHex: z.string().default("#000000"),
  baseWholesalePrice: z.number().int().positive("Wholesale price must be positive (in paise)"),
  minOrderQty: z.number().int().positive().default(2),
  lowStockThreshold: z.number().int().min(0).default(5),
  initialStock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    await requireOwner();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const variants = await prisma.productVariant.findMany({
      where: productId ? { productId } : {},
      include: {
        product: {
          include: { brand: true, category: true },
        },
        pricingTiers: {
          orderBy: { minQty: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, variants });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const result = CreateVariantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid variant data" },
        { status: 400 }
      );
    }

    const {
      productId,
      sku,
      ramGb,
      storageGb,
      colorName,
      colorHex,
      baseWholesalePrice,
      minOrderQty,
      lowStockThreshold,
      initialStock,
      isAvailable,
    } = result.data;

    // Check unique SKU
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });
    if (existingSku) {
      return NextResponse.json(
        { error: `SKU "${sku}" is already in use by another smartphone variant.` },
        { status: 400 }
      );
    }

    // Check duplicate spec combination for same product
    const existingCombination = await prisma.productVariant.findFirst({
      where: {
        productId,
        ramGb,
        storageGb,
        colorName: { equals: colorName, mode: "insensitive" },
      },
    });
    if (existingCombination) {
      return NextResponse.json(
        {
          error: `A variant with ${ramGb}GB RAM, ${storageGb}GB Storage, and ${colorName} already exists for this handset.`,
        },
        { status: 400 }
      );
    }

    const newVariant = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: sku.toUpperCase().trim(),
          ramGb,
          storageGb,
          colorName,
          colorHex,
          baseWholesalePrice,
          minOrderQty,
          lowStockThreshold,
          onHandStock: initialStock,
          reservedStock: 0,
          isAvailable,
        },
        include: { product: true },
      });

      if (initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            changeQty: initialStock,
            reason: "INITIAL_STOCK",
            balanceOnHand: initialStock,
            balanceReserved: 0,
            performedById: owner.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "VARIANT_CREATED",
          entity: "ProductVariant",
          entityId: variant.id,
          detailsJson: JSON.stringify({
            sku: variant.sku,
            productId: variant.productId,
            ramGb,
            storageGb,
            colorName,
            baseWholesalePrice,
          }),
        },
      });

      return variant;
    });

    return NextResponse.json({ success: true, variant: newVariant }, { status: 201 });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Variant create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create variant" }, { status: 400 });
  }
}
