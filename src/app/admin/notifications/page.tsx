import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNotificationsClient } from "@/components/admin-notifications-client";
import { Bell } from "lucide-react";

export const metadata = {
  title: "Notifications Center | Jagdamba Mobile Admin",
};

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/notifications");
  }

  const [deliveries, subscriptions] = await Promise.all([
    prisma.notificationDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.notificationSubscription.findMany({
      include: {
        variant: { include: { product: true } },
        customer: { select: { name: true, businessName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const formattedDeliveries = deliveries.map((d) => ({
    id: d.id,
    type: d.type,
    recipient: d.recipient,
    title: d.title,
    body: d.body,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }));

  const formattedSubscriptions = subscriptions.map((s) => ({
    id: s.id,
    variantId: s.variantId,
    email: s.email,
    phone: s.phone,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    productName: s.variant.product.name,
    variantSku: s.variant.sku,
    customerName: s.customer?.businessName || s.customer?.name || null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Wholesale Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit dispatched restock alerts, trade updates, and retailer inventory subscriptions
          </p>
        </div>
      </div>

      <AdminNotificationsClient
        initialDeliveries={formattedDeliveries}
        initialSubscriptions={formattedSubscriptions}
      />
    </div>
  );
}
