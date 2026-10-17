"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import {
  Send,
  MessageSquare,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  FileText,
  User as UserIcon,
} from "lucide-react";

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
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Parse Address Snapshot safely
  let address: any = {};
  try {
    address = JSON.parse(order.shippingAddressSnapshot);
  } catch {
    address = {};
  }

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Periodic polling for chat messages & status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/sync`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          setStatus(data.status);
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

  // Status Badge Colors & Labels
  const getStatusBadge = (st: string) => {
    switch (st) {
      case "REQUESTED":
        return {
          bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
          label: "Requested (Awaiting Dealer Review)",
        };
      case "CONFIRMED":
        return {
          bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
          label: "Dealer Confirmed (Stock Allocated)",
        };
      case "PROCESSING":
        return {
          bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
          label: "Processing in Warehouse",
        };
      case "READY_FOR_DISPATCH":
        return {
          bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
          label: "Ready for Dispatch / Freight",
        };
      case "DELIVERED":
        return {
          bg: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
          label: "Delivered to Retail Outlet",
        };
      case "CANCELLED":
        return {
          bg: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
          label: "Order Cancelled",
        };
      case "REJECTED":
        return {
          bg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
          label: "Dealer Rejected",
        };
      default:
        return {
          bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
          label: st,
        };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back to Orders Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Placed on {formatDateTime(order.createdAt)} • Retailer:{" "}
              {order.customer.businessName || order.customer.name}
            </p>
          </div>
        </div>

        {/* OWNER ACTIONS (Confirm / Reject / Dispatch) */}
        {currentUserRole === "OWNER" && (
          <div className="flex items-center gap-2">
            {status === "REQUESTED" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("CONFIRMED")}
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Accept & Allocate Stock
                </button>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Reject Request
                </button>
              </>
            )}

            {status === "CONFIRMED" && (
              <button
                onClick={() => handleUpdateStatus("PROCESSING")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Move to Warehouse Processing
              </button>
            )}

            {status === "PROCESSING" && (
              <button
                onClick={() => handleUpdateStatus("READY_FOR_DISPATCH")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Mark Ready for Dispatch
              </button>
            )}

            {status === "READY_FOR_DISPATCH" && (
              <button
                onClick={() => handleUpdateStatus("DELIVERED")}
                disabled={statusActionLoading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Confirm Verified Delivery
              </button>
            )}
          </div>
        )}

        {/* CUSTOMER ACTIONS (Cancel before confirmation) */}
        {currentUserRole === "CUSTOMER" && status === "REQUESTED" && (
          <button
            onClick={() => handleUpdateStatus("CANCELLED")}
            disabled={statusActionLoading}
            className="px-4 py-2 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            Cancel Order Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Order Items & Shipping Address Snapshot */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FCA311]" />
              Wholesale Order Line Items
            </h2>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-gray-500">{item.variantName}</p>
                    <p className="text-[11px] font-mono text-gray-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Wholesale Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18% Input Credit)</span>
                <span>Included in invoice</span>
              </div>
              <div className="flex justify-between font-black text-base text-[#14213D] dark:text-[#FCA311] pt-2 border-t border-gray-100 dark:border-gray-700">
                <span>Final Order Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Details Snapshot */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#FCA311]" />
              Shipping Destination & Transit Instructions
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">
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
                <p className="pt-2 text-amber-700 dark:text-amber-400 italic">
                  Note: {address.instructions}
                </p>
              )}
              {address.latitude && address.longitude && (
                <p className="text-[10px] text-gray-400 font-mono pt-1">
                  GPS Coordinates: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Persistent Order Dealer Chat */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[600px] shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FCA311]" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Order Discussion Desk
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Direct conversation between Retailer & Dealer
                  </p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Sync Active" />
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
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
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          {isOwnerSender ? "Jagdamba Desk" : msg.sender?.name || "Retailer"}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          isMe
                            ? "bg-[#14213D] text-white rounded-br-none"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type your message to dealer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2.5 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
