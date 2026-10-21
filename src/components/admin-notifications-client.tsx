"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import {
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Package,
  Boxes,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

interface DeliveryItem {
  id: string;
  type: string;
  recipient: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

interface SubscriptionItem {
  id: string;
  variantId: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  productName: string;
  variantSku: string;
  customerName: string | null;
}

interface AdminNotificationsClientProps {
  initialDeliveries: DeliveryItem[];
  initialSubscriptions: SubscriptionItem[];
}

export function AdminNotificationsClient({
  initialDeliveries,
  initialSubscriptions,
}: AdminNotificationsClientProps) {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(initialDeliveries);
  const [activeTab, setActiveTab] = useState<"DELIVERIES" | "SUBSCRIPTIONS">("DELIVERIES");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [markingAll, setMarkingAll] = useState(false);

  const pendingCount = deliveries.filter((d) => d.status === "PENDING").length;

  const filteredDeliveries = deliveries.filter((d) => {
    if (typeFilter !== "ALL" && d.type !== typeFilter) return false;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "SENT" } : d))
        );
      }
    } catch (e) {
      console.error("Mark read error:", e);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      });

      if (res.ok) {
        setDeliveries((prev) => prev.map((d) => ({ ...d, status: "SENT" })));
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW_REGISTRATION":
        return <UserCheck className="w-4 h-4 text-amber-500" />;
      case "USER_LOGIN":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case "RESTOCK":
        return <Boxes className="w-4 h-4 text-emerald-500" />;
      case "ORDER_STATUS":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "DEALER_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs & Actions */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("DELIVERIES")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === "DELIVERIES"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notification Deliveries ({deliveries.length})
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {pendingCount} unread
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("SUBSCRIPTIONS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === "SUBSCRIPTIONS"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retailer Back-in-Stock Alerts ({initialSubscriptions.length})
          </button>
        </div>

        {activeTab === "DELIVERIES" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="RESTOCK">Restock Alerts</option>
                <option value="ORDER_STATUS">Order Status</option>
                <option value="DEALER_MESSAGE">Dealer Message</option>
              </select>
            </div>

            {pendingCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition"
              >
                Mark All Read
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content for Deliveries */}
      {activeTab === "DELIVERIES" ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {filteredDeliveries.length === 0 ? (
            <div className="p-14 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No notifications matching your filter.</p>
            </div>
          ) : (
            filteredDeliveries.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === "PENDING"
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-amber-500"
                    : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{item.body}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      <span>Recipient: {item.recipient}</span>
                      <span>•</span>
                      <span className="tabular-nums">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.type === "NEW_REGISTRATION" && (
                    <Link
                      href="/admin/registration-requests"
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded font-medium text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Review Request</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {item.status === "PENDING" ? (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium text-[11px] rounded-lg transition"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Handled
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Content for Subscriptions */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Handset & SKU</th>
                <th className="px-5 py-3.5">Retailer / Subscriber</th>
                <th className="px-5 py-3.5">Email & Phone</th>
                <th className="px-5 py-3.5">Subscribed Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {initialSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active retailer restock requests at this time.</p>
                  </td>
                </tr>
              ) : (
                initialSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sub.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{sub.variantSku}</div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      {sub.customerName || "Guest Retailer"}
                    </td>

                    <td className="px-5 py-3.5">
                      <div>{sub.email}</div>
                      {sub.phone && <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{sub.phone}</div>}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatDateTime(sub.createdAt).slice(0, 11)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          sub.status === "ACTIVE"
                            ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                            : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href="/admin/inventory"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-900 dark:text-slate-100 hover:underline"
                      >
                        Restock in Inventory &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
