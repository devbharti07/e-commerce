import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminOrdersClient } from "@/components/admin-orders-client";
import { ShoppingCart } from "lucide-react";

export const metadata = {
  title: "Order Management | Jagdamba Mobile Admin",
};

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/orders");
  }

  const orders = await prisma.order.findMany({
    include: {
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
          businessName: true,
        },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedOrders = orders.map((ord) => {
    const totalUnits = ord.items.reduce((s, it) => s + it.quantity, 0);
    const itemsSummary = ord.items
      .map((it) => `${it.productName} (${it.quantity}x)`)
      .join(", ");

    return {
      id: ord.id,
      orderNumber: ord.orderNumber,
      status: ord.status,
      totalAmount: ord.totalAmount,
      subtotal: ord.subtotal,
      createdAt: ord.createdAt.toISOString(),
      customerName: ord.customer.name,
      customerEmail: ord.customer.email,
      customerPhone: ord.customer.phone,
      businessName: ord.customer.businessName,
      itemsCount: ord.items.length,
      totalUnits,
      itemsSummary,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Wholesale Order Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review retailer purchase requests, confirm stock allocations, and track dispatches
          </p>
        </div>
      </div>

      <AdminOrdersClient initialOrders={formattedOrders} />
    </div>
  );
}
