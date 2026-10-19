import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminProfileClient } from "@/components/admin-profile-client";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Admin Settings | Jagdamba Mobile Admin",
};

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/admin-settings");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Administrator Profile & Access Credentials
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage owner login credentials, secure password rotations, and authorization policies
          </p>
        </div>
      </div>

      <AdminProfileClient
        initialUser={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
        }}
      />
    </div>
  );
}
