import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminRegistrationRequestsClient } from "@/components/admin-registration-requests-client";
import { UserCheck } from "lucide-react";

export const metadata = {
  title: "Registration Requests | Jagdamba Mobile Admin",
  description: "Review and manage retail store registration requests awaiting wholesale verification.",
};

export default async function AdminRegistrationRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/admin/login?redirect=/admin/registration-requests");
  }

  const [requests, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        gstNumber: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
        isVerified: true,
        isSuspended: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "APPROVED" } }),
    prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "REJECTED" } }),
  ]);

  const formattedRequests = requests.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    businessName: r.businessName,
    gstNumber: r.gstNumber,
    approvalStatus: r.approvalStatus || "APPROVED",
    rejectionReason: r.rejectionReason,
    isVerified: r.isVerified,
    isSuspended: r.isSuspended,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            Registration Approval Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review new retailer registrations, verify business details, and approve or reject wholesale portal access.
          </p>
        </div>
      </div>

      <AdminRegistrationRequestsClient
        initialRequests={formattedRequests}
        initialCounts={{
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: formattedRequests.length,
        }}
      />
    </div>
  );
}
