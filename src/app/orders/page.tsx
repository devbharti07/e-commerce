import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Package, MessageSquare, ArrowRight, ShieldCheck, Clock } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] min-h-[85vh] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DDE3DC] dark:border-[#212E28]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              Trade Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231E] dark:text-[#E8EFEA] tracking-tight">
            {user.role === "OWNER" ? "All Wholesale Orders" : "My Bulk Order Requests"}
          </h1>
          <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-1">
            Track confirmation status, communicate with dealer desk, and review line items
          </p>
        </div>

        <Link
          href="/catalog"
          className="px-4 py-2.5 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 self-start shadow-2xs cursor-pointer"
        >
          <span>Create New Order Request</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#173B35]/10 text-[#173B35] dark:text-[#D8AB64] mx-auto flex items-center justify-center border border-[#173B35]/20">
            <Package className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#17231E] dark:text-[#E8EFEA]">
            No Bulk Orders Found
          </h2>
          <p className="text-xs text-[#69736D] dark:text-[#9BA59E] max-w-sm mx-auto leading-relaxed">
            You haven&apos;t submitted any wholesale order requests yet. Browse our inventory of genuine smartphones to request bulk quotes.
          </p>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-block px-5 py-2.5 bg-[#173B35] hover:bg-[#285C4D] text-white text-xs font-semibold rounded-xl transition shadow-2xs"
            >
              Browse Smartphone Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[#18221D] p-5 sm:p-6 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] hover:border-[#173B35] dark:hover:border-[#B3853E] transition flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#17231E] dark:text-[#E8EFEA]">
                      #{order.orderNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      order.status === "CONFIRMED" || order.status === "DELIVERED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : order.status === "CANCELLED"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : "bg-[#B3853E]/10 text-[#B3853E] dark:text-[#D8AB64] border-[#B3853E]/30"
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-[11px] text-[#69736D] dark:text-[#9BA59E]">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-[#69736D] dark:text-[#9BA59E] leading-relaxed">
                    <strong className="text-[#17231E] dark:text-[#E8EFEA] font-bold">
                      {totalUnits} Units:
                    </strong>{" "}
                    {order.items.map((i) => `${i.productName} (${i.quantity} pcs)`).join(", ")}
                  </p>

                  {user.role === "OWNER" && (
                    <p className="text-[11px] text-[#B3853E] dark:text-[#D8AB64] font-medium">
                      Retailer: {order.customer.businessName || order.customer.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-3 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-[#DDE3DC] dark:border-[#212E28]">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] uppercase font-bold text-[#69736D] dark:text-[#9BA59E]">
                      Estimated Total
                    </p>
                    <p className="text-base sm:text-lg font-bold tabular-nums font-mono text-[#17231E] dark:text-[#E8EFEA]">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2.5 bg-[#173B35] hover:bg-[#285C4D] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 text-center shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Order & Chat</span>
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
