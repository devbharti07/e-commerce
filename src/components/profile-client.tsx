"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Store,
  Mail,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";

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

  // Change Password Modal State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const currentPasswordInputRef = useRef<HTMLInputElement>(null);

  // Focus current password input when modal opens
  useEffect(() => {
    if (changePasswordOpen) {
      setTimeout(() => {
        currentPasswordInputRef.current?.focus();
      }, 100);
    } else {
      // Reset state on close
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [changePasswordOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && changePasswordOpen) {
        setChangePasswordOpen(false);
      }
    };
    if (changePasswordOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [changePasswordOpen]);

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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordLoading) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    // Client-side validation
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters in length.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password. Please check your current password.");
        setPasswordLoading(false);
        return;
      }

      // Success
      setPasswordSuccess(data.message || "Your password has been changed successfully.");
      setPasswordLoading(false);
      setFeedback({
        type: "success",
        message: "Your account password was updated successfully.",
      });

      // Clear fields and automatically close after a short display
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setChangePasswordOpen(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred. Please try again.";
      setPasswordError(msg);
      setPasswordLoading(false);
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
            {feedback.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />}
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
            className="px-6 py-3 bg-[#173B35] hover:bg-[#285C4D] text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173B35]"
          >
            {saving ? "Saving Changes..." : "Save Retailer Details"}
          </button>
        </form>
      </div>

      {/* Right Column: Security Credentials & Saved Addresses */}
      <div className="lg:col-span-5 space-y-6">
        {/* Security & Password Card */}
        <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 space-y-4 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B3853E]" />
                Security & Authentication
              </h2>
              <p className="text-xs text-[#69736D] dark:text-[#9BA59E] mt-1">
                Manage your wholesale account credentials and password
              </p>
            </div>
            <div className="p-2 rounded-xl bg-[#B3853E]/10 text-[#B3853E] dark:text-[#D8AB64] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#DDE3DC] dark:border-[#212E28] bg-[#F6F5F0]/50 dark:bg-[#111916]/50 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#17231E] dark:text-white block">Account Password</span>
              <span className="text-[#69736D] dark:text-[#9BA59E] text-[11px] font-mono">••••••••••••</span>
            </div>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="px-3.5 py-2 bg-[#173B35] hover:bg-[#1F4D45] text-white font-semibold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173B35]"
            >
              <Lock className="w-3.5 h-3.5 text-[#B3853E] dark:text-[#D8AB64]" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        {/* Saved Addresses Card */}
        <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 space-y-4 shadow-2xs">
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

      {/* Change Password Modal Dialog */}
      {changePasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-modal-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-[#17231E] dark:text-[#E8EFEA]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#DDE3DC] dark:border-[#212E28]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#173B35] text-white flex items-center justify-center shrink-0 border border-[#285C4D]">
                  <KeyRound className="w-5 h-5 text-[#B3853E] dark:text-[#D8AB64]" />
                </div>
                <div>
                  <h3 id="change-password-modal-title" className="text-base font-bold text-[#17231E] dark:text-[#E8EFEA]">
                    Change Password
                  </h3>
                  <p className="text-xs text-[#69736D] dark:text-[#9BA59E] mt-0.5">
                    Update your account credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(false)}
                className="p-1.5 rounded-lg text-[#69736D] hover:text-[#17231E] dark:hover:text-white hover:bg-[#EAECE8] dark:hover:bg-[#212E28] transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Feedback */}
            {passwordError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{passwordError}</span>
              </div>
            )}

            {/* Success Feedback */}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{passwordSuccess}</span>
              </div>
            )}

            {/* Change Password Form */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              {/* Current Password Field */}
              <div>
                <label className="block font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    ref={currentPasswordInputRef}
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    disabled={passwordLoading}
                    className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-2 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                  />
                  <Lock className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-[#69736D] hover:text-[#17231E] dark:hover:text-white transition cursor-pointer p-0.5"
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    disabled={passwordLoading}
                    className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-2 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                  />
                  <KeyRound className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-[#69736D] hover:text-[#17231E] dark:hover:text-white transition cursor-pointer p-0.5"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] mt-1">
                  Must be at least 6 characters and different from your current password.
                </p>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    disabled={passwordLoading}
                    className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-2 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                  />
                  <KeyRound className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-[#69736D] hover:text-[#17231E] dark:hover:text-white transition cursor-pointer p-0.5"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  disabled={passwordLoading}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[#DDE3DC] dark:border-[#212E28] hover:bg-[#EAECE8] dark:hover:bg-[#212E28] text-[#17231E] dark:text-[#E8EFEA] transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-[#173B35] hover:bg-[#1F4D45] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#173B35]"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
