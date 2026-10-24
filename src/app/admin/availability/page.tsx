import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getStoreAvailability,
  DEFAULT_STORE_AVAILABILITY_CONFIG,
  StoreAvailabilityConfig,
} from "@/lib/store-availability";
import { AdminAvailabilityClient } from "@/components/admin-availability-client";

export const metadata = {
  title: "Store Availability & Ordering Schedule | Jagdamba Mobile Admin",
};

export default async function AdminAvailabilityPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/availability");
  }

  let schedule = await prisma.storeSchedule.findUnique({
    where: { id: "default" },
  });

  if (!schedule) {
    schedule = await prisma.storeSchedule.create({
      data: {
        id: "default",
        acceptOrders: DEFAULT_STORE_AVAILABILITY_CONFIG.acceptOrders,
        scheduleMode: DEFAULT_STORE_AVAILABILITY_CONFIG.scheduleMode,
        openTime: DEFAULT_STORE_AVAILABILITY_CONFIG.openTime,
        closeTime: DEFAULT_STORE_AVAILABILITY_CONFIG.closeTime,
        timeZone: DEFAULT_STORE_AVAILABILITY_CONFIG.timeZone,
        closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
        version: 1,
      },
    });
  }

  const availability = await getStoreAvailability();

  const config: StoreAvailabilityConfig = {
    id: schedule.id,
    acceptOrders: schedule.acceptOrders,
    scheduleMode: schedule.scheduleMode as any,
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    timeZone: schedule.timeZone,
    closureMessage: schedule.closureMessage,
    version: schedule.version,
    updatedAt: schedule.updatedAt,
    updatedBy: schedule.updatedBy,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Store Availability & Order Scheduling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure daily operating hours, manual overrides, holiday closures, and customer-facing service messages
          </p>
        </div>
      </div>

      <AdminAvailabilityClient
        initialConfig={config}
        initialAvailability={availability}
      />
    </div>
  );
}
