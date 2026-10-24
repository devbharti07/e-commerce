"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  Layers,
  Boxes,
  BadgeIndianRupee,
  Users,
  MessageSquare,
  Bell,
  Home,
  SlidersHorizontal,
  BarChart3,
  ShieldAlert,
  Settings,
  Clock,
  Menu,
  X,
  ExternalLink,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon,
  Search,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
  badgeColor?: string;
  exact?: boolean;
}

interface AdminLayoutShellProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  metrics: {
    pendingOrdersCount: number;
    unreadMessagesCount: number;
    lowStockCount: number;
    notificationsCount: number;
    pendingRegistrationsCount?: number;
  };
  children: React.ReactNode;
}

export function AdminLayoutShell({ user, metrics, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // Close mobile sidebar on route transition
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const navigationGroups: { title: string; items: NavItem[] }[] = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          badge: null,
          exact: true,
        },
      ],
    },
    {
      title: "Catalog",
      items: [
        {
          name: "Products",
          href: "/admin/products",
          icon: Smartphone,
          badge: null,
        },
        {
          name: "Variants",
          href: "/admin/variants",
          icon: Layers,
          badge: null,
        },
        {
          name: "Inventory",
          href: "/admin/inventory",
          icon: Boxes,
          badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} low` : null,
          badgeColor:
            "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        },
        {
          name: "Wholesale Pricing",
          href: "/admin/pricing",
          icon: BadgeIndianRupee,
          badge: null,
        },
      ],
    },
    {
      title: "Sales & Operations",
      items: [
        {
          name: "Orders",
          href: "/admin/orders",
          icon: ShoppingCart,
          badge:
            metrics.pendingOrdersCount > 0
              ? `${metrics.pendingOrdersCount} new`
              : null,
          badgeColor:
            "bg-[#B3853E]/20 text-[#D8AB64] border border-[#B3853E]/40",
        },
        {
          name: "Retailers",
          href: "/admin/retailers",
          icon: Users,
          badge: null,
        },
        {
          name: "Registration Requests",
          href: "/admin/registration-requests",
          icon: UserCheck,
          badge:
            (metrics.pendingRegistrationsCount ?? 0) > 0
              ? `${metrics.pendingRegistrationsCount} pending`
              : null,
          badgeColor:
            "bg-[#B3853E]/20 text-[#D8AB64] border border-[#B3853E]/40",
        },
        {
          name: "Messages & Chat",
          href: "/admin/messages",
          icon: MessageSquare,
          badge:
            metrics.unreadMessagesCount > 0
              ? `${metrics.unreadMessagesCount} unread`
              : null,
          badgeColor:
            "bg-[#173B35] text-white border border-[#285C4D]",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          name: "Notifications",
          href: "/admin/notifications",
          icon: Bell,
          badge:
            metrics.notificationsCount > 0
              ? `${metrics.notificationsCount}`
              : null,
          badgeColor:
            "bg-[#B3853E]/20 text-[#D8AB64] border border-[#B3853E]/30",
        },
        {
          name: "Reports & Analytics",
          href: "/admin/reports",
          icon: BarChart3,
          badge: null,
        },
        {
          name: "Audit Logs",
          href: "/admin/audit-logs",
          icon: ShieldAlert,
          badge: null,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          name: "Homepage Layout",
          href: "/admin/homepage",
          icon: Home,
          badge: null,
        },
        {
          name: "Store Settings",
          href: "/admin/settings",
          icon: SlidersHorizontal,
          badge: null,
        },
        {
          name: "Store Availability",
          href: "/admin/availability",
          icon: Clock,
          badge: null,
        },
        {
          name: "Admin Settings",
          href: "/admin/admin-settings",
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Build breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, idx) => {
    const isId = seg.length > 20 || seg.startsWith("cmv");
    const label =
      seg === "admin"
        ? "Admin"
        : isId
        ? "Order Details"
        : seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const href = "/" + pathSegments.slice(0, idx + 1).join("/");
    return { label, href, isLast: idx === pathSegments.length - 1 };
  });

  return (
    <div className="min-h-screen bg-[#F6F5F0] dark:bg-[#111916] flex flex-col lg:flex-row text-[#17231E] dark:text-[#E8EFEA] transition-colors">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-[#0F1A17] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-[#212E28] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-[#18221D] text-[#E8EFEA] hover:text-white focus:outline-none border border-[#2B3B33] cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-serif-heading">
              JAGDAMBA <span className="text-[#B3853E] font-semibold">ADMIN</span>
            </span>
            <p className="text-[10px] text-[#9BA59E]">Wholesale Console</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-[#18221D] text-[#9BA59E] hover:text-white border border-[#2B3B33] cursor-pointer"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-[#D8AB64]" /> : <Sun className="w-4 h-4 text-[#D8AB64]" />}
          </button>
          <Link
            href="/catalog"
            target="_blank"
            className="px-3 py-1.5 text-[11px] font-semibold bg-[#173B35] text-white hover:bg-[#285C4D] rounded-xl flex items-center gap-1 shadow-2xs"
          >
            Store <ExternalLink className="w-3 h-3 text-[#D8AB64]" />
          </Link>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#0F1A17] text-[#D5DDD7] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen lg:sticky lg:top-0 border-r border-[#212E28] ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#212E28] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-serif-heading">
                JAGDAMBA <span className="text-[#B3853E]">HQ</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#18221D] text-[#D8AB64] rounded border border-[#2B3B33]">
                Owner
              </span>
            </div>
            <p className="text-[11px] text-[#9BA59E] mt-0.5">Wholesale Distribution Console</p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-[#18221D] text-[#9BA59E] hover:text-white"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grouped Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#9BA59E]/70">
                {group.title}
              </p>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const active = isItemActive(item.href, item.exact);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors group cursor-pointer ${
                        active
                          ? "bg-[#173B35] text-white shadow-xs"
                          : "text-[#9BA59E] hover:bg-[#18221D] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? "text-[#D8AB64]"
                              : "text-[#69736D] group-hover:text-white"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.badgeColor || "bg-[#18221D] text-[#D5DDD7]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer Card */}
        <div className="p-3.5 border-t border-[#212E28] bg-[#0F1A17]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#18221D] border border-[#2B3B33]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#173B35] text-[#D8AB64] font-bold flex items-center justify-center text-xs shrink-0 border border-[#285C4D]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#9BA59E] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="p-1.5 text-[#9BA59E] hover:text-rose-400 hover:bg-[#212E28] rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Compact Desktop Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-[#F6F5F0]/95 dark:bg-[#111916]/95 backdrop-blur-xs border-b border-[#DDE3DC] dark:border-[#212E28] sticky top-0 z-30 shadow-2xs">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#69736D] dark:text-[#9BA59E]">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.href}>
                {idx > 0 && <span className="text-[#69736D]/50">/</span>}
                {b.isLast ? (
                  <span className="font-bold text-[#17231E] dark:text-[#E8EFEA]">{b.label}</span>
                ) : (
                  <Link href={b.href} className="hover:text-[#173B35] dark:hover:text-white transition">
                    {b.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Quick Actions & Header Controls */}
          <div className="flex items-center gap-3">
            {/* Storefront Link */}
            <Link
              href="/catalog"
              target="_blank"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#17231E] dark:text-[#E8EFEA] hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition flex items-center gap-1.5 border border-[#DDE3DC] dark:border-[#212E28]"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#B3853E]" />
            </Link>

            {/* Notifications Button */}
            <Link
              href="/admin/notifications"
              className="relative p-2 rounded-xl text-[#69736D] hover:text-[#17231E] dark:text-[#9BA59E] dark:hover:text-white hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {metrics.notificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#111916]" />
              )}
            </Link>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              className="p-2 rounded-xl text-[#69736D] hover:text-[#17231E] dark:text-[#9BA59E] dark:hover:text-white hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition cursor-pointer"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[#173B35]" />
              ) : (
                <Sun className="w-4 h-4 text-[#D8AB64]" />
              )}
            </button>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-[#DDE3DC] dark:border-[#212E28]" />

            {/* Admin Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#EAECE8] dark:hover:bg-[#18221D] transition focus:outline-none cursor-pointer"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
              >
                <div className="w-7 h-7 rounded-lg bg-[#173B35] text-[#D8AB64] font-bold flex items-center justify-center text-xs border border-[#285C4D]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-bold text-[#17231E] dark:text-[#E8EFEA] leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#69736D] dark:text-[#9BA59E] leading-tight">
                    {user.role}
                  </p>
                </div>
              </button>

              {profileDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#18221D] rounded-2xl shadow-xl border border-[#DDE3DC] dark:border-[#212E28] p-2 z-50 text-xs"
                >
                  <div className="px-3 py-2 border-b border-[#EAECE8] dark:border-[#212E28] mb-1">
                    <p className="font-bold text-[#17231E] dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#69736D] truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/admin/admin-settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#17231E] dark:text-[#E8EFEA] hover:bg-[#EAECE8] dark:hover:bg-[#212E28] transition font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#69736D]" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition mt-1 border-t border-[#EAECE8] dark:border-[#212E28] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-w-0 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
