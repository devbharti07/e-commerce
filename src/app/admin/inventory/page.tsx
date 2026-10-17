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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Warehouse Inventory Control
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Adjust stock, review on-hand vs reserved units, and update SKU thresholds
            </p>
          </div>
        </div>

        <a
          href="/api/admin/inventory/export"
          download
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
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
