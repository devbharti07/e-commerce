"use client";

import React, { useState } from "react";
import { User, Store, Mail, Phone, FileText, MapPin, CheckCircle2 } from "lucide-react";

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    businessName: string;
    gstNumber: string;
    role: string;
  };
  addresses: {
    id: string;
    fullName: string;
    mobileNumber: string;
    houseOrShop: string;
    street: string;
    locality: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
    isDefault: boolean;
  }[];
}

export function ProfileClient({ user, addresses }: ProfileClientProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone,
    businessName: user.businessName,
    gstNumber: user.gstNumber,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          message: "Profile and retail business details updated successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to update profile",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Profile Form */}
      <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div>
          <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FCA311]" />
            Business & Account Details
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Keep your dispatch contact and GST details current for accurate invoicing
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
              Registered Business Email (Read-Only)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-gray-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
                Authorized Contact Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
                Dispatch Mobile / WhatsApp *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
              Store / Business Entity Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
              />
              <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
              GSTIN Identification Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
              />
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Retailer Details"}
          </button>
        </form>
      </div>

      {/* Right Column: Saved Addresses */}
      <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FCA311]" />
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Default unloading and transit destinations
          </p>
        </div>

        {addresses.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-xs border border-dashed rounded-xl">
            No saved addresses. Your address will be saved upon placing an order request.
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {a.fullName}
                  </span>
                  {a.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {a.houseOrShop}, {a.street}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {a.locality ? `${a.locality}, ` : ""}
                  {a.city}, {a.state} - {a.pinCode}
                </p>
                <p className="text-gray-500 text-[11px]">Phone: {a.mobileNumber}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
