import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Users,
  Building,
  Phone,
  Mail,
  FileText,
  MapPin,
  Package,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface RetailerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RetailerDetailPage({ params }: RetailerDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "OWNER") {
    redirect(`/login?redirect=/admin/retailers/${id}`);
  }

  const retailer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      conversations: {
        include: {
          order: { select: { id: true, orderNumber: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!retailer || retailer.role === "OWNER") {
    notFound();
  }

  const totalDeliveredRevenue = retailer.orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/admin/retailers"
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {retailer.businessName || retailer.name}
            </h1>
            {retailer.isSuspended ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                Suspended
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active Trader
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Retailer Profile ID: {retailer.id} • Registered {formatDateTime(retailer.createdAt)}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact & Business Info */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#FCA311]" />
            Business Dossier
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400 block">Proprietor Name:</span>
              <span className="font-bold text-gray-900 dark:text-white">{retailer.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Mobile Phone:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {retailer.phone}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Email Address:</span>
              <span className="text-gray-900 dark:text-white">{retailer.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block">GSTIN / Tax ID:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {retailer.gstNumber || "Not Provided"}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-500" />
            Wholesale Trade Summary
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400 block">Total Orders Submitted:</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {retailer.orders.length} orders
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Fulfilled Trade Volume:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalDeliveredRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Registered Delivery Address */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500" />
            Shipping & Shop Address
          </h2>
          {retailer.addresses.length === 0 ? (
            <p className="text-xs text-gray-400">No registered address saved yet.</p>
          ) : (
            retailer.addresses.map((addr) => (
              <div key={addr.id} className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                <p className="font-bold text-gray-900 dark:text-white">{addr.fullName}</p>
                <p>{addr.houseOrShop}, {addr.street}</p>
                <p>{addr.locality}, {addr.city}, {addr.state} - {addr.pinCode}</p>
                <p className="text-[11px] text-gray-400">Phone: {addr.mobileNumber}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Retailer Orders List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
        <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-[#FCA311]" />
          Order History ({retailer.orders.length})
        </h2>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
          {retailer.orders.length === 0 ? (
            <p className="text-gray-400 py-6 text-center">No orders placed by this retailer yet.</p>
          ) : (
            retailer.orders.map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {ord.status}
                    </span>
                    <span className="text-gray-400">{formatDateTime(ord.createdAt)}</span>
                  </div>
                  <p className="text-gray-500 mt-1">
                    {ord.items.map((it) => `${it.productName} (${it.quantity}x)`).join(", ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(ord.totalAmount)}
                  </p>
                  <Link
                    href={`/admin/orders/${ord.id}`}
                    className="text-[11px] text-[#14213D] dark:text-[#FCA311] font-semibold hover:underline"
                  >
                    Manage Order &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
