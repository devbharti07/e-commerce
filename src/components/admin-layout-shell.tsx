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
            "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        },
        {
          name: "Retailers",
          href: "/admin/retailers",
          icon: Users,
          badge: null,
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
            "bg-blue-500/10 text-blue-400 border border-blue-500/20",
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
            "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row text-slate-900 dark:text-slate-100">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-700"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              JAGDAMBA <span className="text-amber-400 font-semibold">ADMIN</span>
            </span>
            <p className="text-[10px] text-slate-400">Wholesale Console</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
          <Link
            href="/catalog"
            target="_blank"
            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 text-slate-200 hover:text-white rounded-lg flex items-center gap-1"
          >
            Store <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen lg:sticky lg:top-0 border-r border-slate-800 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                JAGDAMBA <span className="text-amber-400">HQ</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-slate-800 text-amber-400 rounded border border-slate-700">
                Owner
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Wholesale Distribution Console</p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grouped Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
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
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group ${
                        active
                          ? "bg-slate-800 text-white font-semibold shadow-xs"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? "text-amber-400"
                              : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.badgeColor || "bg-slate-800 text-slate-300"
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
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-500/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
            >
              <LogOut className="w-3.5 h-3.5" />
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
        <header className="hidden lg:flex items-center justify-between px-8 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.href}>
                {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                {b.isLast ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{b.label}</span>
                ) : (
                  <Link href={b.href} className="hover:text-slate-900 dark:hover:text-white transition">
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
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Notifications Button */}
            <Link
              href="/admin/notifications"
              className="relative p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {metrics.notificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </Link>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Admin Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
              >
                <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-slate-800 text-white font-bold flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {user.role}
                  </p>
                </div>
              </button>

              {profileDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-1.5 z-50 text-xs"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/admin/admin-settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition mt-1 border-t border-slate-100 dark:border-slate-800"
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
        <div className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
