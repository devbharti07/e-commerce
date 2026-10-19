"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Send,
  MessageSquare,
  Truck,
  AlertTriangle,
  ArrowLeft,
  FileText,
  History,
  Check,
  X,
  FileEdit,
} from "lucide-react";

interface AddressSnapshot {
  fullName?: string;
  mobileNumber?: string;
  houseOrShop?: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
}

interface OrderDetailClientProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    subtotal: number;
    taxAmount: number;
    deliveryFee: number;
    totalAmount: number;
    customerNotes: string | null;
    dealerNotes: string | null;
    shippingAddressSnapshot: string;
    createdAt: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone: string;
      businessName: string | null;
    };
    items: {
      id: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
    revisions: {
      id: string;
      revisionNumber: number;
      proposedByRole: string;
      changesSummary: string;
      previousTotal: number;
      newTotal: number;
      status: string;
      createdAt: string;
    }[];
    conversation: {
      id: string;
      messages: {
        id: string;
        senderId: string;
        senderRole: string;
        content: string;
        createdAt: string;
        sender: { name: string };
      }[];
    } | null;
  };
  currentUserRole: "CUSTOMER" | "OWNER";
  currentUserId: string;
}

export function OrderDetailClient({
  order,
  currentUserRole,
  currentUserId,
}: OrderDetailClientProps) {
  const [messages, setMessages] = useState(order.conversation?.messages || []);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [totalAmount, setTotalAmount] = useState(order.totalAmount);
  const [revisions, setRevisions] = useState(order.revisions || []);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  // Propose Revision Modal / Form state for Owner
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [revisionAmountRupees, setRevisionAmountRupees] = useState(
    (order.totalAmount / 100).toString()
  );
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Parse Address Snapshot safely
  let address: AddressSnapshot = {};
  try {
    address = JSON.parse(order.shippingAddressSnapshot);
  } catch {
    address = {};
  }

  // Scroll to bottom of chat inside container only
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Periodic polling for chat messages, status, total, and revisions
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/sync`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages) setMessages(data.messages);
          if (data.status) setStatus(data.status);
          if (data.totalAmount !== undefined) setTotalAmount(data.totalAmount);
          if (data.revisions) setRevisions(data.revisions);
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [order.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to transition this order to ${newStatus}?`)) return;

    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update order status");
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Owner submits a proposed revision
  const handleProposeRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(revisionAmountRupees);
    if (!revisionSummary.trim() || isNaN(rupees) || rupees <= 0) {
      alert("Please enter a valid summary and revised total amount in rupees.");
      return;
    }

    setSubmittingRevision(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changesSummary: revisionSummary.trim(),
          newTotal: Math.round(rupees * 100),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRevisions((prev) => [data.revision, ...prev]);
        setStatus(data.order.status);
        setShowRevisionForm(false);
        setRevisionSummary("");
      } else {
        alert(data.error || "Failed to propose revision");
      }
    } finally {
      setSubmittingRevision(false);
    }
  };

  // Customer accepts or rejects a revision
  const handleReviewRevision = async (revisionId: string, action: "ACCEPT" | "REJECT") => {
    const verb = action === "ACCEPT" ? "accept" : "decline";
    if (!confirm(`Are you sure you want to ${verb} this proposed order revision?`)) return;

    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/revisions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setRevisions((prev) =>
          prev.map((r) => (r.id === revisionId ? data.revision : r))
        );
        setStatus(data.order.status);
        setTotalAmount(data.order.totalAmount);
      } else {
        alert(data.error || `Failed to ${verb} revision`);
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Find any active pending revision
  const pendingRevision = revisions.find((r) => r.status === "PENDING");

  // Status Badge Colors & Labels
  const getStatusBadge = (st: string) => {
    switch (st) {
      case "REQUESTED":
        return {
          bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          label: "Requested (Awaiting Dealer Review)",
        };
      case "AWAITING_CUSTOMER_APPROVAL":
        return {
          bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          label: "Awaiting Customer Approval",
        };
      case "CONFIRMED":
        return {
          bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          label: "Dealer Confirmed (Stock Allocated)",
        };
      case "PROCESSING":
        return {
          bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          label: "Processing in Warehouse",
        };
      case "READY_FOR_DISPATCH":
        return {
          bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          label: "Ready for Dispatch / Freight",
        };
      case "DELIVERED":
        return {
          bg: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
          label: "Delivered to Retail Outlet",
        };
      case "CANCELLED":
        return {
          bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          label: "Order Cancelled",
        };
      case "REJECTED":
        return {
          bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          label: "Dealer Rejected",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          label: st,
        };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Back to Orders Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white font-mono">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {formatDateTime(order.createdAt)} • Retailer:{" "}
              {order.customer.businessName || order.customer.name}
            </p>
          </div>
        </div>

        {/* OWNER ACTIONS (Confirm / Reject / Propose Revision / Dispatch) */}
        {currentUserRole === "OWNER" && (
          <div className="flex flex-wrap items-center gap-2">
            {(status === "REQUESTED" || status === "UNDER_REVIEW" || status === "AWAITING_CUSTOMER_APPROVAL") && (
              <>
                <button
                  onClick={() => setShowRevisionForm(!showRevisionForm)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  {showRevisionForm ? "Close Revision Form" : "Propose Revision"}
                </button>
                <button
                  onClick={() => handleUpdateStatus("CONFIRMED")}
                  disabled={statusActionLoading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
                >
                  Accept & Allocate Stock
                </button>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={statusActionLoading}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
                >
                  Reject Request
                </button>
              </>
            )}

            {status === "CONFIRMED" && (
              <button
                onClick={() => handleUpdateStatus("PROCESSING")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
              >
                Move to Warehouse Processing
              </button>
            )}

            {status === "PROCESSING" && (
              <button
                onClick={() => handleUpdateStatus("READY_FOR_DISPATCH")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-medium text-xs rounded-lg shadow-xs transition"
              >
                Mark Ready for Dispatch
              </button>
            )}

            {status === "READY_FOR_DISPATCH" && (
              <button
                onClick={() => handleUpdateStatus("DELIVERED")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
              >
                Confirm Verified Delivery
              </button>
            )}
          </div>
        )}

        {/* CUSTOMER ACTIONS (Cancel before confirmation) */}
        {currentUserRole === "CUSTOMER" && (status === "REQUESTED" || status === "AWAITING_CUSTOMER_APPROVAL") && (
          <button
            onClick={() => handleUpdateStatus("CANCELLED")}
            disabled={statusActionLoading}
            className="px-3 py-1.5 border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium text-xs rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          >
            Cancel Order Request
          </button>
        )}
      </div>

      {/* OWNER: Propose Revision Drawer / Form */}
      {currentUserRole === "OWNER" && showRevisionForm && (
        <form
          onSubmit={handleProposeRevision}
          className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-5 rounded-xl space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-amber-600" />
              Propose Order Revision to Customer
            </h3>
            <span className="text-xs text-amber-700 dark:text-amber-400 tabular-nums">
              Current Total: {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-medium block text-slate-700 dark:text-slate-300 mb-1">
                Summary of Proposed Changes *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Volume discount of ₹1,480 applied for direct payment term"
                value={revisionSummary}
                onChange={(e) => setRevisionSummary(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-medium block text-slate-700 dark:text-slate-300 mb-1">
                Revised Total Amount (in ₹ INR) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={revisionAmountRupees}
                onChange={(e) => setRevisionAmountRupees(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRevisionForm(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRevision}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-medium text-xs rounded-lg transition disabled:opacity-50"
            >
              {submittingRevision ? "Submitting Revision..." : "Send Revision for Customer Approval"}
            </button>
          </div>
        </form>
      )}

      {/* CUSTOMER: Pending Revision Alert with Action Buttons */}
      {currentUserRole === "CUSTOMER" && pendingRevision && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Action Required: Dealer Proposed an Order Revision
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                Revision #{pendingRevision.revisionNumber}: {pendingRevision.changesSummary}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Previous Total: <span className="line-through tabular-nums">{formatCurrency(pendingRevision.previousTotal)}</span>{" "}
                ➔ Revised Total: <strong className="text-emerald-700 dark:text-emerald-400 text-xs tabular-nums">{formatCurrency(pendingRevision.newTotal)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleReviewRevision(pendingRevision.id, "ACCEPT")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Revision
              </button>
              <button
                onClick={() => handleReviewRevision(pendingRevision.id, "REJECT")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
              >
                <X className="w-3.5 h-3.5" />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Items, Revisions History, & Shipping Address Snapshot */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Wholesale Order Line Items
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-xs text-slate-900 dark:text-white">
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-slate-500">{item.variantName}</p>
                    <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 tabular-nums">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Wholesale Subtotal</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST (18% Input Credit)</span>
                <span>Included in invoice</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Final Order Total</span>
                <span className="tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Revisions History Log (if any revisions exist) */}
          {revisions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Order Revisions History
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {revisions.map((rev) => (
                  <div key={rev.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Revision #{rev.revisionNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            rev.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : rev.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {rev.status}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">{rev.changesSummary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 line-through tabular-nums">
                        {formatCurrency(rev.previousTotal)}
                      </p>
                      <p className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(rev.newTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Details Snapshot */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3 shadow-xs">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              Shipping Destination & Transit Instructions
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {address.fullName} ({address.mobileNumber})
              </p>
              <p>
                {address.houseOrShop}, {address.street}
              </p>
              <p>
                {address.locality ? `${address.locality}, ` : ""}
                {address.city}, {address.state} - {address.pinCode}
              </p>
              {address.instructions && (
                <p className="pt-1.5 text-amber-700 dark:text-amber-400 italic">
                  Note: {address.instructions}
                </p>
              )}
              {address.latitude && address.longitude && (
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  GPS Coordinates: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Persistent Order Dealer Chat */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[480px] sm:h-[560px] shadow-xs overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                    Order Discussion Desk
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Direct conversation between Retailer & Dealer (auto-synced)
                  </p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Polling Sync Active" />
            </div>

            {/* Chat Messages Log */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p>No messages yet. Send a note to discuss terms or delivery schedule.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const isOwnerSender = msg.senderRole === "OWNER";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {isOwnerSender ? "Jagdamba Desk" : msg.sender?.name || "Retailer"}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                          isMe
                            ? "bg-slate-900 text-white rounded-br-none dark:bg-slate-100 dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type your message to dealer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg disabled:opacity-50 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
