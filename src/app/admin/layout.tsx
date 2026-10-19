import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminLayoutShell } from "@/components/admin-layout-shell";

import { headers } from "next/headers";

export const metadata = {
  title: "Admin Panel | Jagdamba Mobile",
  description: "Wholesale smartphone distribution centralized management console.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  // Dedicated admin login page bypasses dashboard shell and has its own standalone UI
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login?redirect=/admin");
  }

  if (user.role !== "OWNER") {
    redirect("/admin/login?error=unauthorized_admin");
  }

  // Fetch real-time live database counts for sidebar badges
  const [pendingOrdersCount, unreadMessagesCount, lowStockCount, notificationsCount] =
    await Promise.all([
      prisma.order.count({ where: { status: "REQUESTED" } }),
      prisma.message.count({ where: { senderRole: "CUSTOMER", isRead: false } }),
      prisma.productVariant.count({
        where: {
          isAvailable: true,
          onHandStock: { lte: 5 },
        },
      }),
      prisma.notificationDelivery.count({
        where: { status: "PENDING" },
      }),
    ]);

  return (
    <AdminLayoutShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      metrics={{
        pendingOrdersCount,
        unreadMessagesCount,
        lowStockCount,
        notificationsCount,
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}
