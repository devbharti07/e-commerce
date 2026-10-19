"use client";

import React, { useState, useMemo } from "react";
import { formatDateTime } from "@/lib/utils";
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  UserCheck,
  Activity,
  Lock,
} from "lucide-react";

interface AuditLogRow {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  detailsJson: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AdminAuditLogsClientProps {
  initialLogs: AuditLogRow[];
}

export function AdminAuditLogsClient({ initialLogs }: AdminAuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLogRow[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [activeModalLog, setActiveModalLog] = useState<AuditLogRow | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (entityFilter !== "ALL" && log.entity !== entityFilter) return false;

      if (search.trim()) {
        const term = search.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(term);
        const matchEntity = log.entity.toLowerCase().includes(term);
        const matchId = log.entityId.toLowerCase().includes(term);
        const matchUser = log.userName.toLowerCase().includes(term);
        const matchEmail = log.userEmail.toLowerCase().includes(term);
        if (!matchAction && !matchEntity && !matchId && !matchUser && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [logs, search, entityFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE")) {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300";
    }
    if (action.includes("UPDATE") || action.includes("CONFIGURED") || action.includes("ADJUST")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300";
    }
    if (action.includes("ARCHIVE") || action.includes("SUSPEND") || action.includes("DELETE")) {
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300";
  };

  let parsedDetails: any = null;
  if (activeModalLog?.detailsJson) {
    try {
      parsedDetails = JSON.parse(activeModalLog.detailsJson);
    } catch {
      parsedDetails = activeModalLog.detailsJson;
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Notice Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            Immutable Administrative Audit Log. All state mutations, price revisions, and inventory modifications are permanently stamped with the executing actor ID.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Tamper Resistant
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by action, actor, target entity, entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Entities</option>
            <option value="Product">Product</option>
            <option value="ProductVariant">Product Variant</option>
            <option value="PricingTier">Pricing Tier</option>
            <option value="SiteSetting">Site Setting</option>
            <option value="Order">Order</option>
            <option value="User">Retailer Account</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor (Administrator)</th>
                <th className="px-5 py-3.5">Operation / Action</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">Target ID</th>
                <th className="px-5 py-3.5 text-right">Details Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No audit records match your query.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.userName}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{log.userEmail}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      {log.entity}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                      {log.entityId}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {log.detailsJson ? (
                        <button
                          onClick={() => setActiveModalLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-lg transition"
                        >
                          <Eye className="w-3 h-3" />
                          View Payload
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">No payload</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW PAYLOAD MODAL */}
      {activeModalLog && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  Audit Operation Payload
                </h3>
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{activeModalLog.action}</p>
              </div>
              <button
                onClick={() => setActiveModalLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Actor: {activeModalLog.userName} ({activeModalLog.userEmail})</span>
                <span className="tabular-nums">{formatDateTime(activeModalLog.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Target: {activeModalLog.entity}</span>
                <span className="font-mono">ID: {activeModalLog.entityId}</span>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-200 p-3.5 rounded-lg text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
              <pre>{JSON.stringify(parsedDetails, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModalLog(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
