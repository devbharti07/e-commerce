import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Boxes,
  Smartphone,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  Truck,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Plus,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Query all real database metrics in parallel
  const [
    totalProducts,
    totalVariants,
    pendingOrdersCount,
    confirmedOrdersCount,
    awaitingFulfillmentCount,
    completedOrdersCount,
    cancelledOrdersCount,
    registeredRetailersCount,
    variantsWithInventory,
    recentOrders,
    recentMessages,
    recentAuditLogs,
    fulfilledRevenueAggregate,
    confirmedOrdersValueAggregate,
    pendingRequestsValueAggregate,
  ] = await Promise.all([
    prisma.product.count({ where: { isPublished: true, isArchived: false } }),
    prisma.productVariant.count({ where: { isAvailable: true } }),
    prisma.order.count({ where: { status: "REQUESTED" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({
      where: {
        status: { in: ["PROCESSING", "READY_FOR_DISPATCH", "SHIPPED"] },
      },
    }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: { in: ["CANCELLED", "REJECTED"] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.productVariant.findMany({
      where: { isAvailable: true },
      include: { product: true },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, businessName: true, phone: true } },
        items: true,
      },
    }),
    prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true, role: true } },
        conversation: {
          include: {
            order: { select: { id: true, orderNumber: true } },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.order.aggregate({
      where: { status: "DELIVERED" },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["CONFIRMED", "PROCESSING", "READY_FOR_DISPATCH", "SHIPPED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: "REQUESTED" },
      _sum: { totalAmount: true },
    }),
  ]);

  // Stock calculations
  const outOfStockVariants = variantsWithInventory.filter(
    (v) => v.onHandStock - v.reservedStock <= 0
  );
  const lowStockVariants = variantsWithInventory.filter(
    (v) =>
      v.onHandStock - v.reservedStock > 0 &&
      v.onHandStock - v.reservedStock <= v.lowStockThreshold
  );

  const totalOnHand = variantsWithInventory.reduce((s, v) => s + v.onHandStock, 0);
  const totalReserved = variantsWithInventory.reduce((s, v) => s + v.reservedStock, 0);
  const totalAvailable = Math.max(0, totalOnHand - totalReserved);

  const collectedRevenue = fulfilledRevenueAggregate._sum.totalAmount || 0;
  const committedOrderValue = confirmedOrdersValueAggregate._sum.totalAmount || 0;
  const pendingRequestsValue = pendingRequestsValueAggregate._sum.totalAmount || 0;

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
      case "PROCESSING":
      case "READY_FOR_DISPATCH":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time operations summary for Jagdamba Mobile wholesale distribution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orders ({pendingOrdersCount})</span>
          </Link>
          <Link
            href="/admin/inventory"
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
            <span>Inventory</span>
          </Link>
          <Link
            href="/admin/products"
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>New Model</span>
          </Link>
        </div>
      </div>

      {/* Actionable Alerts (Shown only when genuine attention is required) */}
      {(pendingOrdersCount > 0 || outOfStockVariants.length > 0 || lowStockVariants.length > 0) && (
        <div className="space-y-2">
          {pendingOrdersCount > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong>{pendingOrdersCount} pending wholesale requests</strong> worth{" "}
                  <span className="tabular-nums font-semibold">{formatCurrency(pendingRequestsValue)}</span> awaiting dealer price confirmation.
                </span>
              </div>
              <Link
                href="/admin/orders"
                className="font-semibold underline hover:no-underline ml-3 shrink-0 flex items-center gap-1 text-amber-700 dark:text-amber-400"
              >
                Review Orders &rarr;
              </Link>
            </div>
          )}

          {(outOfStockVariants.length > 0 || lowStockVariants.length > 0) && (
            <div className="flex items-center justify-between p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="truncate">
                  <strong>Stock Warning:</strong> {outOfStockVariants.length} models out of stock, {lowStockVariants.length} low on inventory.
                </span>
              </div>
              <Link
                href="/admin/inventory"
                className="font-semibold underline hover:no-underline ml-3 shrink-0 flex items-center gap-1 text-rose-700 dark:text-rose-400"
              >
                Adjust Stock &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Primary Financial & Pipeline Metrics (3 Core Pillars) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fulfilled Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Delivered Revenue</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
            {formatCurrency(collectedRevenue)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {completedOrdersCount} orders successfully fulfilled & invoiced
          </p>
        </div>

        {/* Confirmed Pipeline */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Confirmed Pipeline</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
            {formatCurrency(committedOrderValue)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {confirmedOrdersCount + awaitingFulfillmentCount} orders confirmed / in dispatch
          </p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Pending Inquiries</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
            {formatCurrency(pendingRequestsValue)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {pendingOrdersCount} dealer requests awaiting price verification
          </p>
        </div>
      </div>

      {/* Operational Stats Strip (4 Compact Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Available Inventory</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {totalAvailable} units
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalOnHand} on-hand • {totalReserved} reserved
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Catalog Models</span>
            <Smartphone className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {totalProducts} Handsets
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalVariants} active storage/color SKUs
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Retailers</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {registeredRetailersCount} Retailers
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Verified B2B dealer accounts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>In Fulfillment</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {awaitingFulfillmentCount} Orders
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Processing or in dispatch
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Recent Orders Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Wholesale Orders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live dealer order submissions and status transitions
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No orders placed yet</p>
              <p className="mt-0.5">Dealer requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Order #</th>
                    <th className="py-2.5 px-4">Retailer</th>
                    <th className="py-2.5 px-4 text-center">Items</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentOrders.map((order) => {
                    const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {order.orderNumber}
                          <p className="text-[10px] font-normal text-slate-400">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {order.customer.businessName || order.customer.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{order.customer.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-medium tabular-nums text-slate-600 dark:text-slate-300">
                          {totalQty} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${getOrderStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline text-xs"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Low Inventory & Audit Trail */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Warning Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Stock Attention List
              </h3>
              <Link
                href="/admin/inventory"
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Manage
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {outOfStockVariants.length === 0 && lowStockVariants.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">All SKUs in stock</p>
                  <p className="text-[11px] mt-0.5">No critical shortages at this time.</p>
                </div>
              ) : (
                [...outOfStockVariants, ...lowStockVariants].slice(0, 5).map((v) => {
                  const available = v.onHandStock - v.reservedStock;
                  const isOut = available <= 0;

                  return (
                    <div key={v.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {v.product.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {v.ramGb}GB / {v.storageGb}GB • {v.colorName}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums shrink-0 ${
                          isOut
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isOut ? "OUT OF STOCK" : `${available} left`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Audit Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                Audit Trail
              </h3>
              <Link
                href="/admin/audit-logs"
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Logs
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentAuditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <p>No audit events recorded.</p>
                </div>
              ) : (
                recentAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 uppercase">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      by {log.user?.name || "System"} • {log.entity} {log.entityId ? `#${log.entityId.slice(-6)}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
