"use client";

import React, { useState } from "react";
import {
  Home,
  Save,
  Star,
  CheckCircle2,
  Megaphone,
  Truck,
  FileText,
  Smartphone,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface ProductOrderingItem {
  id: string;
  name: string;
  brandName: string;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

interface AdminHomepageClientProps {
  initialProducts: ProductOrderingItem[];
  initialSettings: Record<string, string>;
}

export function AdminHomepageClient({
  initialProducts,
  initialSettings,
}: AdminHomepageClientProps) {
  const [products, setProducts] = useState<ProductOrderingItem[]>(initialProducts);
  const [announcementBanner, setAnnouncementBanner] = useState(
    initialSettings["ANNOUNCEMENT_BANNER"] ||
      "B2B Special: New stock of Galaxy S24 Ultra & iPhone 15 Pro Max available for priority allocation!"
  );
  const [announcementActive, setAnnouncementActive] = useState(
    initialSettings["ANNOUNCEMENT_ACTIVE"] === "true"
  );
  const [deliveryInfo, setDeliveryInfo] = useState(
    initialSettings["DELIVERY_INFO"] ||
      "Insured B2B cargo dispatch across all India states within 24-48 hours. Valid e-Way bill and invoice provided."
  );
  const [orderingInstructions, setOrderingInstructions] = useState(
    initialSettings["ORDERING_INSTRUCTIONS"] ||
      "Submit purchase request with required handset quantities. Jagdamba Mobile distribution manager confirms allocation within 2 hours."
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleFeatured = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
    );
  };

  const handleOrderChange = (id: string, newOrder: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, displayOrder: newOrder } : p))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementBanner,
          announcementActive,
          deliveryInfo,
          orderingInstructions,
          productOrder: products.map((p) => ({
            productId: p.id,
            isFeatured: p.isFeatured,
            displayOrder: p.displayOrder,
          })),
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update homepage settings");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Storefront Presentation & Dynamic Content
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage top banner alerts, featured showroom models, and dispatch instructions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Changes Published Live
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {/* ANNOUNCEMENT BANNER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-slate-500 shrink-0" />
            Header Promotional Announcement Banner
          </h3>
          <label className="flex items-center gap-2 cursor-pointer text-xs self-start sm:self-auto">
            <input
              type="checkbox"
              checked={announcementActive}
              onChange={(e) => setAnnouncementActive(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Display Banner on Storefront
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <input
            type="text"
            value={announcementBanner}
            onChange={(e) => setAnnouncementBanner(e.target.value)}
            placeholder="e.g. B2B Wholesale Alert: Fresh shipment of OnePlus 12 & iPhone 15 arrived."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* HOMEPAGE CONTENT INSTRUCTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-500 shrink-0" />
            Delivery & Transit Information
          </h3>
          <textarea
            rows={3}
            value={deliveryInfo}
            onChange={(e) => setDeliveryInfo(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            Wholesale Ordering Instructions
          </h3>
          <textarea
            rows={3}
            value={orderingInstructions}
            onChange={(e) => setOrderingInstructions(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* FEATURED SMARTPHONES & ORDERING */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
            Homepage Featured Models & Display Ordering
          </h3>
          <span className="text-[11px] text-slate-400">
            Star items to feature them on the homepage. Lower display order numbers appear first.
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {products.map((p) => (
            <div
              key={p.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(p.id)}
                  className={`p-1.5 rounded-lg transition ${
                    p.isFeatured
                      ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                      : "text-slate-300 dark:text-slate-600 hover:text-slate-500"
                  }`}
                  title={p.isFeatured ? "Featured on homepage" : "Not Featured"}
                >
                  <Star className={`w-4 h-4 ${p.isFeatured ? "fill-amber-500" : ""}`} />
                </button>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {p.brandName} • {p.isPublished ? "Published" : "Hidden"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-[11px] text-slate-500 font-medium">Display Priority:</span>
                <input
                  type="number"
                  value={p.displayOrder}
                  onChange={(e) => handleOrderChange(p.id, Number(e.target.value))}
                  className="w-16 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center text-xs font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
