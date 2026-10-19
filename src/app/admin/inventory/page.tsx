import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { AdminInventoryClient } from "@/components/admin-inventory-client";
import { ArrowLeft, Boxes, FileSpreadsheet } from "lucide-react";

export default async function AdminInventoryPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/inventory");
  }

  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        include: { brand: true },
      },
      pricingTiers: {
        orderBy: { minQty: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Warehouse Inventory Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Adjust stock, review on-hand vs reserved units, and update SKU thresholds
          </p>
        </div>

        <a
          href="/api/admin/inventory/export"
          download
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export CSV Report
        </a>
      </div>

      <AdminInventoryClient
        initialVariants={variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          productName: v.product.name,
          brandName: v.product.brand.name,
          ramGb: v.ramGb,
          storageGb: v.storageGb,
          colorName: v.colorName,
          baseWholesalePrice: v.baseWholesalePrice,
          minOrderQty: v.minOrderQty,
          lowStockThreshold: v.lowStockThreshold,
          onHandStock: v.onHandStock,
          reservedStock: v.reservedStock,
          isAvailable: v.isAvailable,
        }))}
      />
    </div>
  );
}
