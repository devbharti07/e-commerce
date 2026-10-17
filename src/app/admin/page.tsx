import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Boxes,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  Users,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin");
  }

  // Fetch Live Metrics Directly From Database
  const [
    totalProducts,
    totalVariants,
    totalInventoryAggregate,
    pendingOrdersCount,
    confirmedOrdersCount,
    totalCustomersCount,
    lowStockVariants,
    recentOrders,
    recentMovements,
  ] = await Promise.all([
    prisma.product.count({ where: { isPublished: true, isArchived: false } }),
    prisma.productVariant.count({ where: { isAvailable: true } }),
    prisma.productVariant.aggregate({
      _sum: { onHandStock: true, reservedStock: true },
    }),
    prisma.order.count({ where: { status: "REQUESTED" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.productVariant.findMany({
      where: {
        isAvailable: true,
      },
      include: { product: true },
      take: 6,
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    }),
    prisma.inventoryMovement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { variant: { include: { product: true } } },
    }),
  ]);

  const onHandUnits = totalInventoryAggregate._sum.onHandStock || 0;
  const reservedUnits = totalInventoryAggregate._sum.reservedStock || 0;
  const availableUnits = onHandUnits - reservedUnits;

  // Filter actual low-stock
  const actualLowStock = lowStockVariants.filter(
    (v) => v.onHandStock - v.reservedStock <= v.lowStockThreshold
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Owner Administration HQ
            </h1>
            <span className="bg-[#14213D] text-[#FCA311] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#FCA311]/30">
              Jagdamba Mobile
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time warehouse inventory, pending dealer approvals, and distribution controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="px-4 py-2 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 shadow transition"
          >
            Manage Stock & Adjustments
          </Link>
          <Link
            href="/orders"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition"
          >
            Review Order Requests ({pendingOrdersCount})
          </Link>
        </div>
      </div>

      {/* METRICS CARDS GRID (Direct DB Calculations) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Live Inventory</span>
            <Boxes className="w-4 h-4 text-[#FCA311]" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {availableUnits} <span className="text-xs font-normal text-gray-500">units available</span>
          </p>
          <p className="text-[11px] text-gray-500">
            {onHandUnits} on hand • {reservedUnits} reserved
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {pendingOrdersCount}
          </p>
          <p className="text-[11px] text-gray-500">Awaiting dealer review & confirmation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {confirmedOrdersCount}
          </p>
          <p className="text-[11px] text-gray-500">Stock allocated for dispatch</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Handsets</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {totalProducts} <span className="text-xs font-normal text-gray-500">({totalVariants} SKUs)</span>
          </p>
          <p className="text-[11px] text-gray-500">{totalCustomersCount} registered retailers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Order Requests */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FCA311]" />
              Recent Wholesale Order Requests
            </h2>
            <Link href="/orders" className="text-xs text-[#FCA311] font-semibold hover:underline">
              View All Orders
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    Retailer: {ord.customer.businessName || ord.customer.name} • {ord.items.length} SKUs
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(ord.totalAmount)}
                  </p>
                  <Link
                    href={`/orders/${ord.id}`}
                    className="text-[11px] text-[#14213D] dark:text-[#FCA311] font-semibold hover:underline"
                  >
                    Review & Chat →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Stock Movements Audit Log */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Live Inventory Audit Movements
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
            {recentMovements.map((mv) => (
              <div key={mv.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white line-clamp-1">
                    {mv.variant.product.name} ({mv.variant.ramGb}/{mv.variant.storageGb}GB)
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      mv.changeQty >= 0 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {mv.changeQty >= 0 ? `+${mv.changeQty}` : mv.changeQty} pcs
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Reason: {mv.reason}</span>
                  <span>{formatDateTime(mv.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
