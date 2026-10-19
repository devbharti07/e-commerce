import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  model: z.string().min(1).optional(),
  modelNumber: z.string().min(1).optional(),
  description: z.string().min(5).optional(),
  brandId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  condition: z.string().optional(),
  warrantyMonths: z.number().int().min(0).optional(),
  returnDays: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        variants: {
          include: { pricingTiers: true },
        },
        images: true,
        specifications: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id: productId } = await params;
    const body = await req.json();

    const result = UpdateProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid product update payload" },
        { status: 400 }
      );
    }

    const { imageUrl, ...dataToUpdate } = result.data;

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: dataToUpdate,
      });

      if (imageUrl !== undefined && imageUrl.trim()) {
        const existingPrimary = await tx.productImage.findFirst({
          where: { productId, isPrimary: true },
        });

        if (existingPrimary) {
          await tx.productImage.update({
            where: { id: existingPrimary.id },
            data: { url: imageUrl.trim() },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId,
              url: imageUrl.trim(),
              isPrimary: true,
              displayOrder: 0,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "PRODUCT_UPDATED",
          entity: "Product",
          entityId: productId,
          detailsJson: JSON.stringify(result.data),
        },
      });

      return product;
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Product update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id: productId } = await params;

    // Archive product instead of deleting to preserve order history
    const archived = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: true, isPublished: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.userId,
        action: "PRODUCT_ARCHIVED",
        entity: "Product",
        entityId: productId,
        detailsJson: JSON.stringify({ isArchived: true, isPublished: false }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product safely archived to preserve historical orders",
      product: archived,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || "Failed to archive product" }, { status: 400 });
  }
}
