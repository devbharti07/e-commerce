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
  ShieldCheck,
  MapPin,
  Clock,
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
          bg: "bg-[#B3853E]/10 text-[#B3853E] dark:text-[#D8AB64] border-[#B3853E]/30",
          label: "Requested (Awaiting Review)",
        };
      case "AWAITING_CUSTOMER_APPROVAL":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          label: "Awaiting Customer Approval",
        };
      case "CONFIRMED":
        return {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          label: "Confirmed (Stock Allocated)",
        };
      case "PROCESSING":
        return {
          bg: "bg-[#173B35]/15 text-[#173B35] dark:text-[#D8AB64] border-[#173B35]/30",
          label: "Processing in Warehouse",
        };
      case "READY_FOR_DISPATCH":
        return {
          bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
          label: "Ready for Dispatch",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          label: "Delivered to Retailer",
        };
      case "CANCELLED":
        return {
          bg: "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
          label: "Order Cancelled",
        };
      case "REJECTED":
        return {
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          label: "Dealer Rejected",
        };
      default:
        return {
          bg: "bg-[#EAECE8] text-[#17231E] dark:bg-[#18221D] dark:text-white border-[#DDE3DC]",
          label: st,
        };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] min-h-[85vh] transition-colors">
      {/* Back to Orders Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DDE3DC] dark:border-[#212E28]">
        <div className="flex items-center gap-3.5">
          <Link
            href="/orders"
            className="p-2.5 rounded-xl bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] hover:border-[#173B35] text-[#17231E] dark:text-[#E8EFEA] transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#17231E] dark:text-[#E8EFEA] font-mono">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-[#69736D] dark:text-[#9BA59E] mt-1">
              Placed on {formatDateTime(order.createdAt)} • Retailer:{" "}
              {order.customer.businessName || order.customer.name}
            </p>
          </div>
        </div>

        {/* OWNER ACTIONS (Confirm / Reject / Propose Revision / Dispatch) */}
        {currentUserRole === "OWNER" && (
          <div className="flex flex-wrap items-center gap-2.5">
            {(status === "REQUESTED" || status === "UNDER_REVIEW" || status === "AWAITING_CUSTOMER_APPROVAL") && (
              <>
                <button
                  onClick={() => setShowRevisionForm(!showRevisionForm)}
                  className="px-4 py-2 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  {showRevisionForm ? "Close Revision Form" : "Propose Revision"}
                </button>
                <button
                  onClick={() => handleUpdateStatus("CONFIRMED")}
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  Accept & Allocate Stock
                </button>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  Reject Request
                </button>
              </>
            )}

            {status === "CONFIRMED" && (
              <button
                onClick={() => handleUpdateStatus("PROCESSING")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-[#173B35] hover:bg-[#285C4D] text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
              >
                Move to Warehouse Processing
              </button>
            )}

            {status === "PROCESSING" && (
              <button
                onClick={() => handleUpdateStatus("READY_FOR_DISPATCH")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-[#173B35] hover:bg-[#285C4D] text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
              >
                Mark Ready for Dispatch
              </button>
            )}

            {status === "READY_FOR_DISPATCH" && (
              <button
                onClick={() => handleUpdateStatus("DELIVERED")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
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
            className="px-4 py-2 border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
          >
            Cancel Order Request
          </button>
        )}
      </div>

      {/* OWNER: Propose Revision Drawer / Form */}
      {currentUserRole === "OWNER" && showRevisionForm && (
        <form
          onSubmit={handleProposeRevision}
          className="bg-[#B3853E]/10 dark:bg-[#B3853E]/20 border border-[#B3853E]/30 p-6 rounded-2xl space-y-4 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-[#B3853E]" />
              Propose Order Revision to Customer
            </h3>
            <span className="text-xs text-[#17231E] dark:text-[#E8EFEA] font-mono tabular-nums">
              Current Total: {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
                Summary of Proposed Changes *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Volume discount of ₹1,480 applied for direct payment term"
                value={revisionSummary}
                onChange={(e) => setRevisionSummary(e.target.value)}
                className="w-full bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] rounded-xl px-3.5 py-2.5 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35]"
              />
            </div>

            <div>
              <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
                Revised Total Amount (in ₹ INR) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={revisionAmountRupees}
                onChange={(e) => setRevisionAmountRupees(e.target.value)}
                className="w-full bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] rounded-xl px-3.5 py-2.5 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35] font-semibold tabular-nums font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRevisionForm(false)}
              className="px-4 py-2 text-xs font-semibold text-[#69736D] hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRevision}
              className="px-5 py-2 bg-[#173B35] hover:bg-[#285C4D] text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {submittingRevision ? "Submitting Revision..." : "Send Revision for Customer Approval"}
            </button>
          </div>
        </form>
      )}

      {/* CUSTOMER: Pending Revision Alert with Action Buttons */}
      {currentUserRole === "CUSTOMER" && pendingRevision && (
        <div className="bg-[#B3853E]/10 dark:bg-[#B3853E]/20 border border-[#B3853E]/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B3853E] text-white text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action Required: Dealer Proposed an Order Revision
              </span>
              <h3 className="text-sm font-bold text-[#17231E] dark:text-white mt-2.5">
                Revision #{pendingRevision.revisionNumber}: {pendingRevision.changesSummary}
              </h3>
              <p className="text-xs text-[#69736D] dark:text-[#9BA59E] mt-1">
                Previous Total: <span className="line-through tabular-nums font-mono">{formatCurrency(pendingRevision.previousTotal)}</span>{" "}
                ➔ Revised Total: <strong className="text-emerald-700 dark:text-emerald-400 text-xs tabular-nums font-mono">{formatCurrency(pendingRevision.newTotal)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleReviewRevision(pendingRevision.id, "ACCEPT")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Revision
              </button>
              <button
                onClick={() => handleReviewRevision(pendingRevision.id, "REJECT")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Order Items, Revisions History, & Shipping Address Snapshot */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-5 sm:p-6 space-y-4 shadow-2xs">
            <h2 className="font-bold text-sm uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B3853E]" />
              Wholesale Order Line Items
            </h2>

            <div className="divide-y divide-[#DDE3DC] dark:divide-[#212E28]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#17231E] dark:text-white">
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E]">{item.variantName}</p>
                    <p className="text-[10px] font-mono text-[#69736D]">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#69736D] tabular-nums font-mono">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="text-sm font-bold tabular-nums font-mono text-[#17231E] dark:text-white mt-0.5">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-[#DDE3DC] dark:border-[#212E28] space-y-2.5 text-xs">
              <div className="flex justify-between text-[#69736D] dark:text-[#9BA59E]">
                <span>Wholesale Subtotal</span>
                <span className="font-bold tabular-nums font-mono text-[#17231E] dark:text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-[#69736D] dark:text-[#9BA59E]">
                <span>GST (18% Input Credit)</span>
                <span>Included in invoice</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-[#17231E] dark:text-white pt-2.5 border-t border-[#DDE3DC] dark:border-[#212E28]">
                <span>Final Order Total</span>
                <span className="tabular-nums font-mono text-[#B3853E] dark:text-[#D8AB64]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Revisions History Log (if any revisions exist) */}
          {revisions.length > 0 && (
            <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-5 sm:p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-xs tracking-wider uppercase text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
                <History className="w-4 h-4 text-[#B3853E]" />
                Order Revisions History
              </h3>

              <div className="divide-y divide-[#DDE3DC] dark:divide-[#212E28] text-xs">
                {revisions.map((rev) => (
                  <div key={rev.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17231E] dark:text-white">
                          Revision #{rev.revisionNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            rev.status === "ACCEPTED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : rev.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-[#B3853E]/10 text-[#B3853E] border-[#B3853E]/30"
                          }`}
                        >
                          {rev.status}
                        </span>
                      </div>
                      <p className="text-[#69736D] dark:text-[#9BA59E] mt-1">{rev.changesSummary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#69736D] line-through tabular-nums font-mono">
                        {formatCurrency(rev.previousTotal)}
                      </p>
                      <p className="font-bold tabular-nums font-mono text-[#17231E] dark:text-white">
                        {formatCurrency(rev.newTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Details Snapshot */}
          <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-5 sm:p-6 space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs tracking-wider uppercase text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#B3853E]" />
              Shipping Destination & Transit Instructions
            </h3>
            <div className="text-xs text-[#69736D] dark:text-[#9BA59E] space-y-1 leading-relaxed">
              <p className="font-bold text-[#17231E] dark:text-white">
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
                <p className="pt-1.5 text-[#B3853E] dark:text-[#D8AB64] italic">
                  Note: {address.instructions}
                </p>
              )}
              {address.latitude && address.longitude && (
                <p className="text-[10px] text-[#69736D] font-mono pt-1">
                  GPS Coordinates: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Persistent Order Dealer Chat */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] flex flex-col h-[480px] sm:h-[560px] shadow-2xs overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-[#EAECE8]/70 dark:bg-[#212E28] border-b border-[#DDE3DC] dark:border-[#212E28] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-[#B3853E]" />
                <div>
                  <h3 className="font-bold text-xs text-[#17231E] dark:text-white">
                    Order Discussion Desk
                  </h3>
                  <p className="text-[10px] text-[#69736D] dark:text-[#9BA59E]">
                    Direct conversation between Retailer & Dealer (auto-synced)
                  </p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Polling Sync Active" />
            </div>

            {/* Chat Messages Log */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-[#69736D] text-xs">
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
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#69736D]">
                        <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA]">
                          {isOwnerSender ? "Jagdamba Desk" : msg.sender?.name || "Retailer"}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                          isMe
                            ? "bg-[#173B35] text-white rounded-br-none shadow-2xs"
                            : "bg-[#EAECE8] dark:bg-[#212E28] text-[#17231E] dark:text-white rounded-bl-none"
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
              className="p-3 bg-[#EAECE8]/70 dark:bg-[#212E28] border-t border-[#DDE3DC] dark:border-[#212E28] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type your message to dealer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#285C4D] rounded-xl px-3.5 py-2 text-xs text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35]"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2.5 bg-[#173B35] hover:bg-[#285C4D] text-white rounded-xl disabled:opacity-50 transition cursor-pointer shadow-2xs"
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
