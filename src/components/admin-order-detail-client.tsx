"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Send,
  MessageSquare,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Clock,
  History,
  Check,
  X,
  FileEdit,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Package,
  Layers,
  Copy,
} from "lucide-react";

interface AdminOrderDetailClientProps {
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
  currentUserId: string;
}

export function AdminOrderDetailClient({
  order,
  currentUserId,
}: AdminOrderDetailClientProps) {
  const [messages, setMessages] = useState(order.conversation?.messages || []);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [totalAmount, setTotalAmount] = useState(order.totalAmount);
  const [revisions, setRevisions] = useState(order.revisions || []);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Propose Revision Modal / Form state for Owner
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [revisionAmountRupees, setRevisionAmountRupees] = useState(
    (order.totalAmount / 100).toString()
  );
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Parse Address Snapshot safely
  let address: any = {};
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

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    const label =
      newStatus === "CONFIRMED"
        ? "confirm this order and allocate stock"
        : newStatus === "REJECTED"
        ? "reject this wholesale order request"
        : newStatus === "PROCESSING"
        ? "move order to warehouse processing"
        : newStatus === "READY_FOR_DISPATCH"
        ? "mark order ready for dispatch"
        : newStatus === "DELIVERED"
        ? "confirm final delivered status"
        : `transition order to ${newStatus}`;

    if (!confirm(`Are you sure you want to ${label}?`)) return;

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

  // Status Badge Colors & Labels
  const getStatusBadge = (st: string) => {
    switch (st) {
      case "REQUESTED":
        return {
          bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          label: "Requested (Awaiting Review)",
        };
      case "AWAITING_CUSTOMER_APPROVAL":
        return {
          bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          label: "Awaiting Customer Approval",
        };
      case "CONFIRMED":
        return {
          bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          label: "Stock Allocated & Confirmed",
        };
      case "PROCESSING":
        return {
          bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          label: "Processing in Warehouse",
        };
      case "READY_FOR_DISPATCH":
        return {
          bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          label: "Ready for Dispatch",
        };
      case "DELIVERED":
        return {
          bg: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
          label: "Delivered to Retailer",
        };
      case "CANCELLED":
        return {
          bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          label: "Order Cancelled",
        };
      case "REJECTED":
        return {
          bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          label: "Order Rejected",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          label: st,
        };
    }
  };

  const statusBadge = getStatusBadge(status);

  // Stepper Stage Calculation
  const getStageIndex = (st: string) => {
    switch (st) {
      case "REQUESTED":
      case "UNDER_REVIEW":
      case "AWAITING_CUSTOMER_APPROVAL":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PROCESSING":
        return 2;
      case "READY_FOR_DISPATCH":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return -1;
    }
  };

  const currentStage = getStageIndex(status);
  const isTerminalNegative = status === "CANCELLED" || status === "REJECTED";

  const stages = [
    { label: "Request Placed", desc: "Submitted by retailer" },
    { label: "Stock Allocated", desc: "Confirmed by dealer" },
    { label: "Warehouse Pack", desc: "Inspection & pack" },
    { label: "Transit Dispatch", desc: "e-Way bill & cargo" },
    { label: "Delivered", desc: "Signed receipt" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Link
              href="/admin/orders"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shrink-0"
              title="Return to Orders Table"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  Order #{order.orderNumber}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  title="Copy order number"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${statusBadge.bg}`}
                >
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Placed on {formatDateTime(order.createdAt)}</span>
                <span>•</span>
                <span>Retailer: <strong className="text-slate-800 dark:text-slate-200">{order.customer.businessName || order.customer.name}</strong></span>
              </p>
            </div>
          </div>

          {/* Operational Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {(status === "REQUESTED" ||
              status === "UNDER_REVIEW" ||
              status === "AWAITING_CUSTOMER_APPROVAL") && (
              <>
                <button
                  onClick={() => setShowRevisionForm(!showRevisionForm)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  {showRevisionForm ? "Hide Revision Form" : "Propose Price Revision"}
                </button>
                <button
                  onClick={() => handleUpdateStatus("CONFIRMED")}
                  disabled={statusActionLoading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept & Allocate Stock
                </button>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={statusActionLoading}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject Request
                </button>
              </>
            )}

            {status === "CONFIRMED" && (
              <button
                onClick={() => handleUpdateStatus("PROCESSING")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                Move to Warehouse Processing
              </button>
            )}

            {status === "PROCESSING" && (
              <button
                onClick={() => handleUpdateStatus("READY_FOR_DISPATCH")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                Mark Ready for Dispatch
              </button>
            )}

            {status === "READY_FOR_DISPATCH" && (
              <button
                onClick={() => handleUpdateStatus("DELIVERED")}
                disabled={statusActionLoading}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Verified Delivery
              </button>
            )}
          </div>
        </div>

        {/* Fulfillment Stepper */}
        {!isTerminalNegative ? (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {stages.map((stage, idx) => {
                const isPassed = currentStage >= idx;
                const isCurrent = currentStage === idx;

                return (
                  <div
                    key={stage.label}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      isCurrent
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                        : isPassed
                        ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/60 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? "bg-amber-400 text-slate-900"
                            : isPassed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        {isPassed && !isCurrent ? "✓" : idx + 1}
                      </span>
                      <p className="font-semibold truncate">{stage.label}</p>
                    </div>
                    <p
                      className={`text-[10px] mt-0.5 truncate ${
                        isCurrent
                          ? "text-slate-300 dark:text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              This order request is currently in <strong>{status}</strong> status. No further inventory is reserved.
            </span>
          </div>
        )}
      </div>

      {/* Propose Revision Drawer / Form */}
      {showRevisionForm && (
        <form
          onSubmit={handleProposeRevision}
          className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-5 rounded-xl space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-amber-600" />
              Propose Order Price / Terms Revision to Retailer
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

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Order Items, Revisions, Logistics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Wholesale Smartphone Line Items ({order.items.reduce((acc, it) => acc + it.quantity, 0)} units)
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {order.items.length} unique variant{order.items.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-2.5">Smartphone Model & SKU</th>
                    <th className="pb-2.5 text-right">Unit Price</th>
                    <th className="pb-2.5 text-right">Qty</th>
                    <th className="pb-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.variantName}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          SKU: {item.sku}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                        {item.quantity} pcs
                      </td>
                      <td className="py-3 pl-4 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Wholesale Subtotal</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(order.subtotal || totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST (18% Input Tax Credit Eligible)</span>
                <span className="text-slate-500">Included in final tax invoice</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Insured Freight & Handling</span>
                <span className="text-slate-500">Transit insurance included</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <span>Total Commercial Invoice Value</span>
                <span className="tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Transit Destination Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              Verified Shipping Destination & Logistics Dispatch
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Recipient Store & Contact</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {address.fullName || order.customer.name}
                </p>
                <p className="font-mono text-slate-600 dark:text-slate-300">
                  {address.mobileNumber || order.customer.phone}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Dispatch Delivery Address</span>
                <p className="leading-relaxed">
                  {address.houseOrShop}, {address.street}
                </p>
                <p>
                  {address.locality ? `${address.locality}, ` : ""}
                  {address.city}, {address.state} - {address.pinCode}
                </p>
                {address.instructions && (
                  <p className="pt-1 text-amber-700 dark:text-amber-400 italic">
                    Note: {address.instructions}
                  </p>
                )}
                {address.latitude && address.longitude && (
                  <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                    GPS Coordinates: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Revisions History Log (if any revisions exist) */}
          {revisions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Price Revision Log
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {revisions.map((rev) => (
                  <div key={rev.id} className="py-2.5 flex items-center justify-between">
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
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(rev.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">{rev.changesSummary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 line-through tabular-nums text-[11px]">
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
        </div>

        {/* Right Column (4 cols): Retailer Card, Customer Notes, Chat */}
        <div className="lg:col-span-4 space-y-6">
          {/* Retailer Account Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-xs">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              Retail Partner Account
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Store Legal Entity
                </span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5">
                  {order.customer.businessName || "Individual Dealer"}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Contact Person
                </span>
                <p className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {order.customer.name}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Registered Mobile
                </span>
                <a
                  href={`tel:${order.customer.phone}`}
                  className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-mono mt-0.5 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {order.customer.phone}
                </a>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Email Address
                </span>
                <a
                  href={`mailto:${order.customer.email}`}
                  className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 truncate mt-0.5 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{order.customer.email}</span>
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Retail Partner
                </span>
                <Link
                  href={`/admin/retailers`}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline"
                >
                  Retailers Directory &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Customer Special Notes Card (if present) */}
          {order.customerNotes && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-1.5 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Retailer Special Instructions
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                "{order.customerNotes}"
              </p>
            </div>
          )}

          {/* Order Discussion Desk (Live Chat) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[520px] shadow-xs overflow-hidden">
            {/* Chat Header */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                    Order Discussion Desk
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Direct conversation with retailer
                  </p>
                </div>
              </div>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                title="Live Polling Sync Active"
              />
            </div>

            {/* Chat Messages Feed */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <p>No messages yet.</p>
                  <p className="text-[11px] mt-1">Send a message to update the retailer on allocation or dispatch.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnerSender = msg.senderRole === "OWNER";
                  const isMe = msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwnerSender ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {isOwnerSender ? "Jagdamba Desk (Admin)" : msg.sender?.name || "Retailer"}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                          isOwnerSender
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

            {/* Message Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Reply to retailer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg disabled:opacity-50 transition"
                title="Send Message"
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
