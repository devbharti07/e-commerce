"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  EyeOff,
  Smartphone,
  ExternalLink,
  Plus,
  Edit2,
  Archive,
  Star,
  X,
  Save,
} from "lucide-react";

interface AdminProductItem {
  id: string;
  name: string;
  slug: string;
  model: string;
  modelNumber: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  isPublished: boolean;
  isFeatured: boolean;
  variantsCount: number;
  totalStockOnHand: number;
  imageUrl?: string;
  warrantyMonths: number;
}

interface BrandOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function AdminProductsClient({
  initialProducts,
  brands,
  categories,
}: {
  initialProducts: AdminProductItem[];
  brands: BrandOption[];
  categories: CategoryOption[];
}) {
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Create Product Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    model: "",
    modelNumber: "",
    brandId: brands[0]?.id || "",
    categoryId: categories[0]?.id || "",
    description: "",
    warrantyMonths: 12,
    imageUrl: "",
    processor: "",
    display: "",
    camera: "",
    battery: "",
    isPublished: true,
    isFeatured: false,
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    model: "",
    modelNumber: "",
    brandId: "",
    categoryId: "",
    description: "",
    warrantyMonths: 12,
    imageUrl: "",
    isPublished: true,
    isFeatured: false,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brandName.toLowerCase().includes(search.toLowerCase()) ||
      p.modelNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isPublished: !currentPublished } : p))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update product status");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isFeatured: !currentFeatured } : p))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update featured flag");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"? It will be removed from the active catalog while preserving order history.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to archive product");
      }
    } catch {
      alert("Error archiving product");
    }
  };

  const handleOpenEdit = (p: AdminProductItem) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      model: p.model,
      modelNumber: p.modelNumber,
      brandId: p.brandId,
      categoryId: p.categoryId,
      description: p.description,
      warrantyMonths: p.warrantyMonths,
      imageUrl: p.imageUrl || "",
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          model: editForm.model,
          modelNumber: editForm.modelNumber,
          brandId: editForm.brandId,
          categoryId: editForm.categoryId,
          description: editForm.description,
          warrantyMonths: Number(editForm.warrantyMonths),
          imageUrl: editForm.imageUrl,
          isPublished: editForm.isPublished,
          isFeatured: editForm.isFeatured,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const brand = brands.find((b) => b.id === editForm.brandId);
        const cat = categories.find((c) => c.id === editForm.categoryId);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  name: editForm.name,
                  model: editForm.model,
                  modelNumber: editForm.modelNumber,
                  brandId: editForm.brandId,
                  brandName: brand?.name || p.brandName,
                  categoryId: editForm.categoryId,
                  categoryName: cat?.name || p.categoryName,
                  description: editForm.description,
                  warrantyMonths: Number(editForm.warrantyMonths),
                  imageUrl: editForm.imageUrl,
                  isPublished: editForm.isPublished,
                  isFeatured: editForm.isFeatured,
                }
              : p
          )
        );
        setEditingProduct(null);
      } else {
        alert(data.error || "Failed to update product");
      }
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);

    const specs = [];
    if (createForm.processor.trim()) {
      specs.push({ group: "Performance", key: "Processor", value: createForm.processor.trim() });
    }
    if (createForm.display.trim()) {
      specs.push({ group: "Display", key: "Screen", value: createForm.display.trim() });
    }
    if (createForm.camera.trim()) {
      specs.push({ group: "Camera", key: "Main Camera", value: createForm.camera.trim() });
    }
    if (createForm.battery.trim()) {
      specs.push({ group: "Battery", key: "Capacity", value: createForm.battery.trim() });
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          slug: createForm.slug.trim().toLowerCase(),
          model: createForm.model.trim(),
          modelNumber: createForm.modelNumber.trim(),
          brandId: createForm.brandId,
          categoryId: createForm.categoryId,
          description: createForm.description.trim(),
          warrantyMonths: Number(createForm.warrantyMonths),
          imageUrl: createForm.imageUrl.trim() || undefined,
          isPublished: createForm.isPublished,
          isFeatured: createForm.isFeatured,
          specifications: specs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const brand = brands.find((b) => b.id === createForm.brandId);
        const cat = categories.find((c) => c.id === createForm.categoryId);
        const newProduct: AdminProductItem = {
          id: data.product.id,
          name: data.product.name,
          slug: data.product.slug,
          model: data.product.model,
          modelNumber: data.product.modelNumber,
          brandId: data.product.brandId,
          brandName: brand?.name || "Brand",
          categoryId: data.product.categoryId,
          categoryName: cat?.name || "Category",
          description: data.product.description,
          isPublished: data.product.isPublished,
          isFeatured: data.product.isFeatured,
          variantsCount: 0,
          totalStockOnHand: 0,
          imageUrl: createForm.imageUrl.trim() || undefined,
          warrantyMonths: data.product.warrantyMonths,
        };
        setProducts((prev) => [newProduct, ...prev]);
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          slug: "",
          model: "",
          modelNumber: "",
          brandId: brands[0]?.id || "",
          categoryId: categories[0]?.id || "",
          description: "",
          warrantyMonths: 12,
          imageUrl: "",
          processor: "",
          display: "",
          camera: "",
          battery: "",
          isPublished: true,
          isFeatured: false,
        });
      } else {
        alert(data.error || "Failed to create product");
      }
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search catalog by model, brand, or model number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-slate-900 dark:focus:border-slate-100 transition"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Smartphone
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Handset Model</th>
              <th className="px-5 py-3.5">Brand</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5 text-center">Active SKUs</th>
              <th className="px-5 py-3.5 text-center">On-Hand Stock</th>
              <th className="px-5 py-3.5 text-center">Featured</th>
              <th className="px-5 py-3.5 text-center">Visibility</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400 dark:text-slate-500">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No smartphone models match your filter.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try searching with a different brand or model number.</p>
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isUpdating = updatingId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Model: {p.modelNumber} • {p.warrantyMonths}m warranty
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      {p.brandName}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{p.categoryName}</td>

                    <td className="px-5 py-3.5 text-center font-semibold text-slate-900 dark:text-white tabular-nums">
                      {p.variantsCount}
                    </td>

                    <td className="px-5 py-3.5 text-center font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {p.totalStockOnHand} pcs
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p.id, p.isFeatured)}
                        disabled={isUpdating}
                        className={`p-1.5 rounded-lg transition ${
                          p.isFeatured
                            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            : "text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"
                        }`}
                        title={p.isFeatured ? "Featured on Homepage" : "Click to feature"}
                      >
                        <Star className={`w-4 h-4 ${p.isFeatured ? "fill-current" : ""}`} />
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {p.isPublished ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Hidden
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Public Storefront Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleTogglePublish(p.id, p.isPublished)}
                          disabled={isUpdating}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 border ${
                            p.isPublished
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                          }`}
                        >
                          {p.isPublished ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              Publish
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleArchive(p.id, p.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Archive Discontinued Smartphone"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE SMARTPHONE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                Add New Smartphone Handset
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Brand</label>
                  <select
                    value={createForm.brandId}
                    onChange={(e) => setCreateForm({ ...createForm, brandId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={createForm.categoryId}
                    onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Handset Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung Galaxy S24 Ultra 5G"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                      setCreateForm({ ...createForm, name, slug });
                    }}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">URL Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. samsung-galaxy-s24-ultra-5g"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Model Name</label>
                  <input
                    type="text"
                    placeholder="Galaxy S24 Ultra"
                    value={createForm.model}
                    onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Model Number</label>
                  <input
                    type="text"
                    placeholder="SM-S928B"
                    value={createForm.modelNumber}
                    onChange={(e) => setCreateForm({ ...createForm, modelNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Warranty (Months)</label>
                  <input
                    type="number"
                    value={createForm.warrantyMonths}
                    onChange={(e) => setCreateForm({ ...createForm, warrantyMonths: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or public image URL"
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Wholesale flagship smartphone description for dealers..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              {/* Specifications Sub-fields */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Hardware Specifications
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Processor: Snapdragon 8 Gen 3"
                    value={createForm.processor}
                    onChange={(e) => setCreateForm({ ...createForm, processor: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Display: 6.8 inch Dynamic AMOLED 2X 120Hz"
                    value={createForm.display}
                    onChange={(e) => setCreateForm({ ...createForm, display: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Camera: 200MP Quad OIS"
                    value={createForm.camera}
                    onChange={(e) => setCreateForm({ ...createForm, camera: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Battery: 5000 mAh 45W Fast Charging"
                    value={createForm.battery}
                    onChange={(e) => setCreateForm({ ...createForm, battery: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isPublished}
                    onChange={(e) => setCreateForm({ ...createForm, isPublished: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Publish immediately to storefront
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isFeatured}
                    onChange={(e) => setCreateForm({ ...createForm, isFeatured: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Feature on Homepage
                  </span>
                </label>
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
                  {submittingCreate ? "Saving..." : "Create Smartphone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SMARTPHONE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Edit Handset: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Handset Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Brand</label>
                  <select
                    value={editForm.brandId}
                    onChange={(e) => setEditForm({ ...editForm, brandId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Model Name</label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Model Number</label>
                  <input
                    type="text"
                    value={editForm.modelNumber}
                    onChange={(e) => setEditForm({ ...editForm, modelNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Image URL</label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Published to storefront
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Featured on Homepage
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
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
                  {submittingEdit ? "Saving..." : "Update Smartphone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
