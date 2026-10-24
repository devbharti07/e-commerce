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
      <div className="lg:col-span-7 bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 space-y-6 shadow-2xs">
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#B3853E]" />
            Business & Account Details
          </h2>
          <p className="text-xs text-[#69736D] dark:text-[#9BA59E] mt-1">
            Keep your dispatch contact and GST details current for accurate invoicing
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
              Registered Business Email (Read-Only)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-[#EAECE8]/60 dark:bg-[#111916]/60 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-3 py-2.5 text-[#69736D] cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
                Authorized Contact Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-3 py-2.5 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35]"
                />
                <User className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
                Dispatch Mobile / WhatsApp *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-3 py-2.5 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35]"
                />
                <Phone className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
              Store / Business Entity Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-3 py-2.5 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35]"
              />
              <Store className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="font-semibold block text-[#17231E] dark:text-[#E8EFEA] mb-1">
              GSTIN Identification Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-3 py-2.5 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35] font-mono"
              />
              <FileText className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#173B35] hover:bg-[#285C4D] text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Retailer Details"}
          </button>
        </form>
      </div>

      {/* Right Column: Saved Addresses */}
      <div className="lg:col-span-5 bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 space-y-4 shadow-2xs">
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#B3853E]" />
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-[#69736D] dark:text-[#9BA59E] mt-1">
            Default unloading and transit destinations
          </p>
        </div>

        {addresses.length === 0 ? (
          <div className="p-8 text-center text-[#69736D] text-xs border border-dashed border-[#DDE3DC] dark:border-[#212E28] rounded-2xl">
            No saved addresses. Your address will be saved upon placing an order request.
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-[#DDE3DC] dark:border-[#212E28] space-y-1.5 text-xs bg-[#F6F5F0]/50 dark:bg-[#111916]/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17231E] dark:text-white">
                    {a.fullName}
                  </span>
                  {a.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#173B35]/10 text-[#173B35] dark:bg-[#173B35]/30 dark:text-[#D8AB64] border border-[#173B35]/20">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-[#69736D] dark:text-[#9BA59E]">
                  {a.houseOrShop}, {a.street}
                </p>
                <p className="text-[#69736D] dark:text-[#9BA59E]">
                  {a.locality ? `${a.locality}, ` : ""}
                  {a.city}, {a.state} - {a.pinCode}
                </p>
                <p className="text-[#69736D] text-[11px] font-mono">Phone: {a.mobileNumber}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
