import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProductDetailClient } from "@/components/product-detail-client";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const isOwner = user?.role === "OWNER";

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      variants: {
        include: {
          pricingTiers: {
            orderBy: { minQty: "asc" },
          },
        },
        orderBy: { baseWholesalePrice: "asc" },
      },
      specifications: {
        orderBy: [{ group: "asc" }, { key: "asc" }],
      },
      images: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!product || (!product.isPublished && !isOwner) || product.isArchived) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
