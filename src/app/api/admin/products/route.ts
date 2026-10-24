import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const CreateProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  brandId: z.string().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  model: z.string().min(1, "Model name is required"),
  modelNumber: z.string().min(1, "Model number is required"),
  description: z.string().min(5, "Description is required"),
  condition: z.string().default("Brand New Sealed"),
  warrantyMonths: z.number().int().min(0).default(12),
  returnDays: z.number().int().min(0).default(7),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (url) => !url || url.startsWith("https://") || url.startsWith("http://"),
      { message: "Image URL must start with http:// or https://" }
    )
    .optional(),
  specifications: z
    .array(
      z.object({
        group: z.string(),
        key: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    await requireOwner();
    const products = await prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        variants: true,
        images: true,
        specifications: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const result = CreateProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      brandId,
      categoryId,
      model,
      modelNumber,
      description,
      condition,
      warrantyMonths,
      returnDays,
      isPublished,
      isFeatured,
      imageUrl,
      specifications,
    } = result.data;

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (existingSlug) {
      return NextResponse.json(
        { error: `Product with slug "${slug}" already exists. Please pick a unique slug.` },
        { status: 400 }
      );
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          slug: slug.toLowerCase(),
          brandId,
          categoryId,
          model,
          modelNumber,
          description,
          condition,
          warrantyMonths,
          returnDays,
          isPublished,
          isFeatured,
        },
      });

      if (imageUrl && imageUrl.trim()) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: imageUrl.trim(),
            isPrimary: true,
            displayOrder: 0,
          },
        });
      }

      if (specifications && specifications.length > 0) {
        for (const spec of specifications) {
          if (spec.group && spec.key && spec.value) {
            await tx.productSpecification.create({
              data: {
                productId: product.id,
                group: spec.group,
                key: spec.key,
                value: spec.value,
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "PRODUCT_CREATED",
          entity: "Product",
          entityId: product.id,
          detailsJson: JSON.stringify({
            name: product.name,
            slug: product.slug,
            modelNumber: product.modelNumber,
          }),
        },
      });

      return product;
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Product creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 400 });
  }
}
