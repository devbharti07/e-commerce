import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminAuditLogsClient } from "@/components/admin-audit-logs-client";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Audit Logs | Jagdamba Mobile Admin",
};

export default async function AdminAuditLogsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/audit-logs");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formatted = logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    userName: l.user?.name || "System Automated",
    userEmail: l.user?.email || "system@jagdambamobile.internal",
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    detailsJson: l.detailsJson,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Administrative Security Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable operation history recording price updates, warehouse stock corrections, and order confirmations
          </p>
        </div>
      </div>

      <AdminAuditLogsClient initialLogs={formatted} />
    </div>
  );
}
