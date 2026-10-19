"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Store,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";

export function Header() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        loginDropdownRef.current &&
        !loginDropdownRef.current.contains(event.target as Node)
      ) {
        setLoginDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLoginDropdownOpen(false);
      }
    }

    if (loginDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loginDropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/catalog");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Wholesale Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>GST Input Credit Tax Invoices</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400">
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Brand Sealed Packs</span>
            </span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Wholesale Desk: <strong className="text-slate-200">+91 98765 43210</strong></span>
            {user?.role === "OWNER" && (
              <Link
                href="/admin"
                className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px] hover:bg-amber-300 transition"
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
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs border border-slate-800 dark:border-slate-700">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                JAGDAMBA <span className="text-amber-500 font-semibold">MOBILE</span>
              </div>
              <p className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase -mt-0.5">
                Wholesale Distribution
              </p>
            </div>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md items-center relative"
          >
            <input
              type="text"
              placeholder="Search Apple, Samsung, OnePlus, 5G models, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-9 pr-20 py-2 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded transition"
            >
              Search
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Catalog Link */}
            <Link
              href="/catalog"
              className="hidden lg:flex items-center text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Smartphones Catalog
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Wholesale Cart Link */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* User Account Menu OR Login Options Dropdown */}
            {user ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
                  aria-label="User Account Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold border border-slate-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-slate-800 dark:text-slate-200 font-semibold">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 hidden group-hover:block group-focus-within:block z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400">Signed in as</p>
                    <p className="font-semibold truncate text-slate-900 dark:text-white">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {user.role}
                    </span>
                  </div>
                  {user.role === "OWNER" && (
                    <Link
                      href="/admin"
                      className="block px-3.5 py-2 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="block px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    My Bulk Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Retailer Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border-t border-slate-100 dark:border-slate-800"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Login Dropdown Menu with Admin and User options */}
                <div className="relative" ref={loginDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLoginDropdownOpen((prev) => !prev)}
                    aria-expanded={loginDropdownOpen}
                    aria-haspopup="menu"
                    id="login-dropdown-btn"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sign In</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                        loginDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {loginDropdownOpen && (
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="login-dropdown-btn"
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 text-left"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Select Portal
                        </p>
                      </div>

                      {/* User Sign In */}
                      <Link
                        href="/login"
                        role="menuitem"
                        id="user-sign-in-link"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition group focus:outline-none"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            User Sign In
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            Retailers, dealers & buyers
                          </p>
                        </div>
                      </Link>

                      {/* Admin Sign In */}
                      <Link
                        href="/admin/login"
                        role="menuitem"
                        id="admin-sign-in-link"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition group focus:outline-none"
                      >
                        <div className="w-7 h-7 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 border border-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-amber-500">
                              Admin Sign In
                            </p>
                            <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                              HQ
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            Management & store operations
                          </p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/register"
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
                >
                  Dealer Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <form onSubmit={handleSearch} className="flex relative">
              <input
                type="text"
                placeholder="Search smartphones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </form>
            <div className="flex flex-col space-y-1 pt-1">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 py-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Browse All Smartphones
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 py-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                My Orders & Chat
              </Link>
              {user?.role === "OWNER" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-amber-500 py-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  Owner Dashboard
                </Link>
              )}
            </div>

            {/* Mobile Logged-out Sign In Options */}
            {!user && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Sign In Options
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Store className="w-3.5 h-3.5 text-blue-500" />
                    <span>User Sign In</span>
                  </Link>
                  <Link
                    href="/admin/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-amber-400 hover:bg-slate-800 transition border border-slate-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Sign In</span>
                  </Link>
                </div>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-lg transition"
                >
                  Register Retail Store
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
