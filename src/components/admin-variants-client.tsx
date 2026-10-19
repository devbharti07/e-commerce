"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Boxes,
  Layers,
  ArrowRight,
  ExternalLink,
  Save,
  X,
} from "lucide-react";

interface VariantRow {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  sku: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  colorHex: string;
  baseWholesalePrice: number;
  minOrderQty: number;
  lowStockThreshold: number;
  onHandStock: number;
  reservedStock: number;
  isAvailable: boolean;
  pricingTiersCount: number;
}

interface ProductOption {
  id: string;
  name: string;
  brandName: string;
}

interface AdminVariantsClientProps {
  initialVariants: VariantRow[];
  products: ProductOption[];
}

export function AdminVariantsClient({ initialVariants, products }: AdminVariantsClientProps) {
  const [variants, setVariants] = useState<VariantRow[]>(initialVariants);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    productId: products[0]?.id || "",
    sku: "",
    ramGb: 8,
    storageGb: 256,
    colorName: "",
    colorHex: "#000000",
    baseWholesalePriceRupees: "",
    minOrderQty: 2,
    lowStockThreshold: 5,
    initialStock: 10,
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Modal State
  const [editingVariant, setEditingVariant] = useState<VariantRow | null>(null);
  const [editForm, setEditForm] = useState({
    sku: "",
    ramGb: 8,
    storageGb: 256,
    colorName: "",
    colorHex: "#000000",
    baseWholesalePriceRupees: "",
    minOrderQty: 2,
    lowStockThreshold: 5,
    isAvailable: true,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      if (productFilter !== "ALL" && v.productId !== productFilter) return false;
      if (statusFilter === "AVAILABLE" && !v.isAvailable) return false;
      if (statusFilter === "DISABLED" && v.isAvailable) return false;

      if (search.trim()) {
        const term = search.toLowerCase();
        const matchSku = v.sku.toLowerCase().includes(term);
        const matchProd = v.productName.toLowerCase().includes(term);
        const matchColor = v.colorName.toLowerCase().includes(term);
        const matchBrand = v.brandName.toLowerCase().includes(term);
        if (!matchSku && !matchProd && !matchColor && !matchBrand) return false;
      }

      return true;
    });
  }, [variants, search, productFilter, statusFilter]);

  const handleOpenEdit = (v: VariantRow) => {
    setEditingVariant(v);
    setEditForm({
      sku: v.sku,
      ramGb: v.ramGb,
      storageGb: v.storageGb,
      colorName: v.colorName,
      colorHex: v.colorHex,
      baseWholesalePriceRupees: (v.baseWholesalePrice / 100).toString(),
      minOrderQty: v.minOrderQty,
      lowStockThreshold: v.lowStockThreshold,
      isAvailable: v.isAvailable,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    const priceRupees = parseFloat(editForm.baseWholesalePriceRupees);
    if (isNaN(priceRupees) || priceRupees <= 0) {
      alert("Please enter a valid wholesale price");
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/admin/variants/${editingVariant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: editForm.sku,
          ramGb: Number(editForm.ramGb),
          storageGb: Number(editForm.storageGb),
          colorName: editForm.colorName,
          colorHex: editForm.colorHex,
          baseWholesalePrice: Math.round(priceRupees * 100),
          minOrderQty: Number(editForm.minOrderQty),
          lowStockThreshold: Number(editForm.lowStockThreshold),
          isAvailable: editForm.isAvailable,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVariants((prev) =>
          prev.map((v) =>
            v.id === editingVariant.id
              ? {
                  ...v,
                  sku: data.variant.sku,
                  ramGb: data.variant.ramGb,
                  storageGb: data.variant.storageGb,
                  colorName: data.variant.colorName,
                  colorHex: data.variant.colorHex,
                  baseWholesalePrice: data.variant.baseWholesalePrice,
                  minOrderQty: data.variant.minOrderQty,
                  lowStockThreshold: data.variant.lowStockThreshold,
                  isAvailable: data.variant.isAvailable,
                }
              : v
          )
        );
        setEditingVariant(null);
      } else {
        alert(data.error || "Failed to update variant");
      }
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceRupees = parseFloat(createForm.baseWholesalePriceRupees);
    if (!createForm.sku.trim() || isNaN(priceRupees) || priceRupees <= 0) {
      alert("Please enter a valid SKU and wholesale price");
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: createForm.productId,
          sku: createForm.sku.toUpperCase().trim(),
          ramGb: Number(createForm.ramGb),
          storageGb: Number(createForm.storageGb),
          colorName: createForm.colorName.trim(),
          colorHex: createForm.colorHex,
          baseWholesalePrice: Math.round(priceRupees * 100),
          minOrderQty: Number(createForm.minOrderQty),
          lowStockThreshold: Number(createForm.lowStockThreshold),
          initialStock: Number(createForm.initialStock),
          isAvailable: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const prod = products.find((p) => p.id === data.variant.productId);
        const newRow: VariantRow = {
          id: data.variant.id,
          productId: data.variant.productId,
          productName: prod?.name || data.variant.product?.name || "Smartphone",
          brandName: prod?.brandName || "Brand",
          sku: data.variant.sku,
          ramGb: data.variant.ramGb,
          storageGb: data.variant.storageGb,
          colorName: data.variant.colorName,
          colorHex: data.variant.colorHex,
          baseWholesalePrice: data.variant.baseWholesalePrice,
          minOrderQty: data.variant.minOrderQty,
          lowStockThreshold: data.variant.lowStockThreshold,
          onHandStock: data.variant.onHandStock,
          reservedStock: 0,
          isAvailable: data.variant.isAvailable,
          pricingTiersCount: 0,
        };
        setVariants((prev) => [newRow, ...prev]);
        setShowCreateModal(false);
        setCreateForm({
          productId: products[0]?.id || "",
          sku: "",
          ramGb: 8,
          storageGb: 256,
          colorName: "",
          colorHex: "#000000",
          baseWholesalePriceRupees: "",
          minOrderQty: 2,
          lowStockThreshold: 5,
          initialStock: 10,
        });
      } else {
        alert(data.error || "Failed to create variant");
      }
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search variant by SKU, model, color, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none max-w-[150px] truncate"
            >
              <option value="ALL">All Handsets</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </button>
        </div>
      </div>

      {/* Variants Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">SKU & Handset</th>
                <th className="py-3.5 px-4">Spec / Config</th>
                <th className="py-3.5 px-4">Color</th>
                <th className="py-3.5 px-4">Wholesale Price</th>
                <th className="py-3.5 px-4">MOQ</th>
                <th className="py-3.5 px-4 text-center">Stock (Avail / On-Hand)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No smartphone variants match the selected filter.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Adjust filter pills or clear the search field.</p>
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const available = v.onHandStock - v.reservedStock;
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white">
                          {v.sku}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {v.brandName} • {v.productName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {v.ramGb}GB / {v.storageGb}GB
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 shadow-2xs"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span className="text-slate-700 dark:text-slate-300">{v.colorName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(v.baseWholesalePrice)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 tabular-nums">
                        {v.minOrderQty} pcs
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-semibold tabular-nums ${
                            available <= 0
                              ? "text-rose-600 dark:text-rose-400"
                              : available <= v.lowStockThreshold
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {available} pcs
                        </span>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                          {v.onHandStock} hand / {v.reservedStock} res
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {v.isAvailable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE VARIANT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Add Smartphone Variant
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Select Handset</label>
                <select
                  value={createForm.productId}
                  onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brandName} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Unique SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. SAM-S24U-12-512-TI"
                    value={createForm.sku}
                    onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 uppercase font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Base Wholesale Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 98500"
                    value={createForm.baseWholesalePriceRupees}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, baseWholesalePriceRupees: e.target.value })
                    }
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">RAM (GB)</label>
                  <input
                    type="number"
                    value={createForm.ramGb}
                    onChange={(e) => setCreateForm({ ...createForm, ramGb: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Storage (GB)</label>
                  <input
                    type="number"
                    value={createForm.storageGb}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, storageGb: Number(e.target.value) })
                    }
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Color Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Titanium Gray"
                    value={createForm.colorName}
                    onChange={(e) => setCreateForm({ ...createForm, colorName: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Color Hex Code</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={createForm.colorHex}
                      onChange={(e) => setCreateForm({ ...createForm, colorHex: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={createForm.colorHex}
                      onChange={(e) => setCreateForm({ ...createForm, colorHex: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 uppercase font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Min Order Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.minOrderQty}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, minOrderQty: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Low Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.lowStockThreshold}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, lowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.initialStock}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, initialStock: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {submittingCreate ? "Saving..." : "Create Variant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VARIANT MODAL */}
      {editingVariant && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Edit Variant: {editingVariant.sku}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{editingVariant.productName}</p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">SKU</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 uppercase font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Base Wholesale Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.baseWholesalePriceRupees}
                    onChange={(e) =>
                      setEditForm({ ...editForm, baseWholesalePriceRupees: e.target.value })
                    }
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">RAM (GB)</label>
                  <input
                    type="number"
                    value={editForm.ramGb}
                    onChange={(e) => setEditForm({ ...editForm, ramGb: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Storage (GB)</label>
                  <input
                    type="number"
                    value={editForm.storageGb}
                    onChange={(e) =>
                      setEditForm({ ...editForm, storageGb: Number(e.target.value) })
                    }
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Color Name</label>
                  <input
                    type="text"
                    value={editForm.colorName}
                    onChange={(e) => setEditForm({ ...editForm, colorName: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.colorHex}
                      onChange={(e) => setEditForm({ ...editForm, colorHex: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={editForm.colorHex}
                      onChange={(e) => setEditForm({ ...editForm, colorHex: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 uppercase font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Min Order Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.minOrderQty}
                    onChange={(e) =>
                      setEditForm({ ...editForm, minOrderQty: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Low Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.lowStockThreshold}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailableCheck"
                  checked={editForm.isAvailable}
                  onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="isAvailableCheck" className="font-medium text-slate-700 dark:text-slate-300">
                  Available for wholesale orders on storefront
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingEdit ? "Saving..." : "Update Variant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
