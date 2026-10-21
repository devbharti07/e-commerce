"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Eye,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react";

export interface RegistrationRequestRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string | null;
  gstNumber: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface Props {
  initialRequests: RegistrationRequestRow[];
  initialCounts: Counts;
}

export function AdminRegistrationRequestsClient({ initialRequests, initialCounts }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequestRow[]>(initialRequests);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequestRow | null>(null);
  const [approveModalRequest, setApproveModalRequest] = useState<RegistrationRequestRow | null>(null);
  const [rejectModalRequest, setRejectModalRequest] = useState<RegistrationRequestRow | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.approvalStatus !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(term);
        const matchesEmail = r.email.toLowerCase().includes(term);
        const matchesPhone = r.phone.toLowerCase().includes(term);
        const matchesBusiness = r.businessName ? r.businessName.toLowerCase().includes(term) : false;
        const matchesGst = r.gstNumber ? r.gstNumber.toLowerCase().includes(term) : false;
        return matchesName || matchesEmail || matchesPhone || matchesBusiness || matchesGst;
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/registration-requests");
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const executeApprove = async (request: RegistrationRequestRow) => {
    setActionLoadingId(request.id);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/admin/registration-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, approvalStatus: "APPROVED", isVerified: true, approvedAt: new Date().toISOString(), rejectionReason: null }
            : r
        )
      );
      setCounts((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - (request.approvalStatus === "PENDING" ? 1 : 0)),
        approved: prev.approved + (request.approvalStatus !== "APPROVED" ? 1 : 0),
      }));

      setFeedbackMessage({
        type: "success",
        text: `Successfully approved wholesale portal access for ${request.name} (${request.email}).`,
      });
      setApproveModalRequest(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve request.";
      setFeedbackMessage({ type: "error", text: message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRequest) return;
    const req = rejectModalRequest;

    setActionLoadingId(req.id);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/admin/registration-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          reason: rejectionReasonInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                approvalStatus: "REJECTED",
                rejectedAt: new Date().toISOString(),
                rejectionReason: rejectionReasonInput.trim() || "Registration did not meet wholesale requirements.",
              }
            : r
        )
      );

      setCounts((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - (req.approvalStatus === "PENDING" ? 1 : 0)),
        rejected: prev.rejected + 1,
      }));

      setFeedbackMessage({
        type: "success",
        text: `Registration request for ${req.name} has been rejected.`,
      });
      setRejectModalRequest(null);
      setRejectionReasonInput("");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject request.";
      setFeedbackMessage({ type: "error", text: message });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Awaiting Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {counts.pending}
          </p>
          <span className="text-[11px] text-slate-500">Requires review</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Approved Retailers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {counts.approved}
          </p>
          <span className="text-[11px] text-slate-500">Active accounts</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {counts.rejected}
          </p>
          <span className="text-[11px] text-slate-500">Denied access</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Applicants</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {counts.total}
          </p>
          <span className="text-[11px] text-slate-500">All registrations</span>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, mobile, store or GST..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  statusFilter === status
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                {status === "PENDING" && counts.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {counts.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh Registration Queue"
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Applicant & Email</th>
                <th className="py-3 px-4">Store & GST Details</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-xs">No registration requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {search ? "No requests match your current search query." : "No applicant registrations in this status."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {req.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{req.email}</span>
                      </div>
                      {req.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{req.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.businessName || "Independent Retail Store"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        GST: {req.gstNumber || "Not Provided"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDateTime(req.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.approvalStatus === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          Pending Approval
                        </span>
                      )}
                      {req.approvalStatus === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {req.approvalStatus === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                      {req.approvalStatus === "SUSPENDED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          <ShieldAlert className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px] transition flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>

                        {req.approvalStatus === "PENDING" && (
                          <>
                            <button
                              onClick={() => setApproveModalRequest(req)}
                              disabled={actionLoadingId === req.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] transition disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                              title="Approve Wholesale Access"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>

                            <button
                              onClick={() => {
                                setRejectModalRequest(req);
                                setRejectionReasonInput("");
                              }}
                              disabled={actionLoadingId === req.id}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded font-medium text-[11px] transition disabled:opacity-50 flex items-center gap-1"
                              title="Reject Request"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}

                        {req.approvalStatus === "REJECTED" && (
                          <button
                            onClick={() => setApproveModalRequest(req)}
                            disabled={actionLoadingId === req.id}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded font-medium text-[11px] transition disabled:opacity-50"
                            title="Reconsider & Approve"
                          >
                            Reconsider
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Applicant Registration Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <span className="text-slate-400 text-[11px]">Full Name</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Email Address</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Contact Mobile</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Retail Store / Business</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.businessName || "Not Provided"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">GST Number</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.gstNumber || "Not Provided"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Approval Status</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.approvalStatus}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Submitted Timestamp</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {formatDateTime(selectedRequest.createdAt)}
                </p>
              </div>

              {selectedRequest.approvedAt && (
                <div>
                  <span className="text-slate-400 text-[11px]">Approved On</span>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatDateTime(selectedRequest.approvedAt)}
                  </p>
                </div>
              )}

              {selectedRequest.rejectedAt && (
                <div>
                  <span className="text-slate-400 text-[11px]">Rejected On & Reason</span>
                  <p className="text-rose-600 dark:text-rose-400 font-medium">
                    {formatDateTime(selectedRequest.rejectedAt)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                    &ldquo;{selectedRequest.rejectionReason}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
              {selectedRequest.approvalStatus === "PENDING" && (
                <button
                  onClick={() => {
                    const req = selectedRequest;
                    setSelectedRequest(null);
                    setApproveModalRequest(req);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Wholesale Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Approve Dealer Registration
                </h3>
                <p className="text-xs text-slate-500">
                  Grant wholesale portal access for {approveModalRequest.name}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-2 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{approveModalRequest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{approveModalRequest.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Business / Store:</span>
                <span className="text-slate-800 dark:text-slate-200">{approveModalRequest.businessName || "Independent Retailer"}</span>
              </div>
              {approveModalRequest.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800 dark:text-slate-200">{approveModalRequest.phone}</span>
                </div>
              )}
              {approveModalRequest.gstNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{approveModalRequest.gstNumber}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Approving this application will immediately activate verified dealer status, enable wholesale pricing tiers, and allow this customer to log in to Jagdamba Mobile.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalRequest(null)}
                disabled={actionLoadingId === approveModalRequest.id}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeApprove(approveModalRequest)}
                disabled={actionLoadingId === approveModalRequest.id}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === approveModalRequest.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Approve Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Reject Registration Request
                </h3>
                <p className="text-xs text-slate-500">
                  Deny portal access for {rejectModalRequest.name}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Invalid telecom retail shop details, unverified GST registration..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <p className="text-[11px] text-slate-400">
                This record will be saved in the administrative audit log.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalRequest(null);
                  setRejectionReasonInput("");
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectModalRequest.id}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition shadow-2xs disabled:opacity-50"
              >
                {actionLoadingId === rejectModalRequest.id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
