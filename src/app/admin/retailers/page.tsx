import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminRetailersClient } from "@/components/admin-retailers-client";
import { Users } from "lucide-react";

export const metadata = {
  title: "Retailers Management | Jagdamba Mobile Admin",
};

export default async function AdminRetailersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/retailers");
  }

  const retailers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = retailers.map((r) => {
    const totalSpent = r.orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      businessName: r.businessName,
      gstNumber: r.gstNumber,
      isVerified: r.isVerified,
      isSuspended: r.isSuspended,
      createdAt: r.createdAt.toISOString(),
      ordersCount: r.orders.length,
      totalSpent,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Retailer Network & Accounts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage wholesale retailer accounts, verified GST credentials, and trade authorization
          </p>
        </div>
      </div>

      <AdminRetailersClient initialRetailers={formatted} />
    </div>
  );
}
