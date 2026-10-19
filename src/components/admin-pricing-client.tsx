"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  BadgeIndianRupee,
  Search,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface PricingTierItem {
  id: string;
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

interface VariantPricingItem {
  id: string;
  sku: string;
  productName: string;
  brandName: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  baseWholesalePrice: number;
  minOrderQty: number;
  pricingTiers: PricingTierItem[];
}

interface AdminPricingClientProps {
  initialVariants: VariantPricingItem[];
  initialMinOrderValue: number;
}

export function AdminPricingClient({
  initialVariants,
  initialMinOrderValue,
}: AdminPricingClientProps) {
  const [variants, setVariants] = useState<VariantPricingItem[]>(initialVariants);
  const [minOrderValueRupees, setMinOrderValueRupees] = useState(
    (initialMinOrderValue / 100).toString()
  );
  const [savingMinOrder, setSavingMinOrder] = useState(false);
  const [search, setSearch] = useState("");

  // Add Tier Modal
  const [selectedVariant, setSelectedVariant] = useState<VariantPricingItem | null>(null);
  const [tierForm, setTierForm] = useState({
    minQty: 5,
    maxQty: "",
    unitPriceRupees: "",
  });
  const [submittingTier, setSubmittingTier] = useState(false);

  const filtered = variants.filter(
    (v) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.brandName.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateMinOrderValue = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(minOrderValueRupees);
    if (isNaN(rupees) || rupees <= 0) {
      alert("Please enter a valid minimum order value");
      return;
    }

    setSavingMinOrder(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_MIN_ORDER_VALUE",
          minOrderValuePaise: Math.round(rupees * 100),
        }),
      });

      if (res.ok) {
        alert("Storewide minimum wholesale order value updated!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update setting");
      }
    } finally {
      setSavingMinOrder(false);
    }
  };

  const handleOpenAddTier = (v: VariantPricingItem) => {
    setSelectedVariant(v);
    setTierForm({
      minQty: v.minOrderQty * 2,
      maxQty: "",
      unitPriceRupees: ((v.baseWholesalePrice * 0.96) / 100).toFixed(0),
    });
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    const priceRupees = parseFloat(tierForm.unitPriceRupees);
    if (isNaN(priceRupees) || priceRupees <= 0) {
      alert("Please enter a valid discounted tier unit price");
      return;
    }

    setSubmittingTier(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          minQty: Number(tierForm.minQty),
          maxQty: tierForm.maxQty ? Number(tierForm.maxQty) : null,
          unitPrice: Math.round(priceRupees * 100),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVariants((prev) =>
          prev.map((v) =>
            v.id === selectedVariant.id
              ? {
                  ...v,
                  pricingTiers: [
                    ...v.pricingTiers.filter((t) => t.minQty !== data.tier.minQty),
                    data.tier,
                  ].sort((a, b) => a.minQty - b.minQty),
                }
              : v
          )
        );
        setSelectedVariant(null);
      } else {
        alert(data.error || "Failed to save tier");
      }
    } finally {
      setSubmittingTier(false);
    }
  };

  const handleDeleteTier = async (variantId: string, tierId: string) => {
    if (!confirm("Remove this quantity pricing tier?")) return;

    try {
      const res = await fetch(`/api/admin/pricing/tiers/${tierId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setVariants((prev) =>
          prev.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  pricingTiers: v.pricingTiers.filter((t) => t.id !== tierId),
                }
              : v
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove tier");
      }
    } catch {
      alert("Error deleting tier");
    }
  };

  return (
    <div className="space-y-6">
      {/* MINIMUM WHOLESALE ORDER VALUE CARD */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form
          onSubmit={handleUpdateMinOrderValue}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Storewide B2B Minimum Order Policy
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              Enforced server-side during retailer checkout
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Min Cart Total: ₹</span>
            <input
              type="number"
              step="1000"
              value={minOrderValueRupees}
              onChange={(e) => setMinOrderValueRupees(e.target.value)}
              className="w-36 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
            <button
              type="submit"
              disabled={savingMinOrder}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {savingMinOrder ? "Saving..." : "Update Policy"}
            </button>
          </div>
        </form>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search pricing by SKU, model, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Configured SKUs: <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{filtered.length}</span>
        </div>
      </div>

      {/* PRICING TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">SKU & Handset</th>
                <th className="px-5 py-3.5">Color & Config</th>
                <th className="px-5 py-3.5">Base Wholesale Price</th>
                <th className="px-5 py-3.5">MOQ</th>
                <th className="px-5 py-3.5">Quantity Pricing Tiers</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-semibold text-slate-900 dark:text-white">
                      {v.sku}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {v.brandName} • {v.productName}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {v.ramGb}GB / {v.storageGb}GB
                    </span>{" "}
                    • {v.colorName}
                  </td>

                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(v.baseWholesalePrice)}
                  </td>

                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 tabular-nums">
                    {v.minOrderQty} pcs
                  </td>

                  <td className="px-5 py-3.5">
                    {v.pricingTiers.length === 0 ? (
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">No volume tiers configured</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {v.pricingTiers.map((t) => (
                          <div
                            key={t.id}
                            className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 text-[11px] text-slate-800 dark:text-slate-200 font-medium tabular-nums"
                          >
                            <span>
                              {t.minQty}
                              {t.maxQty ? `-${t.maxQty}` : "+"} pcs:{" "}
                              <strong className="font-semibold text-slate-900 dark:text-white">{formatCurrency(t.unitPrice)}</strong>
                            </span>
                            <button
                              onClick={() => handleDeleteTier(v.id, t.id)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition ml-0.5"
                              title="Delete tier"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenAddTier(v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-lg transition"
                    >
                      <Plus className="w-3 h-3" />
                      Add Tier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TIER MODAL */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Add Quantity Tier: {selectedVariant.sku}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Base Price: {formatCurrency(selectedVariant.baseWholesalePrice)}
                </p>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Min Quantity</label>
                  <input
                    type="number"
                    min="2"
                    value={tierForm.minQty}
                    onChange={(e) => setTierForm({ ...tierForm, minQty: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Max Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Leave blank for no limit"
                    value={tierForm.maxQty}
                    onChange={(e) => setTierForm({ ...tierForm, maxQty: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Discounted Unit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 94500"
                  value={tierForm.unitPriceRupees}
                  onChange={(e) => setTierForm({ ...tierForm, unitPriceRupees: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTier}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {submittingTier ? "Saving..." : "Save Pricing Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
