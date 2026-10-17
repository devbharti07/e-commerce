"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Search,
  ShoppingCart,
  User as UserIcon,
  Moon,
  Sun,
  Menu,
  X,
  ShieldCheck,
  PackageCheck,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/catalog");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      {/* Top Wholesale Trust Bar */}
      <div className="bg-[#14213D] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FCA311]" />
              GST Input Credit Invoices
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5 text-[#FCA311]" />
              Direct Brand Sealed Packs
            </span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <span>Wholesale Desk: +91 98765 43210</span>
            {user?.role === "OWNER" && (
              <Link
                href="/admin"
                className="bg-[#FCA311] text-[#14213D] font-bold px-2 py-0.5 rounded text-[11px] hover:bg-[#e5940f]"
              >
                Owner Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14213D] to-[#243b68] flex items-center justify-center text-white shadow-md border border-[#FCA311]/30">
              <Smartphone className="w-6 h-6 text-[#FCA311]" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-[#14213D] dark:text-white flex items-center gap-1">
                JAGDAMBA <span className="text-[#FCA311]">MOBILE</span>
              </div>
              <p className="text-[10px] font-medium tracking-wider text-gray-500 uppercase -mt-1">
                Wholesale Distribution
              </p>
            </div>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg items-center relative"
          >
            <input
              type="text"
              placeholder="Search Apple, Samsung, OnePlus, 5G models, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-lg pl-10 pr-24 py-2 border border-transparent focus:border-[#FCA311] focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 px-3 py-1 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] text-xs font-semibold rounded hover:opacity-90"
            >
              Search
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Catalog Link */}
            <Link
              href="/catalog"
              className="hidden lg:flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#FCA311] px-2 py-1"
            >
              Smartphones Catalog
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5 text-[#FCA311]" />
              )}
            </button>

            {/* Basket Cart Link */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FCA311] text-[#14213D] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* User Account Menu */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#14213D] text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-gray-800 dark:text-gray-200">
                    {user.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block group-focus-within:block z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {user.role}
                    </span>
                  </div>
                  {user.role === "OWNER" && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-[#14213D] dark:text-[#FCA311] font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    My Bulk Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Retailer Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#14213D] px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 shadow-sm transition"
                >
                  Dealer Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <form onSubmit={handleSearch} className="flex relative">
              <input
                type="text"
                placeholder="Search smartphones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-sm rounded-lg pl-9 pr-3 py-2 text-gray-900 dark:text-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </form>
            <div className="flex flex-col space-y-2 pt-2">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-gray-800 dark:text-gray-200 py-1"
              >
                Browse All Smartphones
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-gray-800 dark:text-gray-200 py-1"
              >
                My Orders & Chat
              </Link>
              {user?.role === "OWNER" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-bold text-[#FCA311] py-1"
                >
                  Owner Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
