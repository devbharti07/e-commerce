import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProfileClient } from "@/components/profile-client";
import { ShieldCheck, UserCheck, MapPin, Package, ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?redirect=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      addresses: {
        orderBy: { isDefault: "desc" },
      },
      orders: {
        take: 3,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/catalog"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Retailer Account Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manage your business registration, contact details, and dispatch addresses
            </p>
          </div>
        </div>

        <Link
          href="/orders"
          className="px-4 py-2 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Package className="w-4 h-4" />
          View All My Orders
        </Link>
      </div>

      <ProfileClient
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          businessName: user.businessName || "",
          gstNumber: user.gstNumber || "",
          role: user.role,
        }}
        addresses={user.addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          mobileNumber: a.mobileNumber,
          houseOrShop: a.houseOrShop,
          street: a.street,
          locality: a.locality,
          city: a.city,
          state: a.state,
          pinCode: a.pinCode,
          country: a.country,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
