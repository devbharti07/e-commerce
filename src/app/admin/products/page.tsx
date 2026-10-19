import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminProductsClient } from "@/components/admin-products-client";
import { Smartphone } from "lucide-react";

export const metadata = {
  title: "Smartphone Products | Jagdamba Mobile Admin",
};

export default async function AdminProductsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/products");
  }

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: {
          where: { isPrimary: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Smartphone Catalog Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Publish handset models, configure warranty specifications, and manage featured showroom devices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/variants"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition"
          >
            Manage Variants
          </Link>
          <Link
            href="/admin/inventory"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg transition shadow-xs"
          >
            Inventory Desk
          </Link>
        </div>
      </div>

      <AdminProductsClient
        initialProducts={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          model: p.model,
          modelNumber: p.modelNumber,
          brandId: p.brandId,
          brandName: p.brand.name,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          description: p.description,
          isPublished: p.isPublished,
          isFeatured: p.isFeatured,
          variantsCount: p.variants.length,
          totalStockOnHand: p.variants.reduce((sum, v) => sum + v.onHandStock, 0),
          imageUrl: p.images[0]?.url,
          warrantyMonths: p.warrantyMonths,
        }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
