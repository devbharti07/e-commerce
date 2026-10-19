"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
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
  }, [initialOrders, searchTerm, statusFilter, dateFilter]);

  const pendingCount = initialOrders.filter((o) => o.status === "REQUESTED").length;
  const confirmedCount = initialOrders.filter((o) => o.status === "CONFIRMED").length;

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Wholesale Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage dealer bulk order requests, status updates, pricing negotiations, and fulfillment
          </p>
        </div>

        <a
          href="/api/admin/orders/export"
          download
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>Export Orders CSV</span>
        </a>
      </div>

      {/* Quick Status Tabs Strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        {[
          { key: "ALL", label: `All Orders (${initialOrders.length})` },
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
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Controls & Search Filter */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order #, retailer, mobile number, handset model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Last 24 Hours</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Order # & Date</th>
                <th className="py-2.5 px-4">Retailer</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Items / SKUs</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Order Total</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        #{ord.orderNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(ord.createdAt)}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {ord.businessName || ord.customerName}
                      </div>
                      {ord.businessName && (
                        <div className="text-[10px] text-slate-400">Owner: {ord.customerName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="tabular-nums">{ord.customerPhone}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{ord.customerEmail}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {ord.totalUnits} Units
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs" title={ord.itemsSummary}>
                        {ord.itemsSummary}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-md transition"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
