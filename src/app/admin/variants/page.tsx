import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminVariantsClient } from "@/components/admin-variants-client";
import { Layers } from "lucide-react";

export const metadata = {
  title: "Smartphone Variants | Jagdamba Mobile Admin",
};

export default async function AdminVariantsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/variants");
  }

  const [variants, products] = await Promise.all([
    prisma.productVariant.findMany({
      include: {
        product: {
          include: { brand: true },
        },
        pricingTiers: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isArchived: false },
      include: { brand: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const formattedVariants = variants.map((v) => ({
    id: v.id,
    productId: v.productId,
    productName: v.product.name,
    brandName: v.product.brand.name,
    sku: v.sku,
    ramGb: v.ramGb,
    storageGb: v.storageGb,
    colorName: v.colorName,
    colorHex: v.colorHex,
    baseWholesalePrice: v.baseWholesalePrice,
    minOrderQty: v.minOrderQty,
    lowStockThreshold: v.lowStockThreshold,
    onHandStock: v.onHandStock,
    reservedStock: v.reservedStock,
    isAvailable: v.isAvailable,
    pricingTiersCount: v.pricingTiers.length,
  }));

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Smartphone Variants & SKUs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure storage specs, colors, unique wholesale SKUs, and catalog availability
          </p>
        </div>
      </div>

      <AdminVariantsClient
        initialVariants={formattedVariants}
        products={productOptions}
      />
    </div>
  );
}
