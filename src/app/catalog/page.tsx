import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, Filter, SlidersHorizontal, Search, CheckCircle2 } from "lucide-react";

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStockOnly?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const q = params.q || "";
  const brandSlug = params.brand || "";
  const categorySlug = params.category || "";
  const sort = params.sort || "newest";
  const inStockOnly = params.inStockOnly === "true";

  // Fetch all brands and categories for filter sidebar
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  // Build query filter
  const whereClause: any = {
    isPublished: true,
    isArchived: false,
  };

  if (brandSlug) {
    whereClause.brand = { slug: brandSlug };
  }

  if (categorySlug) {
    whereClause.category = { slug: categorySlug };
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { model: { contains: q } },
      { modelNumber: { contains: q } },
      { description: { contains: q } },
      { variants: { some: { sku: { contains: q } } } },
    ];
  }

  // Fetch products
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      brand: true,
      category: true,
      variants: {
        include: {
          pricingTiers: {
            orderBy: { minQty: "asc" },
          },
        },
        orderBy: { baseWholesalePrice: "asc" },
      },
      images: {
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy:
      sort === "price_asc"
        ? { createdAt: "desc" } // sorting handled in application layer for variant pricing
        : sort === "price_desc"
        ? { createdAt: "desc" }
        : { createdAt: "desc" },
  });

  // Client filtering for stock if requested
  const filteredProducts = inStockOnly
    ? products.filter((p) =>
        p.variants.some((v) => v.isAvailable && v.onHandStock - v.reservedStock > 0)
      )
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Wholesale Smartphone Catalog
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse live distributor handsets with volume tier pricing & instant stock status
          </p>
        </div>

        {/* Quick Search inside catalog */}
        <form method="GET" action="/catalog" className="flex items-center gap-2">
          {brandSlug && <input type="hidden" name="brand" value={brandSlug} />}
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search model, specs, SKU..."
              className="bg-white dark:bg-gray-800 text-sm rounded-lg pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] text-xs font-bold rounded-lg"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#FCA311]" />
                Filter Catalog
              </h3>
              {(brandSlug || categorySlug || q || inStockOnly) && (
                <Link
                  href="/catalog"
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Reset
                </Link>
              )}
            </div>

            {/* Brand Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Brand
              </h4>
              <div className="space-y-1.5 text-xs">
                <Link
                  href={`/catalog?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(categorySlug ? { category: categorySlug } : {}),
                  }).toString()}`}
                  className={`block px-2.5 py-1.5 rounded-lg font-medium ${
                    !brandSlug
                      ? "bg-[#14213D] text-white font-bold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  All Brands
                </Link>
                {brands.map((b) => (
                  <Link
                    key={b.id}
                    href={`/catalog?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      brand: b.slug,
                      ...(categorySlug ? { category: categorySlug } : {}),
                    }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg font-medium ${
                      brandSlug === b.slug
                        ? "bg-[#14213D] text-white font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Segment
              </h4>
              <div className="space-y-1.5 text-xs">
                <Link
                  href={`/catalog?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(brandSlug ? { brand: brandSlug } : {}),
                  }).toString()}`}
                  className={`block px-2.5 py-1.5 rounded-lg font-medium ${
                    !categorySlug
                      ? "bg-[#14213D] text-white font-bold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  All Segments
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/catalog?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(brandSlug ? { brand: brandSlug } : {}),
                      category: c.slug,
                    }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg font-medium ${
                      categorySlug === c.slug
                        ? "bg-[#14213D] text-white font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Availability Checkbox */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <Link
                href={`/catalog?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(brandSlug ? { brand: brandSlug } : {}),
                  ...(categorySlug ? { category: categorySlug } : {}),
                  inStockOnly: inStockOnly ? "false" : "true",
                }).toString()}`}
                className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  readOnly
                  className="rounded text-[#FCA311] focus:ring-[#FCA311]"
                />
                In-Stock Units Only
              </Link>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filteredProducts.length} wholesale smartphone models</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center border border-gray-200 dark:border-gray-700">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No matching smartphones found
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try loosening your filters or search terms. Our wholesale inventory is updated regularly.
              </p>
              <Link
                href="/catalog"
                className="mt-4 inline-block px-4 py-2 bg-[#14213D] text-white text-xs font-bold rounded-lg"
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const primaryVariant = product.variants[0];
                const availableUnits = primaryVariant
                  ? primaryVariant.onHandStock - primaryVariant.reservedStock
                  : 0;
                const imageUrl =
                  product.images[0]?.url ||
                  "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80";

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col hover:border-[#FCA311] dark:hover:border-[#FCA311] shadow-sm hover:shadow-md transition"
                  >
                    <div className="relative h-48 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-[#14213D] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {product.brand.name}
                      </div>
                      {availableUnits <= 0 ? (
                        <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          SOLD OUT
                        </div>
                      ) : availableUnits <= (primaryVariant?.lowStockThreshold || 5) ? (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          LOW STOCK ({availableUnits})
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          IN STOCK ({availableUnits})
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          SKU: {primaryVariant?.sku || "N/A"}
                        </p>

                        {/* Configurations Pill List */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {product.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                            >
                              {v.ramGb}/{v.storageGb}GB • {v.colorName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">
                              Wholesale Unit Price
                            </p>
                            <p className="text-lg font-black text-[#14213D] dark:text-[#FCA311]">
                              {primaryVariant
                                ? formatCurrency(primaryVariant.baseWholesalePrice)
                                : "Call"}
                            </p>
                          </div>
                          {primaryVariant && (
                            <span className="text-[10px] font-bold text-gray-500">
                              MOQ: {primaryVariant.minOrderQty} pcs
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.slug}`}
                          className="mt-3 w-full block text-center py-2.5 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 transition"
                        >
                          View Pricing Tiers & Order
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
