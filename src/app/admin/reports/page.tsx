import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminReportsClient } from "@/components/admin-reports-client";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Reports & Analytics | Jagdamba Mobile Admin",
};

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/reports");
  }

  // 1. Order status grouping
  const statusGroups = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  const statusBreakdown = statusGroups.map((g) => ({
    status: g.status,
    count: g._count.id,
    totalAmount: g._sum.totalAmount || 0,
  }));

  // 2. Best-selling handsets
  const bestSellerGroups = await prisma.orderItem.groupBy({
    by: ["productName", "sku"],
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const bestSellers = bestSellerGroups.map((b) => ({
    productName: b.productName,
    sku: b.sku,
    totalQuantity: b._sum.quantity || 0,
    totalRevenue: b._sum.lineTotal || 0,
  }));

  // 3. Inventory health (low-stock & out-of-stock)
  const variants = await prisma.productVariant.findMany({
    where: { isAvailable: true },
    include: { product: { include: { brand: true } } },
    orderBy: { onHandStock: "asc" },
  });

  const inventoryRisks = variants
    .map((v) => {
      const available = v.onHandStock - v.reservedStock;
      const condition =
        available <= 0
          ? "OUT_OF_STOCK"
          : available <= v.lowStockThreshold
          ? "LOW_STOCK"
          : "HEALTHY";

      return {
        sku: v.sku,
        productName: v.product.name,
        brandName: v.product.brand.name,
        onHandStock: v.onHandStock,
        reservedStock: v.reservedStock,
        availableStock: available,
        lowStockThreshold: v.lowStockThreshold,
        condition,
      };
    })
    .filter((v) => v.condition !== "HEALTHY");

  // 4. Recent movements
  const movements = await prisma.inventoryMovement.findMany({
    take: 25,
    orderBy: { createdAt: "desc" },
    include: { variant: { include: { product: true } } },
  });

  const recentMovements = movements.map((m) => ({
    id: m.id,
    productName: m.variant.product.name,
    sku: m.variant.sku,
    changeQty: m.changeQty,
    reason: m.reason,
    balanceOnHand: m.balanceOnHand,
    balanceReserved: m.balanceReserved,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Wholesale Intelligence & Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Authoritative sales lifecycle analytics, volume handset demand, and inventory velocity ledger
          </p>
        </div>
      </div>

      <AdminReportsClient
        statusBreakdown={statusBreakdown}
        bestSellers={bestSellers}
        inventoryRisks={inventoryRisks}
        recentMovements={recentMovements}
      />
    </div>
  );
}
