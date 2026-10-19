"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Smartphone, Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      login("session_active", data.user);

      if (data.user.role === "OWNER") {
        router.push("/admin");
      } else {
        router.push("/catalog");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mx-auto">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            User Sign In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access wholesale smartphone tiers and track bulk requests
          </p>
        </div>

        {/* Retailer Notice */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-0.5">
          <p className="font-medium text-slate-700 dark:text-slate-300">Retailer & Dealer Access:</p>
          <p className="text-[11px] text-slate-500">
            Use your registered mobile shop dealer credentials to view wholesale pricing and place bulk smartphone order requests.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dealer@retailstore.com"
                autoComplete="email"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
            {loading ? "Authenticating..." : "Sign In to Wholesale Portal"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">New mobile retailer?</span>
            <Link href="/register" className="font-medium text-slate-900 dark:text-white hover:underline">
              Register Retail Store
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>

            <Link
              href="/admin/login"
              className="font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Admin Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
