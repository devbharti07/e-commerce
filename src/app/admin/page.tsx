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
  UserCheck,
  ShieldCheck,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Query database metrics with parallel batching and targeted projections
  const [
    totalProducts,
    totalVariants,
    registeredRetailersCount,
    pendingRegistrationsCount,
    orderGroups,
    inventoryAggregate,
    attentionVariants,
    recentOrders,
    recentAuditLogs,
    recentRegistrations,
    recentLoginEvents,
  ] = await Promise.all([
    prisma.product.count({ where: { isPublished: true, isArchived: false } }),
    prisma.productVariant.count({ where: { isAvailable: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({
      where: { role: "CUSTOMER", approvalStatus: "PENDING" },
    }),
    // Single consolidated aggregation for all order counts and financial metrics
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    // Stock totals without full table scan
    prisma.productVariant.aggregate({
      where: { isAvailable: true },
      _sum: { onHandStock: true, reservedStock: true },
    }),
    // Targeted query for variants requiring stock attention
    prisma.productVariant.findMany({
      where: {
        isAvailable: true,
        OR: [
          { onHandStock: { lte: 0 } },
          { onHandStock: { lte: 5 } },
        ],
      },
      select: {
        id: true,
        ramGb: true,
        storageGb: true,
        colorName: true,
        onHandStock: true,
        reservedStock: true,
        lowStockThreshold: true,
        product: { select: { name: true } },
      },
      take: 10,
    }),
    // Recent orders with pruned fields
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true, businessName: true, phone: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        approvalStatus: true,
        createdAt: true,
      },
    }),
    prisma.notificationDelivery.findMany({
      where: { type: "USER_LOGIN" },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
      },
    }),
  ]);

  // Aggregate metrics from single order.groupBy
  let pendingOrdersCount = 0;
  let confirmedOrdersCount = 0;
  let awaitingFulfillmentCount = 0;
  let completedOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let collectedRevenue = 0;
  let committedOrderValue = 0;
  let pendingRequestsValue = 0;

  for (const group of orderGroups) {
    const count = group._count.id;
    const amount = group._sum.totalAmount || 0;

    if (group.status === "REQUESTED") {
      pendingOrdersCount = count;
      pendingRequestsValue = amount;
    } else if (group.status === "CONFIRMED") {
      confirmedOrdersCount = count;
      committedOrderValue += amount;
    } else if (["PROCESSING", "READY_FOR_DISPATCH", "SHIPPED"].includes(group.status)) {
      awaitingFulfillmentCount += count;
      committedOrderValue += amount;
    } else if (group.status === "DELIVERED") {
      completedOrdersCount = count;
      collectedRevenue = amount;
    } else if (["CANCELLED", "REJECTED"].includes(group.status)) {
      cancelledOrdersCount += count;
    }
  }

  // Stock calculations
  const totalOnHand = inventoryAggregate._sum.onHandStock || 0;
  const totalReserved = inventoryAggregate._sum.reservedStock || 0;
  const totalAvailable = Math.max(0, totalOnHand - totalReserved);

  const outOfStockVariants = attentionVariants.filter(
    (v) => v.onHandStock - v.reservedStock <= 0
  );
  const lowStockVariants = attentionVariants.filter(
    (v) =>
      v.onHandStock - v.reservedStock > 0 &&
      v.onHandStock - v.reservedStock <= v.lowStockThreshold
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80 dark:border-border-dark/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-forest/10 dark:bg-forest-muted/30 border border-forest/20 dark:border-forest-border/40 text-[11px] font-semibold text-primary dark:text-emerald-400 uppercase tracking-widest mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-brass animate-pulse" />
            Executive Wholesale Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary dark:text-text-primary-dark tracking-tight">
            HQ Operations & Distribution
          </h1>
          <p className="text-xs sm:text-sm text-text-muted dark:text-text-muted-dark mt-0.5">
            Real-time warehouse metrics, dealer order pipeline, and catalog fulfillment
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-3.5 py-2 bg-primary hover:bg-forest-light text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-accent-brass" />
            <span>Orders ({pendingOrdersCount})</span>
          </Link>
          <Link
            href="/admin/inventory"
            className="px-3.5 py-2 bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-forest-muted text-text-primary dark:text-text-primary-dark border border-border dark:border-border-dark text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5 text-text-muted dark:text-text-muted-dark" />
            <span>Inventory</span>
          </Link>
          <Link
            href="/admin/products"
            className="px-3.5 py-2 bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-forest-muted text-text-primary dark:text-text-primary-dark border border-border dark:border-border-dark text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-text-muted dark:text-text-muted-dark" />
            <span>New Handset</span>
          </Link>
        </div>
      </div>

      {/* Actionable Alerts (Shown only when genuine attention is required) */}
      {(pendingRegistrationsCount > 0 || pendingOrdersCount > 0 || outOfStockVariants.length > 0 || lowStockVariants.length > 0) && (
        <div className="space-y-2.5">
          {pendingRegistrationsCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>{pendingRegistrationsCount} new retail store registration{pendingRegistrationsCount > 1 ? "s" : ""}</strong> awaiting administrative approval.
                </span>
              </div>
              <Link
                href="/admin/registration-requests"
                className="font-semibold underline hover:no-underline shrink-0 flex items-center gap-1 text-amber-700 dark:text-amber-400 self-end sm:self-auto"
              >
                Review Registrations &rarr;
              </Link>
            </div>
          )}
          {pendingOrdersCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>{pendingOrdersCount} pending wholesale requests</strong> worth{" "}
                  <span className="tabular-nums font-semibold">{formatCurrency(pendingRequestsValue)}</span> awaiting dealer price confirmation.
                </span>
              </div>
              <Link
                href="/admin/orders"
                className="font-semibold underline hover:no-underline shrink-0 flex items-center gap-1 text-amber-700 dark:text-amber-400 self-end sm:self-auto"
              >
                Review Orders &rarr;
              </Link>
            </div>
          )}

          {(outOfStockVariants.length > 0 || lowStockVariants.length > 0) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-900/40 rounded-xl text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>
                  <strong>Stock Warning:</strong> {outOfStockVariants.length} models out of stock, {lowStockVariants.length} low on inventory.
                </span>
              </div>
              <Link
                href="/admin/inventory"
                className="font-semibold underline hover:no-underline shrink-0 flex items-center gap-1 text-rose-700 dark:text-rose-400 self-end sm:self-auto"
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
        <div className="bg-card dark:bg-card-dark p-5 rounded-xl border border-border dark:border-border-dark shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            <span>Delivered Revenue</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary-dark mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(collectedRevenue)}
          </p>
          <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {completedOrdersCount} orders successfully fulfilled & invoiced
          </p>
        </div>

        {/* Confirmed Pipeline */}
        <div className="bg-card dark:bg-card-dark p-5 rounded-xl border border-border dark:border-border-dark shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-forest-light opacity-80" />
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            <span>Confirmed Pipeline</span>
            <div className="p-1.5 rounded-md bg-forest/10 dark:bg-forest-muted text-primary dark:text-emerald-400 border border-forest/20 dark:border-forest-border/40">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary-dark mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(committedOrderValue)}
          </p>
          <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {confirmedOrdersCount + awaitingFulfillmentCount} orders confirmed / in dispatch
          </p>
        </div>

        {/* Pending Requests */}
        <div className="bg-card dark:bg-card-dark p-5 rounded-xl border border-border dark:border-border-dark shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-brass to-amber-500 opacity-80" />
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            <span>Pending Inquiries</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary-dark mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(pendingRequestsValue)}
          </p>
          <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-brass" />
            {pendingOrdersCount} dealer requests awaiting price verification
          </p>
        </div>
      </div>

      {/* Operational Stats Strip (4 Compact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card dark:bg-card-dark p-4 rounded-xl border border-border dark:border-border-dark shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
            <span className="font-medium">Available Inventory</span>
            <Boxes className="w-4 h-4 text-text-muted dark:text-text-muted-dark" />
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-primary-dark mt-1.5 tabular-nums">
            {totalAvailable} units
          </p>
          <p className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
            {totalOnHand} on-hand • {totalReserved} reserved
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-4 rounded-xl border border-border dark:border-border-dark shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
            <span className="font-medium">Catalog Models</span>
            <Smartphone className="w-4 h-4 text-text-muted dark:text-text-muted-dark" />
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-primary-dark mt-1.5 tabular-nums">
            {totalProducts} Handsets
          </p>
          <p className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
            {totalVariants} active storage/color SKUs
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-4 rounded-xl border border-border dark:border-border-dark shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
            <span className="font-medium">Active Retailers</span>
            <Users className="w-4 h-4 text-text-muted dark:text-text-muted-dark" />
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-primary-dark mt-1.5 tabular-nums">
            {registeredRetailersCount} Retailers
          </p>
          <p className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
            Verified B2B dealer accounts
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-4 rounded-xl border border-border dark:border-border-dark shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
            <span className="font-medium">In Fulfillment</span>
            <Truck className="w-4 h-4 text-text-muted dark:text-text-muted-dark" />
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-primary-dark mt-1.5 tabular-nums">
            {awaitingFulfillmentCount} Orders
          </p>
          <p className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
            Processing or in dispatch
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Recent Orders Table */}
        <div className="lg:col-span-8 bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border dark:border-border-dark flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold text-text-primary dark:text-text-primary-dark">
                Recent Wholesale Orders
              </h2>
              <p className="text-xs text-text-muted dark:text-text-muted-dark">
                Live dealer order submissions and status transitions
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-primary dark:text-accent-brass hover:underline flex items-center gap-1 transition"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-text-muted dark:text-text-muted-dark text-xs">
              <Clock className="w-8 h-8 text-border dark:text-border-dark mx-auto mb-2" />
              <p className="font-semibold text-text-primary dark:text-text-primary-dark">No orders placed yet</p>
              <p className="mt-0.5">Dealer requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-xs">
                <thead className="bg-ivory/60 dark:bg-forest-dark/40 text-text-muted dark:text-text-muted-dark font-semibold uppercase text-[10px] tracking-wider border-b border-border dark:border-border-dark">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Retailer</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                  {recentOrders.map((order) => {
                    const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-ivory/40 dark:hover:bg-forest-muted/20 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-text-primary dark:text-text-primary-dark">
                          {order.orderNumber}
                          <p className="text-[10px] font-normal text-text-muted dark:text-text-muted-dark">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-text-primary dark:text-text-primary-dark">
                            {order.customer.businessName || order.customer.name}
                          </p>
                          <p className="text-[10px] text-text-muted dark:text-text-muted-dark">{order.customer.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium tabular-nums text-text-muted dark:text-text-muted-dark">
                          {totalQty} pcs
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-text-primary dark:text-text-primary-dark tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${getOrderStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-semibold text-primary dark:text-accent-brass hover:underline text-xs"
                          >
                            View &rarr;
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
          <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Stock Attention List
              </h3>
              <Link
                href="/admin/inventory"
                className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-accent-brass"
              >
                Manage
              </Link>
            </div>

            <div className="divide-y divide-border/60 dark:divide-border-dark/60">
              {outOfStockVariants.length === 0 && lowStockVariants.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted dark:text-text-muted-dark">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-semibold text-text-primary dark:text-text-primary-dark">All SKUs in stock</p>
                  <p className="text-[11px] mt-0.5">No critical shortages at this time.</p>
                </div>
              ) : (
                [...outOfStockVariants, ...lowStockVariants].slice(0, 5).map((v) => {
                  const available = v.onHandStock - v.reservedStock;
                  const isOut = available <= 0;

                  return (
                    <div key={v.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-text-primary dark:text-text-primary-dark truncate">
                          {v.product.name}
                        </p>
                        <p className="text-[10px] text-text-muted dark:text-text-muted-dark truncate">
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

          {/* Recent Registrations & Login Events */}
          <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-text-muted dark:text-text-muted-dark" />
                Registrations & Logins
              </h3>
              <Link
                href="/admin/registration-requests"
                className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-accent-brass"
              >
                Requests ({pendingRegistrationsCount})
              </Link>
            </div>

            <div className="divide-y divide-border/60 dark:divide-border-dark/60">
              {recentRegistrations.length === 0 && recentLoginEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted dark:text-text-muted-dark">
                  <p>No registration or login activity yet.</p>
                </div>
              ) : (
                <>
                  {recentRegistrations.map((reg) => (
                    <div key={`reg-${reg.id}`} className="p-3 text-xs flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-text-primary dark:text-text-primary-dark truncate">
                            {reg.businessName || reg.name}
                          </p>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              reg.approvalStatus === "PENDING"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : reg.approvalStatus === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {reg.approvalStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted dark:text-text-muted-dark truncate">
                          {reg.email} • {formatDateTime(reg.createdAt)}
                        </p>
                      </div>
                      {reg.approvalStatus === "PENDING" && (
                        <Link
                          href="/admin/registration-requests"
                          className="shrink-0 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold rounded transition"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  ))}

                  {recentLoginEvents.slice(0, 3).map((login) => (
                    <div key={`login-${login.id}`} className="p-2.5 bg-ivory/40 dark:bg-forest-muted/20 text-[11px] text-text-muted dark:text-text-muted-dark flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{login.body}</span>
                      </div>
                      <span className="text-[9px] text-text-muted dark:text-text-muted-dark tabular-nums shrink-0">
                        {formatDateTime(login.createdAt)}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Recent Audit Activity */}
          <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-text-muted dark:text-text-muted-dark" />
                Audit Trail
              </h3>
              <Link
                href="/admin/audit-logs"
                className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-accent-brass"
              >
                Logs
              </Link>
            </div>

            <div className="divide-y divide-border/60 dark:divide-border-dark/60">
              {recentAuditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted dark:text-text-muted-dark">
                  <p>No audit events recorded.</p>
                </div>
              ) : (
                recentAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[11px] text-text-primary dark:text-text-primary-dark uppercase">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted dark:text-text-muted-dark truncate">
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
