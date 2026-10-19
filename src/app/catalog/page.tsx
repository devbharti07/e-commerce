import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, Filter, Search, CheckCircle2, SlidersHorizontal, ArrowUpDown } from "lucide-react";

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
      { name: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { modelNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
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
    orderBy: { createdAt: "desc" },
  });

  // Client filtering for stock if requested
  const filteredProducts = inStockOnly
    ? products.filter((p) =>
        p.variants.some((v) => v.isAvailable && v.onHandStock - v.reservedStock > 0)
      )
    : [...products];

  // Apply sorting
  if (sort === "price_asc") {
    filteredProducts.sort((a, b) => {
      const aMin = a.variants[0]?.baseWholesalePrice ?? 0;
      const bMin = b.variants[0]?.baseWholesalePrice ?? 0;
      return aMin - bMin;
    });
  } else if (sort === "price_desc") {
    filteredProducts.sort((a, b) => {
      const aMin = a.variants[0]?.baseWholesalePrice ?? 0;
      const bMin = b.variants[0]?.baseWholesalePrice ?? 0;
      return bMin - aMin;
    });
  } else if (sort === "name_asc") {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Catalog Header & Live Query Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Wholesale Smartphone Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Verified distributor stock with volume tier pricing and instant warehouse status
          </p>
        </div>

        {/* Quick Search inside catalog */}
        <form method="GET" action="/catalog" className="flex items-center gap-2">
          {brandSlug && <input type="hidden" name="brand" value={brandSlug} />}
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {inStockOnly && <input type="hidden" name="inStockOnly" value="true" />}
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search model, specs, SKU..."
              className="bg-white dark:bg-slate-900 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs w-48 sm:w-60"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-2xs transition"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                Filter Catalog
              </h3>
              {(brandSlug || categorySlug || q || inStockOnly) && (
                <Link
                  href="/catalog"
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Reset All
                </Link>
              )}
            </div>

            {/* Brand Filter */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Brands
              </h4>
              <div className="space-y-1 text-xs">
                <Link
                  href={`/catalog?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(categorySlug ? { category: categorySlug } : {}),
                    ...(inStockOnly ? { inStockOnly: "true" } : {}),
                    ...(sort ? { sort } : {}),
                  }).toString()}`}
                  className={`block px-2.5 py-1.5 rounded-md font-medium transition ${
                    !brandSlug
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      ...(inStockOnly ? { inStockOnly: "true" } : {}),
                      ...(sort ? { sort } : {}),
                    }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-md font-medium transition ${
                      brandSlug === b.slug
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Category / Segment Filter */}
            {categories.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Category
                </h4>
                <div className="space-y-1 text-xs">
                  <Link
                    href={`/catalog?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(brandSlug ? { brand: brandSlug } : {}),
                      ...(inStockOnly ? { inStockOnly: "true" } : {}),
                      ...(sort ? { sort } : {}),
                    }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-md font-medium transition ${
                      !categorySlug
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        ...(inStockOnly ? { inStockOnly: "true" } : {}),
                        ...(sort ? { sort } : {}),
                      }).toString()}`}
                      className={`block px-2.5 py-1.5 rounded-md font-medium transition ${
                        categorySlug === c.slug
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Checkbox */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/catalog?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(brandSlug ? { brand: brandSlug } : {}),
                  ...(categorySlug ? { category: categorySlug } : {}),
                  ...(sort ? { sort } : {}),
                  inStockOnly: inStockOnly ? "false" : "true",
                }).toString()}`}
                className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  readOnly
                  className="rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-0"
                />
                <span>In-Stock Models Only</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Results Summary & Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Showing {filteredProducts.length} wholesale handset models
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400">Sort:</span>
              <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
                {[
                  { label: "Newest", val: "newest" },
                  { label: "Price: Low to High", val: "price_asc" },
                  { label: "Price: High to Low", val: "price_desc" },
                ].map((s) => {
                  const isActive = sort === s.val || (!sort && s.val === "newest");
                  return (
                    <Link
                      key={s.val}
                      href={`/catalog?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(brandSlug ? { brand: brandSlug } : {}),
                        ...(categorySlug ? { category: categorySlug } : {}),
                        ...(inStockOnly ? { inStockOnly: "true" } : {}),
                        sort: s.val,
                      }).toString()}`}
                      className={`px-2.5 py-1 text-[11px] rounded transition font-medium ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {s.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No matching smartphones found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your filters or search keywords. New shipments are added daily.
              </p>
              <div className="pt-2">
                <Link
                  href="/catalog"
                  className="inline-block px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-2xs transition"
                >
                  Clear All Filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs transition"
                  >
                    {/* Handset Image */}
                    <div className="relative h-44 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-3">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain hover:scale-105 transition duration-200"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        {product.brand.name}
                      </div>
                      {availableUnits <= 0 ? (
                        <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          SOLD OUT
                        </div>
                      ) : availableUnits <= (primaryVariant?.lowStockThreshold || 5) ? (
                        <div className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded">
                          LOW STOCK ({availableUnits})
                        </div>
                      ) : (
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          IN STOCK ({availableUnits})
                        </div>
                      )}
                    </div>

                    {/* Product Specs & Pricing */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          SKU: {primaryVariant?.sku || "N/A"}
                        </p>

                        {/* Configurations Pill List */}
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {product.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded"
                            >
                              {v.ramGb}/{v.storageGb}GB • {v.colorName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400">
                              Base Wholesale Price
                            </p>
                            <p className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                              {primaryVariant
                                ? formatCurrency(primaryVariant.baseWholesalePrice)
                                : "Price On Request"}
                            </p>
                          </div>
                          {primaryVariant && (
                            <span className="text-[10px] font-medium text-slate-500">
                              MOQ: {primaryVariant.minOrderQty} pcs
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.slug}`}
                          className="mt-3 w-full block text-center py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition"
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
