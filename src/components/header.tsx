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
  Clock,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { useStoreAvailability } from "@/hooks/use-store-availability";

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const { availability, isOpen } = useStoreAvailability();
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

  // Close mobile navigation menu on route transition
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/catalog");
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#F6F5F0]/95 dark:bg-[#111916]/95 backdrop-blur-md border-b border-[#DDE3DC] dark:border-[#212E28] transition-colors">
      {/* Top Wholesale Trust Bar */}
      <div className="bg-[#173B35] text-[#E8EFEA] text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-[#285C4D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center">
            <span className="flex items-center gap-1.5 text-[#E8EFEA]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B3853E] dark:text-[#D8AB64] shrink-0" />
              <span className="font-medium">100% Brand-Sealed Stock • 18% GST Input Credit Invoices</span>
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-[#E8EFEA]">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#D5DDD7]">
              <PackageCheck className="w-3.5 h-3.5 text-[#B3853E] dark:text-[#D8AB64] shrink-0" />
              <span>Insured Transit Hub • New Delhi</span>
            </span>
            {user?.role === "OWNER" && (
              <Link
                href="/admin"
                className="bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold px-2.5 py-0.5 rounded text-[11px] transition shrink-0 shadow-2xs"
              >
                Owner Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Ordering Service Closed Notice Strip */}
      {availability && !isOpen && (
        <div className="bg-amber-600 dark:bg-amber-800 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Ordering Service Currently Unavailable
            {availability.nextOpenTime ? ` • Reopens ${availability.nextOpenTime}` : ""}
          </span>
          <Link href="/cart" className="underline font-bold hover:text-amber-100 ml-1">
            Details
          </Link>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink min-w-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#173B35] dark:bg-[#18221D] text-white flex items-center justify-center shadow-xs border border-[#285C4D] dark:border-[#2B3B33] shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-[#B3853E] dark:text-[#D8AB64]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold tracking-tight text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-1 truncate font-serif-heading">
                JAGDAMBA <span className="text-[#B3853E] dark:text-[#D8AB64] font-semibold tracking-normal">MOBILE</span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-[#69736D] dark:text-[#9BA59E] uppercase -mt-0.5 truncate">
                Wholesale Smartphone Hub
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
              className="w-full bg-[#EAECE8] dark:bg-[#18221D] text-[#17231E] dark:text-[#E8EFEA] text-xs rounded-lg pl-9 pr-20 py-2 border border-transparent focus:border-[#173B35] dark:focus:border-[#B3853E] focus:bg-white dark:focus:bg-[#111916] focus:outline-none transition shadow-2xs placeholder:text-[#69736D]"
            />
            <Search className="w-3.5 h-3.5 text-[#69736D] absolute left-3 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 bg-[#173B35] hover:bg-[#285C4D] dark:bg-[#285C4D] dark:hover:bg-[#173B35] text-white text-xs font-semibold rounded transition shadow-2xs cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1">
              <Link
                href="/"
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-2.5 py-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              >
                Home
              </Link>
              <Link
                href="/catalog"
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-2.5 py-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              >
                Products
              </Link>
              <Link
                href="/#brands"
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-2.5 py-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              >
                Brands
              </Link>
              <Link
                href="/#how-it-works"
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-2.5 py-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              >
                How It Works
              </Link>
              <Link
                href="/#benefits"
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-2.5 py-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              >
                About
              </Link>
              <Link
                href="/#contact"
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-2.5 py-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              >
                Contact
              </Link>
            </nav>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-1.5 sm:p-2 rounded-lg text-[#69736D] dark:text-[#9BA59E] hover:text-[#17231E] dark:hover:text-white hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[#173B35]" />
              ) : (
                <Sun className="w-4 h-4 text-[#D8AB64]" />
              )}
            </button>

            {/* Wholesale Cart Link */}
            <Link
              href="/cart"
              className="relative p-1.5 sm:p-2 rounded-lg text-[#17231E] dark:text-[#E8EFEA] hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-[#173B35] dark:text-[#E8EFEA]" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B3853E] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* User Account Menu OR Login Options Dropdown */}
            {user ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-lg hover:bg-[#EAECE8] dark:hover:bg-[#18221D] text-xs font-medium transition"
                  aria-label="User Account Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-[#173B35] dark:bg-[#18221D] text-white flex items-center justify-center text-xs font-bold border border-[#285C4D]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-[#17231E] dark:text-[#E8EFEA] font-semibold">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#69736D]" />
                </button>
                <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#18221D] rounded-xl shadow-lg border border-[#DDE3DC] dark:border-[#212E28] py-1 hidden group-hover:block group-focus-within:block z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-[#EAECE8] dark:border-[#212E28]">
                    <p className="text-[10px] text-[#69736D]">Signed in as</p>
                    <p className="font-semibold truncate text-[#17231E] dark:text-white">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EAECE8] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64]">
                      {user.role}
                    </span>
                  </div>
                  {user.role === "OWNER" && (
                    <Link
                      href="/admin"
                      className="block px-3.5 py-2 text-[#17231E] dark:text-[#E8EFEA] font-semibold hover:bg-[#F6F5F0] dark:hover:bg-[#212E28]"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="block px-3.5 py-2 text-[#69736D] dark:text-[#9BA59E] hover:bg-[#F6F5F0] dark:hover:bg-[#212E28]"
                  >
                    My Bulk Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3.5 py-2 text-[#69736D] dark:text-[#9BA59E] hover:bg-[#F6F5F0] dark:hover:bg-[#212E28]"
                  >
                    Retailer Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border-t border-[#EAECE8] dark:border-[#212E28]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Compact Mobile Sign In Icon Button (Tested via aria-label="User Sign In") */}
                <Link
                  href="/login"
                  className="sm:hidden p-1.5 text-[#17231E] dark:text-[#E8EFEA] hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
                  aria-label="User Sign In"
                  title="Sign In"
                >
                  <UserIcon className="w-5 h-5 text-[#173B35] dark:text-[#D8AB64]" />
                </Link>

                {/* Login Dropdown Menu (Tested via id="login-dropdown-btn") */}
                <div className="relative hidden sm:block" ref={loginDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLoginDropdownOpen((prev) => !prev)}
                    aria-expanded={loginDropdownOpen}
                    aria-haspopup="menu"
                    id="login-dropdown-btn"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:text-[#173B35] dark:hover:text-[#B3853E] px-3 py-1.5 rounded-lg border border-[#DDE3DC] dark:border-[#285C4D] hover:border-[#173B35] dark:hover:border-[#B3853E] bg-white dark:bg-[#18221D] transition focus:outline-none focus:ring-2 focus:ring-[#173B35]/30 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#69736D]" />
                    <span>Sign In</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#69736D] transition-transform duration-150 ${
                        loginDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {loginDropdownOpen && (
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="login-dropdown-btn"
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#18221D] rounded-xl shadow-xl border border-[#DDE3DC] dark:border-[#212E28] p-1.5 z-50 text-left"
                    >
                      <div className="px-3 py-1.5 border-b border-[#EAECE8] dark:border-[#212E28] mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#69736D]">
                          Select Portal
                        </p>
                      </div>

                      {/* User Sign In */}
                      <Link
                        href="/login"
                        role="menuitem"
                        id="user-sign-in-link"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F6F5F0] dark:hover:bg-[#212E28] transition group focus:outline-none"
                      >
                        <div className="w-7 h-7 rounded-md bg-[#173B35]/10 dark:bg-[#173B35]/30 text-[#173B35] dark:text-[#D8AB64] flex items-center justify-center shrink-0 border border-[#173B35]/20">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#17231E] dark:text-white group-hover:text-[#173B35] dark:group-hover:text-[#B3853E]">
                            User Sign In
                          </p>
                          <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] leading-tight">
                            Retailers, dealers & bulk buyers
                          </p>
                        </div>
                      </Link>

                      {/* Admin Sign In */}
                      <Link
                        href="/admin/login"
                        role="menuitem"
                        id="admin-sign-in-link"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F6F5F0] dark:hover:bg-[#212E28] transition group focus:outline-none"
                      >
                        <div className="w-7 h-7 rounded-md bg-[#173B35] text-[#B3853E] dark:text-[#D8AB64] flex items-center justify-center shrink-0 border border-[#285C4D]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-[#17231E] dark:text-white group-hover:text-[#B3853E]">
                              Admin Sign In
                            </p>
                            <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-[#B3853E]/10 text-[#B3853E] dark:text-[#D8AB64] rounded">
                              HQ
                            </span>
                          </div>
                          <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] leading-tight">
                            Management & inventory operations
                          </p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/register"
                  className="hidden sm:inline-block bg-[#B3853E] hover:bg-[#9E7332] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                >
                  Dealer Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
              className="md:hidden p-2 text-[#69736D] dark:text-[#9BA59E] hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#17231E] dark:text-white" /> : <Menu className="w-5 h-5 text-[#17231E] dark:text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#DDE3DC] dark:border-[#212E28] space-y-3">
            <form onSubmit={handleSearch} className="flex relative">
              <input
                type="text"
                placeholder="Search smartphones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#EAECE8] dark:bg-[#18221D] text-xs rounded-lg pl-9 pr-3 py-2 text-[#17231E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#173B35]"
              />
              <Search className="w-3.5 h-3.5 text-[#69736D] absolute left-3 top-2.5 pointer-events-none" />
            </form>
            <div className="flex flex-col space-y-1 pt-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
              >
                Home
              </Link>
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
              >
                Products
              </Link>
              <Link
                href="/#brands"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
              >
                Brands
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
              >
                How It Works
              </Link>
              <Link
                href="/#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
              >
                About
              </Link>
              <Link
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
              >
                Contact
              </Link>
              {user && (
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
                >
                  My Orders & Chat
                </Link>
              )}
              {user?.role === "OWNER" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-[#B3853E] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
                >
                  Owner Dashboard
                </Link>
              )}
            </div>

            {/* Mobile Logged-in User Account Actions */}
            {user ? (
              <div className="pt-3 border-t border-[#DDE3DC] dark:border-[#212E28] space-y-2">
                <div className="px-3 py-2 bg-[#EAECE8] dark:bg-[#18221D] rounded-lg">
                  <p className="text-[10px] text-[#69736D] font-medium">Signed in as</p>
                  <p className="font-semibold text-xs truncate text-[#17231E] dark:text-white">
                    {user.name} ({user.email})
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DDE3DC] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64]">
                    {user.role}
                  </span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] py-2.5 px-3 hover:bg-[#EAECE8] dark:hover:bg-[#18221D] rounded-lg transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#69736D]" />
                  <span>Retailer Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center gap-2 text-xs font-semibold text-rose-600 py-2.5 px-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              /* Mobile Logged-out Sign In Options */
              <div className="pt-3 border-t border-[#DDE3DC] dark:border-[#212E28] space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#69736D] px-1">
                  Sign In Options
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-[#EAECE8] dark:bg-[#18221D] text-[#17231E] dark:text-[#E8EFEA] hover:bg-[#DDE3DC] dark:hover:bg-[#212E28] transition"
                  >
                    <Store className="w-3.5 h-3.5 text-[#173B35] dark:text-[#D8AB64]" />
                    <span>User Sign In</span>
                  </Link>
                  <Link
                    href="/admin/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-[#173B35] text-[#B3853E] dark:text-[#D8AB64] hover:bg-[#285C4D] transition border border-[#285C4D]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Sign In</span>
                  </Link>
                </div>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 bg-[#B3853E] hover:bg-[#9E7332] text-white text-xs font-bold rounded-lg transition shadow-2xs"
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
