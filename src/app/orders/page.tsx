import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Package, MessageSquare, ArrowRight, Clock, ShieldCheck } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {user.role === "OWNER" ? "All Wholesale Orders" : "My Bulk Order Requests"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track confirmation status, communicate with dealer, and review line items
          </p>
        </div>

        <Link
          href="/catalog"
          className="px-4 py-2 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 transition flex items-center gap-1.5 self-start"
        >
          Create New Order Request
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-16 text-center space-y-4">
          <Package className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            No Bulk Orders Found
          </h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You haven't submitted any wholesale order requests yet. Browse our inventory to request models.
          </p>
          <Link
            href="/catalog"
            className="inline-block px-5 py-2.5 bg-[#14213D] text-white text-xs font-bold rounded-xl"
          >
            Browse Smartphone Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-[#FCA311] transition flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#14213D] dark:text-[#FCA311]">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">
                      {totalUnits} Units:
                    </strong>{" "}
                    {order.items.map((i) => `${i.productName} (${i.quantity} pcs)`).join(", ")}
                  </p>

                  {user.role === "OWNER" && (
                    <p className="text-xs text-gray-400">
                      Retailer: {order.customer.businessName || order.customer.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-700">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400">
                      Estimated Total
                    </p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-[#14213D] hover:text-white text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
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
