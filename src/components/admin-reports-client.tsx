"use client";

import React, { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  Package,
  Boxes,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface StatusReportItem {
  status: string;
  count: number;
  totalAmount: number;
}

interface BestSellerItem {
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface InventoryRiskItem {
  sku: string;
  productName: string;
  brandName: string;
  onHandStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  condition: string;
}

interface MovementItem {
  id: string;
  productName: string;
  sku: string;
  changeQty: number;
  reason: string;
  balanceOnHand: number;
  balanceReserved: number;
  createdAt: string;
}

interface AdminReportsClientProps {
  statusBreakdown: StatusReportItem[];
  bestSellers: BestSellerItem[];
  inventoryRisks: InventoryRiskItem[];
  recentMovements: MovementItem[];
}

export function AdminReportsClient({
  statusBreakdown,
  bestSellers,
  inventoryRisks,
  recentMovements,
}: AdminReportsClientProps) {
  const [tab, setTab] = useState<"STATUS" | "BEST_SELLERS" | "INVENTORY" | "MOVEMENTS">(
    "STATUS"
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab("STATUS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              tab === "STATUS"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Order Status Breakdown
          </button>

          <button
            onClick={() => setTab("BEST_SELLERS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              tab === "BEST_SELLERS"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Best-Selling Handsets ({bestSellers.length})
          </button>

          <button
            onClick={() => setTab("INVENTORY")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              tab === "INVENTORY"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low & Out of Stock ({inventoryRisks.length})
          </button>

          <button
            onClick={() => setTab("MOVEMENTS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              tab === "MOVEMENTS"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Inventory Movements
          </button>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <a
            href={
              tab === "BEST_SELLERS"
                ? "/api/admin/reports/export?type=BEST_SELLERS"
                : tab === "INVENTORY"
                ? "/api/admin/reports/export?type=INVENTORY_HEALTH"
                : "/api/admin/reports/export?type=SALES"
            }
            download
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Selected Report
          </a>
        </div>
      </div>

      {/* TAB 1: ORDER STATUS BREAKDOWN */}
      {tab === "STATUS" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Authoritative PostgreSQL Order Lifecycle Totals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Confirmed pipeline and collected revenue are strictly segregated from unapproved buyer requests
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusBreakdown.map((s) => (
              <div
                key={s.status}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {s.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 tabular-nums">
                    {s.count} orders
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(s.totalAmount)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {s.status === "DELIVERED"
                    ? "Collected revenue"
                    : s.status === "REQUESTED"
                    ? "Pending dealer review"
                    : "Committed pipeline value"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BEST SELLING HANDSETS */}
      {tab === "BEST_SELLERS" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Top Selling Handsets by Order Demand
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aggregated directly from verified order line items</p>
          </div>

          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Handset Model</th>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5 text-center">Total Units Booked</th>
                <th className="px-5 py-3.5 text-right">Gross Booking Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bestSellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    No order item data recorded yet.
                  </td>
                </tr>
              ) : (
                bestSellers.map((item, index) => (
                  <tr key={item.sku} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white tabular-nums">
                      #{index + 1}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-900 dark:text-white tabular-nums">
                      {item.totalQuantity} pcs
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: INVENTORY HEALTH */}
      {tab === "INVENTORY" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Inventory Attention List: Out of Stock & Low Stock
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifies models requiring distributor purchase order replenishments
            </p>
          </div>

          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">SKU & Handset</th>
                <th className="px-5 py-3.5">Brand</th>
                <th className="px-5 py-3.5 text-center">On-Hand</th>
                <th className="px-5 py-3.5 text-center">Reserved</th>
                <th className="px-5 py-3.5 text-center">Live Available</th>
                <th className="px-5 py-3.5 text-center">Threshold</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inventoryRisks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-emerald-600">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    All active smartphone SKUs have healthy stock levels!
                  </td>
                </tr>
              ) : (
                inventoryRisks.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">
                        {item.sku}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.productName}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {item.brandName}
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium tabular-nums">{item.onHandStock}</td>
                    <td className="px-5 py-3.5 text-center text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                      {item.reservedStock}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      {item.availableStock}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500 tabular-nums">
                      {item.lowStockThreshold}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          item.condition === "OUT_OF_STOCK"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                        }`}
                      >
                        {item.condition}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: RECENT MOVEMENTS */}
      {tab === "MOVEMENTS" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Warehouse Inventory Movement Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Complete audit trail of stock adjustments and order deductions</p>
          </div>

          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Handset & SKU</th>
                <th className="px-5 py-3.5">Movement Reason</th>
                <th className="px-5 py-3.5 text-center">Quantity Delta</th>
                <th className="px-5 py-3.5 text-right">Balance After Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                recentMovements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 tabular-nums">{formatDateTime(mv.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{mv.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{mv.sku}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {mv.reason}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          mv.changeQty >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {mv.changeQty >= 0 ? `+${mv.changeQty}` : mv.changeQty} pcs
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-900 dark:text-white tabular-nums">
                      {mv.balanceOnHand} hand / {mv.balanceReserved} res
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
