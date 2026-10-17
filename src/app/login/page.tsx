"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Smartphone, Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      login("session_active", data.user);

      if (data.user.role === "OWNER") {
        router.push("/admin");
      } else {
        router.push("/catalog");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#14213D] text-[#FCA311] flex items-center justify-center mx-auto shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Dealer & Admin Sign In
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to access wholesale smartphone tiers and track bulk requests
          </p>
        </div>

        {/* Demo Credentials Helper */}
        <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-1.5">
          <p className="font-bold text-gray-700 dark:text-gray-300">Demo Accounts:</p>
          <div className="text-[11px] text-gray-500 space-y-1">
            <p>
              <strong>Owner Admin:</strong> <code>owner@jagdambamobile.com</code> / <code>Owner@Jagdamba2026</code>
            </p>
            <p>
              <strong>Retailer Dealer:</strong> <code>rajesh.mobile@gmail.com</code> / <code>Retailer@2026</code>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dealer@retailstore.com"
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : "Sign In to Wholesale Portal"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
          New mobile retailer or reseller?{" "}
          <Link href="/register" className="font-bold text-[#14213D] dark:text-[#FCA311] hover:underline">
            Register Retail Store
          </Link>
        </div>
      </div>
    </div>
  );
}
