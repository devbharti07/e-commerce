import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminPricingClient } from "@/components/admin-pricing-client";
import { BadgeIndianRupee } from "lucide-react";

export const metadata = {
  title: "Wholesale Pricing | Jagdamba Mobile Admin",
};

export default async function AdminPricingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/pricing");
  }

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

  const minOrderValue = minOrderSetting ? parseInt(minOrderSetting.value) || 2500000 : 2500000;

  const formattedVariants = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    productName: v.product.name,
    brandName: v.product.brand.name,
    ramGb: v.ramGb,
    storageGb: v.storageGb,
    colorName: v.colorName,
    baseWholesalePrice: v.baseWholesalePrice,
    minOrderQty: v.minOrderQty,
    pricingTiers: v.pricingTiers.map((t) => ({
      id: t.id,
      minQty: t.minQty,
      maxQty: t.maxQty,
      unitPrice: t.unitPrice,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BadgeIndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Wholesale B2B Pricing Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure volume pricing tiers, base wholesale rates, and commercial minimum order value
          </p>
        </div>
      </div>

      <AdminPricingClient
        initialVariants={formattedVariants}
        initialMinOrderValue={minOrderValue}
      />
    </div>
  );
}
