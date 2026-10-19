"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  Save,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

interface AdminSettingsClientProps {
  initialSettings: Record<string, string>;
}

export function AdminSettingsClient({ initialSettings }: AdminSettingsClientProps) {
  const [formData, setFormData] = useState({
    BUSINESS_NAME: initialSettings["BUSINESS_NAME"] || "Jagdamba Mobile Distribution",
    CONTACT_PHONE: initialSettings["CONTACT_PHONE"] || "**********",
    CONTACT_EMAIL: initialSettings["CONTACT_EMAIL"] || "orders@jagdambamobile.com",
    STORE_ADDRESS:
      initialSettings["STORE_ADDRESS"] ||
      "Jagdamba Mobile Wholesale Hub, Main Commercial Electronics Market, New Delhi 110001",
    WHOLESALE_TERMS:
      initialSettings["WHOLESALE_TERMS"] ||
      "All prices quoted are B2B wholesale exclusive of local transit insurance unless negotiated. Orders require dealer confirmation prior to dispatch.",
    MIN_ORDER_VALUE: initialSettings["MIN_ORDER_VALUE"] || "2500000",
    DELIVERY_INFO:
      initialSettings["DELIVERY_INFO"] ||
      "Insured air cargo dispatch across India within 24-48 hours with e-Way bill.",
    SEO_TITLE:
      initialSettings["SEO_TITLE"] ||
      "Jagdamba Mobile — Wholesale Smartphone Distribution India",
    SEO_DESCRIPTION:
      initialSettings["SEO_DESCRIPTION"] ||
      "Verified B2B wholesale mobile distributor. Direct factory-sealed stock for Samsung, Apple, OnePlus, and Xiaomi with 18% GST input tax credit.",
    LOW_STOCK_THRESHOLD_DEFAULT: initialSettings["LOW_STOCK_THRESHOLD_DEFAULT"] || "5",
    MAINTENANCE_MODE: initialSettings["MAINTENANCE_MODE"] || "false",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: formData }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update settings");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Enterprise Configuration Parameters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure contact details, commercial policies, SEO tags, and operational inventory thresholds
          </p>
        </div>

        <div className="flex items-center gap-3">
          {success && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Settings Updated
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* BUSINESS DETAILS */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-500" />
          Store Identity & Contact Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Wholesale Business Legal Name
            </label>
            <input
              type="text"
              value={formData.BUSINESS_NAME}
              onChange={(e) => handleChange("BUSINESS_NAME", e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Customer Support / Sales Phone
            </label>
            <input
              type="text"
              value={formData.CONTACT_PHONE}
              onChange={(e) => handleChange("CONTACT_PHONE", e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Official Dealer Orders Email
            </label>
            <input
              type="email"
              value={formData.CONTACT_EMAIL}
              onChange={(e) => handleChange("CONTACT_EMAIL", e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Default Low-Stock Threshold
            </label>
            <input
              type="number"
              value={formData.LOW_STOCK_THRESHOLD_DEFAULT}
              onChange={(e) => handleChange("LOW_STOCK_THRESHOLD_DEFAULT", e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-medium text-slate-700 dark:text-slate-300">
            Physical Warehouse / Store Address
          </label>
          <input
            type="text"
            value={formData.STORE_ADDRESS}
            onChange={(e) => handleChange("STORE_ADDRESS", e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* COMMERCIAL & WHOLESALE POLICIES */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          Wholesale Trade Terms & Invoicing Policy
        </h3>

        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Wholesale Trading Terms & Invoice Policy
            </label>
            <textarea
              rows={3}
              value={formData.WHOLESALE_TERMS}
              onChange={(e) => handleChange("WHOLESALE_TERMS", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      {/* SEO METADATA */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-500" />
          Search Engine Optimization (SEO) Metadata
        </h3>

        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Default Meta Title
            </label>
            <input
              type="text"
              value={formData.SEO_TITLE}
              onChange={(e) => handleChange("SEO_TITLE", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={formData.SEO_DESCRIPTION}
              onChange={(e) => handleChange("SEO_DESCRIPTION", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
