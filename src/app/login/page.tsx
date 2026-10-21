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
  UserCheck,
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
    if (!destination) return fallback;
    if (destination.startsWith("/") && !destination.startsWith("//") && !destination.includes("://")) {
      return destination;
    }
    return fallback;
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
        body: JSON.stringify({ email: email.trim(), password }),
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
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-14">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-xs space-y-6">
        {/* Jagdamba Mobile Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center mx-auto shadow-xs border border-slate-800 dark:border-slate-700">
            <Smartphone className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              JAGDAMBA <span className="text-amber-500">MOBILE</span>
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
              Wholesale Smartphone Distribution Platform
            </p>
          </div>
        </div>

        {/* Tabbed Login Selector (Customer vs Admin) */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium border border-slate-200/80 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab("customer");
              setError(null);
              setPendingApprovalNotice(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "customer"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Customer / User Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
              setPendingApprovalNotice(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "admin"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Context description */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {activeTab === "customer" ? (
            <span>
              Sign in with your approved retail store account to access B2B pricing, live stock, and order requests.
            </span>
          ) : (
            <span>
              Authorized administrator sign in for Jagdamba Mobile distribution and store operations.
            </span>
          )}
        </div>

        {/* Pending Approval Notice */}
        {pendingApprovalNotice && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Awaiting Administrative Approval</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              {pendingApprovalNotice}
            </p>
            <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              Need urgent activation? Contact Jagdamba Mobile support at +91 98765 00000.
            </div>
          </div>
        )}

        {/* Standard Error Notice */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in duration-150">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === "customer" ? "Gmail / Registered Email Address" : "Administrator Email"}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "customer" ? "dealer.shop@gmail.com" : "admin@gmail.com"}
                autoComplete="email"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
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
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
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
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">Or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              onClick={() => {
                alert(
                  "Google Sign-In integrates with your verified Gmail account. Please enter your registered Gmail address and password above for wholesale access."
                );
              }}
              className="w-full py-2 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2.5 transition shadow-2xs"
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
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Need wholesale store access?</span>
            <Link
              href="/register"
              className="font-semibold text-slate-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition"
            >
              Register Retail Store &rarr;
            </Link>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
            <span className="text-[11px] text-slate-400">Jagdamba Administration:</span>
            <Link
              href="/admin/login"
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Standalone Admin Sign In &rarr;
            </Link>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-0.5">
            New customer accounts require administrator approval before wholesale access is enabled.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                Password Assistance
              </h3>
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              To protect wholesale pricing and distributor integrity, password resets are processed through dealer verification. Please contact the Jagdamba Mobile wholesale support desk:
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1.5 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>Distribution Desk: +91 98765 00000</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Support: orders@jagdambamobile.com</span>
              </div>
            </div>

            <button
              onClick={() => setForgotPasswordOpen(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-medium transition"
            >
              Understood
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
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
