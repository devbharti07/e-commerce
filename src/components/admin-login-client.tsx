"use client";

import React, { useState } from "react";
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
  ArrowLeft,
} from "lucide-react";

export function AdminLoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorizedError = searchParams.get("error") === "unauthorized_admin";

  const handleAdminLogin = async (e: React.FormEvent) => {
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

      // Security check: Verify authorized administrator role on the returned server payload
      if (data.user.role !== "OWNER") {
        setError(
          "Access Denied: This account does not possess administrative privileges. Please use User Sign In."
        );
        // Clear customer cookie/session so non-admin cannot access admin HQ
        await fetch("/api/auth/logout", { method: "POST" });
        setLoading(false);
        return;
      }

      login("session_active", data.user);
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-xs space-y-6">
      {/* Top Branding */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-forest/10 dark:bg-forest-muted text-primary dark:text-emerald-400 flex items-center justify-center mx-auto border border-forest/20 dark:border-forest-border/40 shadow-xs">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest/10 dark:bg-forest-muted/40 text-primary dark:text-accent-brass text-[10px] font-semibold uppercase tracking-wider border border-forest/20 dark:border-forest-border/40">
          <ShieldCheck className="w-3 h-3 text-accent-brass" />
          Jagdamba Mobile HQ
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-text-primary dark:text-text-primary-dark">
          Admin Sign In
        </h1>
        <p className="text-xs text-text-muted dark:text-text-muted-dark">
          Sign in to manage your business.
        </p>
      </div>

      {/* Unauthorized Notice */}
      {unauthorizedError && !error && (
        <div className="p-3 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Owner/Administrator credentials are required to access Admin HQ.</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAdminLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-primary dark:text-text-primary-dark mb-1">
            Administrator Email
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              autoComplete="username"
              className="w-full bg-ivory/60 dark:bg-forest-muted/30 border border-border dark:border-border-dark rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent-brass"
            />
            <Mail className="w-4 h-4 text-text-muted dark:text-text-muted-dark absolute left-3 top-2.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-primary dark:text-text-primary-dark mb-1">
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
              className="w-full bg-ivory/60 dark:bg-forest-muted/30 border border-border dark:border-border-dark rounded-lg pl-9 pr-10 py-2 text-xs text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent-brass"
            />
            <Lock className="w-4 h-4 text-text-muted dark:text-text-muted-dark absolute left-3 top-2.5" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary hover:bg-forest-light text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Verifying Credentials...</span>
          ) : (
            <>
              <span>Sign In to Admin HQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Navigation Links */}
      <div className="pt-3 border-t border-border dark:border-border-dark flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
        <Link
          href="/"
          className="hover:text-primary dark:hover:text-accent-brass flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Website
        </Link>

        <Link
          href="/login"
          className="font-medium text-primary dark:text-accent-brass hover:underline transition"
        >
          Retailer Sign In &rarr;
        </Link>
      </div>
    </div>
  );
}
