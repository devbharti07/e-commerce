import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSettingsClient } from "@/components/admin-settings-client";
import { SlidersHorizontal } from "lucide-react";

export const metadata = {
  title: "Website Settings | Jagdamba Mobile Admin",
};

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/settings");
  }

  const settings = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Website & Operations Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage legal branding, wholesale contact details, transit policies, and search engine metadata
          </p>
        </div>
      </div>

      <AdminSettingsClient initialSettings={settingsMap} />
    </div>
  );
}
