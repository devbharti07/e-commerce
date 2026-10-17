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
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter by SKU, handset name, brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-5 py-3">Handset & SKU</th>
              <th className="px-5 py-3">Configuration</th>
              <th className="px-5 py-3">Wholesale Base</th>
              <th className="px-5 py-3 text-center">On-Hand</th>
              <th className="px-5 py-3 text-center">Reserved</th>
              <th className="px-5 py-3 text-center">Available Live</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Stock Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((v) => {
              const available = v.onHandStock - v.reservedStock;
              const isEditing = adjustingId === v.id;

              return (
                <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {v.productName}
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">
                      {v.sku}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    {v.ramGb}GB / {v.storageGb}GB • {v.colorName}
                  </td>

                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    {formatCurrency(v.baseWholesalePrice)}
                  </td>

                  <td className="px-5 py-3.5 text-center font-bold">
                    {v.onHandStock}
                  </td>

                  <td className="px-5 py-3.5 text-center text-amber-600 font-semibold">
                    {v.reservedStock}
                  </td>

                  <td className="px-5 py-3.5 text-center font-black text-emerald-600">
                    {available}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    {available <= 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        Sold Out
                      </span>
                    ) : available <= v.lowStockThreshold ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
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
                          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-[11px] px-2 py-1"
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
                          className="w-16 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-[11px] px-2 py-1 text-center"
                        />
                        <button
                          onClick={() => handleApplyAdjustment(v.id)}
                          disabled={saving}
                          className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setAdjustingId(null)}
                          className="text-[11px] text-gray-500 hover:text-red-500"
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
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-[#14213D] hover:text-white rounded-lg text-[11px] font-bold transition"
                      >
                        Adjust Stock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
