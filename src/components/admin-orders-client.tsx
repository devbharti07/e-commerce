"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Search,
  Filter,
  FileSpreadsheet,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  Truck,
  XCircle,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface OrderItemSummary {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string | null;
  itemsCount: number;
  totalUnits: number;
  itemsSummary: string;
}

interface AdminOrdersClientProps {
  initialOrders: AdminOrderRow[];
}

export function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderRow[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Modal and quick action states
  const [activeModalOrder, setActiveModalOrder] = useState<AdminOrderRow | null>(null);
  const [modalAction, setModalAction] = useState<"ACCEPT" | "DECLINE" | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string, reason?: string) => {
    setActionLoading(true);
    setModalError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: reason?.trim() || undefined }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        setActiveModalOrder(null);
        setModalAction(null);
        setDeclineReason("");
        setFeedback({
          type: "success",
          message:
            data.message ||
            (newStatus === "CONFIRMED"
              ? "Order accepted and stock allocated successfully."
              : "Order declined successfully."),
        });
        router.refresh();
      } else {
        setModalError(data.error || "Failed to update order status");
      }
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "Network error while updating status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "ALL") {
        const orderDate = new Date(order.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === "TODAY" && now - orderDate > oneDay) return false;
        if (dateFilter === "WEEK" && now - orderDate > 7 * oneDay) return false;
        if (dateFilter === "MONTH" && now - orderDate > 30 * oneDay) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNum = order.orderNumber.toLowerCase().includes(term);
        const matchesCustomer = order.customerName.toLowerCase().includes(term);
        const matchesBusiness = (order.businessName || "").toLowerCase().includes(term);
        const matchesPhone = order.customerPhone.includes(term);
        const matchesItems = order.itemsSummary.toLowerCase().includes(term);

        if (!matchesNum && !matchesCustomer && !matchesBusiness && !matchesPhone && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const pendingCount = orders.filter((o) => o.status === "REQUESTED").length;
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
      case "PROCESSING":
      case "READY_FOR_DISPATCH":
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Success / Error Notifications */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80 dark:border-border-dark/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-text-primary dark:text-text-primary-dark tracking-tight">
            Wholesale Orders
          </h1>
          <p className="text-xs sm:text-sm text-text-muted dark:text-text-muted-dark mt-0.5">
            Manage dealer bulk order requests, status updates, pricing negotiations, and fulfillment
          </p>
        </div>

        <a
          href="/api/admin/orders/export"
          download
          className="self-start sm:self-auto px-3.5 py-2 bg-primary hover:bg-forest-light text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-accent-brass" />
          <span>Export Orders CSV</span>
        </a>
      </div>

      {/* Quick Status Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {[
          { key: "ALL", label: `All Orders (${orders.length})` },
          { key: "REQUESTED", label: `Pending Requests (${pendingCount})` },
          { key: "CONFIRMED", label: `Confirmed (${confirmedCount})` },
          { key: "SHIPPED", label: "In Transit" },
          { key: "DELIVERED", label: "Delivered" },
          { key: "CANCELLED", label: "Cancelled / Rejected" },
        ].map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                active
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-text-muted dark:text-text-muted-dark hover:bg-ivory dark:hover:bg-forest-muted"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Controls & Search Filter */}
      <div className="bg-card dark:bg-card-dark p-3.5 rounded-xl border border-border dark:border-border-dark flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order #, retailer, mobile number, handset model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-ivory/60 dark:bg-forest-muted/30 border border-border dark:border-border-dark rounded-lg text-xs text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent-brass"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-ivory/60 dark:bg-forest-muted/30 px-3 py-1.5 rounded-lg border border-border dark:border-border-dark text-xs">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-text-primary dark:text-text-primary-dark focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Last 24 Hours</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Container: Cards for small phones, table for tablet/desktop */}
      <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark overflow-hidden shadow-2xs">
        {/* Mobile Cards List (< sm) */}
        <div className="block sm:hidden divide-y divide-border/60 dark:divide-border-dark/60">
          {filteredOrders.length === 0 ? (
            <div className="py-12 px-4 text-center text-text-muted dark:text-text-muted-dark text-xs">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No orders match your filter criteria.
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div key={ord.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-text-primary dark:text-text-primary-dark">
                      #{ord.orderNumber}
                    </span>
                    <p className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
                      {formatDateTime(ord.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(
                      ord.status
                    )}`}
                  >
                    {ord.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="bg-ivory/60 dark:bg-forest-muted/30 p-2.5 rounded-lg space-y-1 text-xs border border-border/50 dark:border-border-dark/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary dark:text-text-primary-dark">
                      {ord.businessName || ord.customerName}
                    </span>
                    <span className="text-[11px] text-text-muted font-mono">
                      {ord.customerPhone}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted dark:text-text-muted-dark line-clamp-1">
                    {ord.totalUnits} Units • {ord.itemsSummary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 dark:border-border-dark/40">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-text-muted block">
                      Order Total
                    </span>
                    <span className="font-bold text-sm text-text-primary dark:text-text-primary-dark tabular-nums">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(ord.status === "REQUESTED" ||
                      ord.status === "UNDER_REVIEW" ||
                      ord.status === "AWAITING_CUSTOMER_APPROVAL") && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            setActiveModalOrder(ord);
                            setModalAction("ACCEPT");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
                          title="Accept Order & Allocate Stock"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            setDeclineReason("");
                            setActiveModalOrder(ord);
                            setModalAction("DECLINE");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
                          title="Decline Order"
                        >
                          <X className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-forest-light text-white text-xs font-semibold rounded-lg transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-accent-brass" />
                      <span>Manage</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Full Data Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-xs">
            <thead className="bg-ivory/60 dark:bg-forest-dark/40 text-text-muted dark:text-text-muted-dark uppercase font-semibold text-[10px] tracking-wider border-b border-border dark:border-border-dark">
              <tr>
                <th className="py-3 px-4">Order # & Date</th>
                <th className="py-3 px-4">Retailer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Items / SKUs</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted dark:text-text-muted-dark">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-ivory/40 dark:hover:bg-forest-muted/20 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-semibold text-text-primary dark:text-text-primary-dark">
                        #{ord.orderNumber}
                      </div>
                      <div className="text-[10px] text-text-muted dark:text-text-muted-dark">{formatDateTime(ord.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary dark:text-text-primary-dark">
                        {ord.businessName || ord.customerName}
                      </div>
                      {ord.businessName && (
                        <div className="text-[10px] text-text-muted dark:text-text-muted-dark">Owner: {ord.customerName}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-text-primary dark:text-text-primary-dark">
                      <div className="tabular-nums">{ord.customerPhone}</div>
                      <div className="text-[10px] text-text-muted dark:text-text-muted-dark truncate max-w-[140px]">{ord.customerEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary dark:text-text-primary-dark tabular-nums">
                        {ord.totalUnits} Units
                      </div>
                      <div className="text-[11px] text-text-muted dark:text-text-muted-dark line-clamp-1 max-w-xs" title={ord.itemsSummary}>
                        {ord.itemsSummary}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-text-primary dark:text-text-primary-dark tabular-nums">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(ord.status === "REQUESTED" ||
                          ord.status === "UNDER_REVIEW" ||
                          ord.status === "AWAITING_CUSTOMER_APPROVAL") && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setModalError(null);
                                setActiveModalOrder(ord);
                                setModalAction("ACCEPT");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition shadow-2xs"
                              title="Accept Order & Allocate Stock"
                            >
                              <Check className="w-3 h-3" />
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModalError(null);
                                setDeclineReason("");
                                setActiveModalOrder(ord);
                                setModalAction("DECLINE");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md transition shadow-2xs"
                              title="Decline Order"
                            >
                              <X className="w-3 h-3" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-ivory/80 hover:bg-ivory dark:bg-forest-muted dark:hover:bg-forest text-text-primary dark:text-text-primary-dark border border-border dark:border-border-dark text-xs font-semibold rounded-md transition"
                        >
                          <Eye className="w-3 h-3 text-text-muted" />
                          <span>Details</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept Order Quick Action Modal */}
      {activeModalOrder && modalAction === "ACCEPT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Accept Order #{activeModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allocate stock and confirm wholesale request
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Accepting this order for <strong>{activeModalOrder.businessName || activeModalOrder.customerName}</strong> will allocate stock for <strong>{activeModalOrder.totalUnits} units</strong> ({formatCurrency(activeModalOrder.totalAmount)}).
            </p>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalOrder(null);
                  setModalAction(null);
                  setModalError(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusUpdate(activeModalOrder.id, "CONFIRMED")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Accept Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Order Quick Action Modal */}
      {activeModalOrder && modalAction === "DECLINE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Decline Order #{activeModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reject wholesale purchase request
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to decline this order request? The order status will be marked as <strong>REJECTED</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Decline Reason / Dealer Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Model out of stock, awaiting shipment..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                maxLength={500}
              />
            </div>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalOrder(null);
                  setModalAction(null);
                  setModalError(null);
                  setDeclineReason("");
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusUpdate(activeModalOrder.id, "REJECTED", declineReason)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Confirm Decline Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
