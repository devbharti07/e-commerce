"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  User,
  Mail,
  Lock,
  Building2,
  Store,
  Phone,
  ShieldCheck,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    gstNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedUser, setSubmittedUser] = useState<{
    name: string;
    email: string;
    phone: string;
    businessName?: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify both password entries.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit registration. Please try again.");
        setLoading(false);
        return;
      }

      setSubmittedUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName || undefined,
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // If application was submitted, show confirmation screen
  if (submittedUser) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:py-16 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] transition-colors">
        <div className="w-full max-w-lg bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 sm:p-10 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B3853E]/10 text-[#B3853E] dark:text-[#D8AB64] border border-[#B3853E]/30">
              <Clock className="w-3.5 h-3.5" />
              Application Under Review
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#17231E] dark:text-[#E8EFEA]">
              Registration Submitted
            </h1>
            <p className="text-xs text-[#69736D] dark:text-[#9BA59E] max-w-md mx-auto leading-relaxed">
              Thank you for applying for a wholesale dealer account with Jagdamba Mobile. Your dealer application has been placed in our priority review queue.
            </p>
          </div>

          <div className="p-4 bg-[#EAECE8]/60 dark:bg-[#111916]/60 rounded-xl border border-[#DDE3DC] dark:border-[#212E28] text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-[#DDE3DC]/60 dark:border-[#212E28]/60">
              <span className="text-[#69736D]">Applicant Name:</span>
              <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA]">{submittedUser.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DDE3DC]/60 dark:border-[#212E28]/60">
              <span className="text-[#69736D]">Business Email:</span>
              <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA]">{submittedUser.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DDE3DC]/60 dark:border-[#212E28]/60">
              <span className="text-[#69736D]">Contact Phone:</span>
              <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA]">{submittedUser.phone}</span>
            </div>
            {submittedUser.businessName && (
              <div className="flex justify-between py-1 border-b border-[#DDE3DC]/60 dark:border-[#212E28]/60">
                <span className="text-[#69736D]">Retail Shop:</span>
                <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA]">{submittedUser.businessName}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-[#69736D]">Status:</span>
              <span className="font-bold text-[#B3853E] dark:text-[#D8AB64]">Pending Administrator Approval</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-left flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#B3853E] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Our administration reviews applications during business hours (Mon-Sat, 09:00 - 20:00 IST). You will be able to sign in once your dealer status has been verified.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3 bg-[#173B35] hover:bg-[#1F4D45] text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              Return to Sign In Screen
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:py-16 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 sm:p-10 shadow-sm space-y-6">
        {/* Branding & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#173B35] dark:bg-[#212E28] text-white flex items-center justify-center mx-auto shadow-xs border border-[#285C4D]">
            <Smartphone className="w-6 h-6 text-[#B3853E] dark:text-[#D8AB64]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#17231E] dark:text-[#E8EFEA]">
              Register Wholesale Account
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#69736D] dark:text-[#9BA59E] mt-0.5">
              Jagdamba Mobile B2B Distribution Platform
            </p>
          </div>
          <p className="text-xs text-[#69736D] dark:text-[#9BA59E] max-w-sm mx-auto leading-relaxed pt-1">
            Apply for commercial dealer access to unlock tiered wholesale pricing, inventory reservation, and priority delivery.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                />
                <User className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98234 56789"
                  className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                />
                <Phone className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
              Gmail / Business Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
              />
              <Mail className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                Retail Shop Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma Telecom"
                  className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                />
                <Store className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="07AAAAA0000A1Z5"
                className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                Create Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 chars"
                  className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                />
                <Lock className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#69736D] hover:text-[#173B35] dark:hover:text-white transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
                />
                <Lock className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-[#69736D] hover:text-[#173B35] dark:hover:text-white transition cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#B3853E] shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Approval Policy:</strong> All new retail accounts require administrative review. You will receive an approval notification once your telecom dealer credentials have been verified.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#173B35] hover:bg-[#1F4D45] text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Submitting Application..." : "Submit Registration for Admin Approval"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#DDE3DC] dark:border-[#212E28] flex items-center justify-between text-xs">
          <span className="text-[#69736D]">Already registered?</span>
          <Link
            href="/login"
            className="font-bold text-[#173B35] dark:text-[#D8AB64] hover:underline transition"
          >
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
