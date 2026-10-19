"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Minus, Check, RefreshCw } from "lucide-react";

interface VariantItem {
  id: string;
  sku: string;
  productName: string;
  brandName: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  baseWholesalePrice: number;
  minOrderQty: number;
  lowStockThreshold: number;
  onHandStock: number;
  reservedStock: number;
  isAvailable: boolean;
}

export function AdminInventoryClient({
  initialVariants,
}: {
  initialVariants: VariantItem[];
}) {
  const [variants, setVariants] = useState<VariantItem[]>(initialVariants);
  const [search, setSearch] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("RESTOCK");
  const [saving, setSaving] = useState(false);

  const filtered = variants.filter(
    (v) =>
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.brandName.toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyAdjustment = async (variantId: string) => {
    if (adjustQty === 0) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          changeQty: adjustQty,
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVariants((prev) =>
          prev.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  onHandStock: data.variant.onHandStock,
                  reservedStock: data.variant.reservedStock,
                }
              : v
          )
        );
        setAdjustingId(null);
        setAdjustQty(0);
      } else {
        const err = await res.json();
        alert(err.error || "Adjustment failed");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Filter by SKU, handset name, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Showing <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{filtered.length}</span> SKUs
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <table className="w-full min-w-[750px] text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Handset & SKU</th>
              <th className="px-5 py-3.5">Configuration</th>
              <th className="px-5 py-3.5">Wholesale Base</th>
              <th className="px-5 py-3.5 text-center">On-Hand</th>
              <th className="px-5 py-3.5 text-center">Reserved</th>
              <th className="px-5 py-3.5 text-center">Available Live</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-right">Stock Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No inventory records match your search filter.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try searching with a different SKU or handset model.</p>
                </td>
              </tr>
            ) : (
              filtered.map((v) => {
                const available = v.onHandStock - v.reservedStock;
                const isEditing = adjustingId === v.id;

                return (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {v.productName}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {v.sku}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                      {v.ramGb}GB / {v.storageGb}GB • {v.colorName}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(v.baseWholesalePrice)}
                    </td>

                    <td className="px-5 py-3.5 text-center font-semibold text-slate-900 dark:text-white tabular-nums">
                      {v.onHandStock}
                    </td>

                    <td className="px-5 py-3.5 text-center text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                      {v.reservedStock}
                    </td>

                    <td className="px-5 py-3.5 text-center font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {available}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {available <= 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                          Sold Out
                        </span>
                      ) : available <= v.lowStockThreshold ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          Healthy
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs px-2.5 py-1 text-slate-900 dark:text-slate-100 focus:outline-none"
                          >
                            <option value="RESTOCK">Restock (+)</option>
                            <option value="CORRECTION">Audit Correction</option>
                            <option value="DAMAGE">Damaged / Defect</option>
                          </select>
                          <input
                            type="number"
                            placeholder="+/- units"
                            value={adjustQty || ""}
                            onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                            className="w-18 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs px-2 py-1 text-center font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                          <button
                            onClick={() => handleApplyAdjustment(v.id)}
                            disabled={saving}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
                            title="Save Adjustment"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAdjustingId(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAdjustingId(v.id);
                            setAdjustQty(10);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                        >
                          Adjust Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
