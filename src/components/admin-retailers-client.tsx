"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface RetailerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string | null;
  gstNumber: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

interface AdminRetailersClientProps {
  initialRetailers: RetailerRow[];
}

export function AdminRetailersClient({ initialRetailers }: AdminRetailersClientProps) {
  const [retailers, setRetailers] = useState<RetailerRow[]>(initialRetailers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return retailers.filter((r) => {
      if (statusFilter === "ACTIVE" && r.isSuspended) return false;
      if (statusFilter === "SUSPENDED" && !r.isSuspended) return false;
      if (statusFilter === "VERIFIED" && !r.isVerified) return false;

      if (search.trim()) {
        const term = search.toLowerCase();
        const matchName = r.name.toLowerCase().includes(term);
        const matchBiz = (r.businessName || "").toLowerCase().includes(term);
        const matchEmail = r.email.toLowerCase().includes(term);
        const matchPhone = r.phone.includes(term);
        const matchGst = (r.gstNumber || "").toLowerCase().includes(term);
        if (!matchName && !matchBiz && !matchEmail && !matchPhone && !matchGst) return false;
      }

      return true;
    });
  }, [retailers, search, statusFilter]);

  const handleToggleSuspension = async (r: RetailerRow) => {
    const action = r.isSuspended ? "reactivate" : "suspend";
    if (
      !confirm(
        `Are you sure you want to ${action} account for "${r.businessName || r.name}"?`
      )
    ) {
      return;
    }

    setUpdatingId(r.id);
    try {
      const res = await fetch(`/api/admin/retailers/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !r.isSuspended }),
      });

      if (res.ok) {
        setRetailers((prev) =>
          prev.map((item) =>
            item.id === r.id ? { ...item, isSuspended: !r.isSuspended } : item
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update account status");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by retailer name, shop name, phone, email, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Retailers</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="VERIFIED">GST / Phone Verified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Retail Business & Contact</th>
                <th className="px-5 py-3.5">Email & Phone</th>
                <th className="px-5 py-3.5">GST Number</th>
                <th className="px-5 py-3.5 text-center">Orders Placed</th>
                <th className="px-5 py-3.5 text-right">Fulfilled Value</th>
                <th className="px-5 py-3.5 text-center">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No retailers match your search criteria.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Adjust status filter or clear the search query.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.businessName || r.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Proprietor: {r.name} • Registered {formatDateTime(r.createdAt).slice(0, 11)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-900 dark:text-white font-mono text-[11px]">{r.phone}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{r.email}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {r.gstNumber || "N/A"}
                    </td>

                    <td className="px-5 py-3.5 text-center font-semibold text-slate-900 dark:text-white tabular-nums">
                      {r.ordersCount}
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(r.totalSpent)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {r.isSuspended ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/retailers/${r.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Retailer Dossier & History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleToggleSuspension(r)}
                          disabled={updatingId === r.id}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
                            r.isSuspended
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                          }`}
                        >
                          {r.isSuspended ? "Reactivate" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
