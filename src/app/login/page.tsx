"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  Smartphone,
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Building2,
  HelpCircle,
  X,
  Phone,
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const initialMode = searchParams.get("mode") === "admin" ? "admin" : "customer";

  const [activeTab, setActiveTab] = useState<"customer" | "admin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Validate redirect path to prevent open redirect vulnerabilities
  const getSafeDestination = (destination: string | null, fallback: string): string => {
    if (!destination || typeof destination !== "string") return fallback;
    if (
      !destination.startsWith("/") ||
      destination.startsWith("//") ||
      destination.startsWith("/\\") ||
      destination.includes("\\") ||
      destination.includes("://") ||
      /[\x00-\x1F\x7F]/.test(destination)
    ) {
      return fallback;
    }
    try {
      const parsed = new URL(destination, window.location.origin);
      if (parsed.origin !== window.location.origin) return fallback;
      if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) return fallback;
      return destination;
    } catch {
      return fallback;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setPendingApprovalNotice(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.approvalStatus === "PENDING" || (data.error && data.error.includes("awaiting admin approval"))) {
          setPendingApprovalNotice(
            data.error ||
              "Your account is awaiting admin approval. You will be able to log in after your account has been approved by Jagdamba Mobile administration."
          );
        } else {
          setError(data.error || "Authentication failed. Please verify your credentials.");
        }
        setLoading(false);
        return;
      }

      // Check role if logging in on admin tab
      if (activeTab === "admin" && data.user.role !== "OWNER") {
        setError("Retailer accounts cannot sign in through the Admin Console. Please use the Customer Sign In tab.");
        setLoading(false);
        return;
      }

      login("session_active", data.user);

      if (data.user.role === "OWNER") {
        router.push(getSafeDestination(rawRedirect, "/admin"));
      } else {
        router.push(getSafeDestination(rawRedirect, "/"));
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:py-16 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Jagdamba Mobile Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#173B35] dark:bg-[#212E28] text-white flex items-center justify-center mx-auto shadow-xs border border-[#285C4D]">
            <Smartphone className="w-6 h-6 text-[#B3853E] dark:text-[#D8AB64]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#17231E] dark:text-[#E8EFEA]">
              JAGDAMBA <span className="text-[#B3853E] dark:text-[#D8AB64]">MOBILE</span>
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#69736D] dark:text-[#9BA59E] mt-0.5">
              Wholesale Smartphone Distribution Platform
            </p>
          </div>
        </div>

        {/* Tabbed Login Selector (Customer vs Admin) */}
        <div className="grid grid-cols-2 p-1 bg-[#EAECE8] dark:bg-[#212E28] rounded-xl text-xs font-semibold border border-[#DDE3DC] dark:border-[#2B3B33]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("customer");
              setError(null);
              setPendingApprovalNotice(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "customer"
                ? "bg-white dark:bg-[#18221D] text-[#173B35] dark:text-[#D8AB64] shadow-xs font-bold"
                : "text-[#69736D] dark:text-[#9BA59E] hover:text-[#17231E] dark:hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#B3853E]" />
            <span>User Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
              setPendingApprovalNotice(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "admin"
                ? "bg-[#173B35] text-white shadow-xs font-bold"
                : "text-[#69736D] dark:text-[#9BA59E] hover:text-[#17231E] dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#B3853E] dark:text-[#D8AB64]" />
            <span>Admin Console</span>
          </button>
        </div>

        {/* Context description */}
        <div className="text-xs text-[#69736D] dark:text-[#9BA59E] text-center leading-relaxed">
          {activeTab === "customer" ? (
            <span>
              Sign in to your wholesale dealer account to view real-time tier pricing, inventory, and order dispatch status.
            </span>
          ) : (
            <span>
              Authorized administrator sign in for Jagdamba Mobile distribution management and store operations.
            </span>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Pending Approval Notice */}
        {pendingApprovalNotice && (
          <div className="p-3.5 bg-[#B3853E]/10 dark:bg-[#B3853E]/20 rounded-xl text-xs text-[#17231E] dark:text-[#E8EFEA] border border-[#B3853E]/30 space-y-2">
            <div className="flex items-start gap-2.5 font-semibold text-[#B3853E] dark:text-[#D8AB64]">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Registration Under Review</span>
            </div>
            <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] leading-relaxed">
              {pendingApprovalNotice}
            </p>
            <div className="pt-1.5 border-t border-[#B3853E]/20 text-[11px] text-[#69736D] dark:text-[#9BA59E]">
              Need urgent activation? Call wholesale support: <strong>+91 98765 00000</strong>
            </div>
          </div>
        )}

        {/* Standard Password Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] mb-1.5">
              {activeTab === "customer" ? "Email Address or Mobile Number *" : "Admin Email Address *"}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "customer" ? "yourname@gmail.com or 9876543210" : "admin@gmail.com"}
                autoComplete="username"
                className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] transition placeholder:text-[#69736D]"
              />
              <Mail className="w-4 h-4 text-[#69736D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA]">
                Password *
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-[11px] font-semibold text-[#B3853E] dark:text-[#D8AB64] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#173B35] hover:bg-[#1F4D45] text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? "Authenticating..."
              : activeTab === "customer"
              ? "Sign In to Wholesale Store"
              : "Sign In to Admin Dashboard"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Google OAuth Option (Applicable to Retailers) */}
        {activeTab === "customer" && (
          <div className="space-y-3">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#DDE3DC] dark:border-[#212E28]" />
              <span className="flex-shrink mx-3 text-[11px] text-[#69736D] uppercase font-bold">Or</span>
              <div className="flex-grow border-t border-[#DDE3DC] dark:border-[#212E28]" />
            </div>

            <button
              type="button"
              onClick={() => {
                alert(
                  "Google Sign-In integrates with your verified Gmail account. Please enter your registered Gmail address and password above for wholesale access."
                );
              }}
              className="w-full py-2.5 bg-white dark:bg-[#18221D] hover:bg-[#EAECE8] dark:hover:bg-[#212E28] text-[#17231E] dark:text-[#E8EFEA] border border-[#DDE3DC] dark:border-[#285C4D] rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="pt-4 border-t border-[#DDE3DC] dark:border-[#212E28] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#69736D]">Need wholesale store access?</span>
            <Link
              href="/register"
              className="font-bold text-[#173B35] dark:text-[#D8AB64] hover:underline transition"
            >
              Register Retail Store &rarr;
            </Link>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#DDE3DC]/60 dark:border-[#212E28]/60">
            <span className="text-[11px] text-[#69736D]">Jagdamba Administration:</span>
            <Link
              href="/admin/login"
              className="text-[11px] font-medium text-[#69736D] hover:text-[#173B35] dark:hover:text-[#D8AB64]"
            >
              Standalone Admin Sign In &rarr;
            </Link>
          </div>

          <div className="text-[11px] text-[#69736D] dark:text-[#9BA59E] text-center pt-0.5">
            New customer accounts require administrator approval before wholesale access is enabled.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE3DC] dark:border-[#212E28]">
              <h3 className="text-sm font-bold text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#B3853E]" />
                Password Assistance
              </h3>
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="text-[#69736D] hover:text-[#17231E] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#69736D] dark:text-[#9BA59E] leading-relaxed">
              To protect wholesale pricing and distributor integrity, password resets are processed through dealer verification. Please contact the Jagdamba Mobile wholesale support desk:
            </p>

            <div className="p-3.5 bg-[#EAECE8]/60 dark:bg-[#111916]/60 rounded-xl text-xs space-y-2 border border-[#DDE3DC] dark:border-[#212E28]">
              <div className="flex items-center gap-2 text-[#17231E] dark:text-[#E8EFEA]">
                <Phone className="w-4 h-4 text-[#173B35] dark:text-[#D8AB64] shrink-0" />
                <span>Distribution Desk: +91 98765 00000</span>
              </div>
              <div className="flex items-center gap-2 text-[#17231E] dark:text-[#E8EFEA]">
                <Mail className="w-4 h-4 text-[#173B35] dark:text-[#D8AB64] shrink-0" />
                <span className="font-mono">orders@jagdambamobile.com</span>
              </div>
              <div className="text-[11px] text-[#69736D] dark:text-[#9BA59E]">
                Support Hours: Mon - Sat, 09:00 - 20:00 IST
              </div>
            </div>

            <button
              onClick={() => setForgotPasswordOpen(false)}
              className="w-full py-2.5 bg-[#173B35] text-white text-xs font-semibold rounded-xl hover:bg-[#285C4D] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-[#F6F5F0] dark:bg-[#111916]">
          <div className="w-6 h-6 border-2 border-[#173B35] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
