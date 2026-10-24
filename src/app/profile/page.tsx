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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] min-h-[85vh] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DDE3DC] dark:border-[#212E28]">
        <div className="flex items-center gap-3.5">
          <Link
            href="/catalog"
            className="p-2.5 rounded-xl bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#212E28] hover:border-[#173B35] text-[#17231E] dark:text-[#E8EFEA] transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231E] dark:text-[#E8EFEA] tracking-tight">
                Retailer Account Profile
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-1">
              Manage your business registration, contact details, and dispatch addresses
            </p>
          </div>
        </div>

        <Link
          href="/orders"
          className="px-4 py-2.5 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow-2xs cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>View All My Orders</span>
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
