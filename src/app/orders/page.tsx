import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Package, MessageSquare, ArrowRight } from "lucide-react";

export default async function OrdersListPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: user.role === "OWNER" ? {} : { customerId: user.userId },
    include: {
      items: true,
      customer: {
        select: { name: true, businessName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {user.role === "OWNER" ? "All Wholesale Orders" : "My Bulk Order Requests"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track confirmation status, communicate with dealer, and review line items
          </p>
        </div>

        <Link
          href="/catalog"
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg transition flex items-center gap-1.5 self-start shadow-xs"
        >
          Create New Order Request
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            No Bulk Orders Found
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t submitted any wholesale order requests yet. Browse our inventory to request models.
          </p>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-block px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-medium rounded-lg"
            >
              Browse Smartphone Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {order.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">
                      {totalUnits} Units:
                    </strong>{" "}
                    {order.items.map((i) => `${i.productName} (${i.quantity} pcs)`).join(", ")}
                  </p>

                  {user.role === "OWNER" && (
                    <p className="text-[11px] text-slate-400">
                      Retailer: {order.customer.businessName || order.customer.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] uppercase font-medium text-slate-400">
                      Estimated Total
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open Order & Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
