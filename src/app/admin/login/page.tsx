import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AdminLoginClient } from "@/components/admin-login-client";
import { ShieldAlert, ArrowLeft, LogOut, ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Admin Sign In | Jagdamba Mobile HQ",
  description: "Secure administrator sign in portal for Jagdamba Mobile wholesale smartphone distribution.",
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  // If already authenticated as an authorized administrator, redirect immediately to /admin
  if (user && user.role === "OWNER") {
    redirect("/admin");
  }

  // If authenticated as a customer/retailer, display clear access denial notice
  if (user && user.role === "CUSTOMER") {
    return (
      <div className="min-h-screen bg-ivory dark:bg-forest-dark flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card dark:bg-card-dark rounded-xl border border-rose-200 dark:border-rose-900/40 p-8 shadow-xs space-y-6 text-center">
          <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-serif font-bold text-text-primary dark:text-text-primary-dark">
              Admin Access Restricted
            </h1>
            <p className="text-xs text-text-muted dark:text-text-muted-dark">
              You are currently signed in as retailer{" "}
              <strong className="text-text-primary dark:text-text-primary-dark">{user.email}</strong>.
              Retailer accounts cannot access the administrative dashboard.
            </p>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-xs text-rose-700 dark:text-rose-300 font-medium border border-rose-200/60 dark:border-rose-900/50">
            Administrator/Owner credentials are required for Jagdamba Mobile HQ.
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href="/catalog"
              className="w-full py-2.5 bg-primary hover:bg-forest-light text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Return to Wholesale Catalog
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full py-2 bg-ivory/60 hover:bg-ivory dark:bg-forest-muted dark:hover:bg-forest text-text-primary dark:text-text-primary-dark border border-border dark:border-border-dark font-medium text-xs rounded-lg transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out & Use Admin Account
              </button>
            </form>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-accent-brass pt-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Jagdamba Mobile Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors receive the clean Admin Sign In form
  return (
    <div className="min-h-screen bg-ivory dark:bg-forest-dark flex items-center justify-center px-4 py-12">
      <AdminLoginClient />
    </div>
  );
}
