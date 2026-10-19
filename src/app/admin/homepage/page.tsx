import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHomepageClient } from "@/components/admin-homepage-client";
import { Home } from "lucide-react";

export const metadata = {
  title: "Homepage Management | Jagdamba Mobile Admin",
};

export default async function AdminHomepagePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/homepage");
  }

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      include: { brand: true },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "ANNOUNCEMENT_BANNER",
            "ANNOUNCEMENT_ACTIVE",
            "DELIVERY_INFO",
            "ORDERING_INSTRUCTIONS",
          ],
        },
      },
    }),
  ]);

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    displayOrder: p.displayOrder,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Homepage Dynamic Showcase Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure featured smartphone showroom models, display sequence, and announcement banners
          </p>
        </div>
      </div>

      <AdminHomepageClient
        initialProducts={formattedProducts}
        initialSettings={settingsMap}
      />
    </div>
  );
}
