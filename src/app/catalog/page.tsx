import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, Filter, Search, CheckCircle2, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import Image from "next/image";

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
  const ALLOWED_SORTS = new Set(["newest", "price_asc", "price_desc", "name_asc"]);
  const rawQ = (params.q || "").trim();
  const q = rawQ.slice(0, 100);
  const brandSlug = (params.brand || "").trim().slice(0, 80);
  const categorySlug = (params.category || "").trim().slice(0, 80);
  const sort = ALLOWED_SORTS.has(params.sort || "") ? params.sort! : "newest";
  const inStockOnly = params.inStockOnly === "true";

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

  // Fetch brands, categories, and products concurrently
  const [brands, categories, products] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        modelNumber: true,
        createdAt: true,
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isAvailable: true },
          select: {
            id: true,
            sku: true,
            ramGb: true,
            storageGb: true,
            colorName: true,
            baseWholesalePrice: true,
            minOrderQty: true,
            onHandStock: true,
            reservedStock: true,
            lowStockThreshold: true,
            isAvailable: true,
          },
          orderBy: { baseWholesalePrice: "asc" },
        },
        images: {
          select: { url: true },
          orderBy: { displayOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] min-h-[85vh] transition-colors">
      {/* Catalog Header & Live Query Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DDE3DC] dark:border-[#212E28]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              Wholesale Inventory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231E] dark:text-[#E8EFEA] tracking-tight">
            Wholesale Smartphone Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-1">
            Verified distributor stock with volume tier pricing and instant warehouse status
          </p>
        </div>

        {/* Quick Search inside catalog */}
        <form method="GET" action="/catalog" className="flex items-center gap-2 w-full sm:w-auto">
          {brandSlug && <input type="hidden" name="brand" value={brandSlug} />}
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {inStockOnly && <input type="hidden" name="inStockOnly" value="true" />}
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search model, specs, SKU..."
              className="bg-white dark:bg-[#18221D] text-xs rounded-xl pl-8 pr-3 py-2.5 border border-[#DDE3DC] dark:border-[#285C4D] text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] dark:focus:ring-[#B3853E] shadow-2xs w-full sm:w-64 placeholder:text-[#69736D]"
            />
            <Search className="w-3.5 h-3.5 text-[#69736D] absolute left-2.5 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#173B35] hover:bg-[#285C4D] dark:bg-[#285C4D] dark:hover:bg-[#173B35] text-white text-xs font-semibold rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] shadow-2xs overflow-hidden">
            <details className="group lg:open" open>
              <summary className="p-4 sm:p-5 flex items-center justify-between cursor-pointer list-none border-b border-[#DDE3DC] dark:border-[#212E28] select-none">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#B3853E] dark:text-[#D8AB64]" />
                  Filter Catalog
                  {(brandSlug || categorySlug || q || inStockOnly) && (
                    <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold bg-[#B3853E]/10 dark:bg-[#B3853E]/20 text-[#B3853E] dark:text-[#D8AB64] rounded-full">
                      Active
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {(brandSlug || categorySlug || q || inStockOnly) && (
                    <Link
                      href="/catalog"
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      Reset All
                    </Link>
                  )}
                  <span className="lg:hidden text-xs text-[#69736D] group-open:rotate-180 transition-transform duration-200">
                    ▼
                  </span>
                </div>
              </summary>

              <div className="p-4 sm:p-5 space-y-6">
                {/* Brand Filter */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#69736D] dark:text-[#9BA59E] mb-2.5">
                    Smartphone Brands
                  </h4>
                  <div className="space-y-1 text-xs">
                    <Link
                      href={`/catalog?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(categorySlug ? { category: categorySlug } : {}),
                        ...(inStockOnly ? { inStockOnly: "true" } : {}),
                        ...(sort ? { sort } : {}),
                      }).toString()}`}
                      className={`block px-3 py-2 rounded-lg font-medium transition ${
                        !brandSlug
                          ? "bg-[#173B35] text-white font-semibold shadow-xs"
                          : "text-[#69736D] dark:text-[#9BA59E] hover:bg-[#EAECE8] dark:hover:bg-[#212E28]"
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
                        className={`block px-3 py-2 rounded-lg font-medium transition ${
                          brandSlug === b.slug
                            ? "bg-[#173B35] text-white font-semibold shadow-xs"
                            : "text-[#69736D] dark:text-[#9BA59E] hover:bg-[#EAECE8] dark:hover:bg-[#212E28]"
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
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#69736D] dark:text-[#9BA59E] mb-2.5">
                      Segment / Category
                    </h4>
                    <div className="space-y-1 text-xs">
                      <Link
                        href={`/catalog?${new URLSearchParams({
                          ...(q ? { q } : {}),
                          ...(brandSlug ? { brand: brandSlug } : {}),
                          ...(inStockOnly ? { inStockOnly: "true" } : {}),
                          ...(sort ? { sort } : {}),
                        }).toString()}`}
                        className={`block px-3 py-2 rounded-lg font-medium transition ${
                          !categorySlug
                            ? "bg-[#173B35] text-white font-semibold shadow-xs"
                            : "text-[#69736D] dark:text-[#9BA59E] hover:bg-[#EAECE8] dark:hover:bg-[#212E28]"
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
                          className={`block px-3 py-2 rounded-lg font-medium transition ${
                            categorySlug === c.slug
                              ? "bg-[#173B35] text-white font-semibold shadow-xs"
                              : "text-[#69736D] dark:text-[#9BA59E] hover:bg-[#EAECE8] dark:hover:bg-[#212E28]"
                          }`}
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability Checkbox */}
                <div className="pt-4 border-t border-[#DDE3DC] dark:border-[#212E28]">
                  <Link
                    href={`/catalog?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(brandSlug ? { brand: brandSlug } : {}),
                      ...(categorySlug ? { category: categorySlug } : {}),
                      ...(sort ? { sort } : {}),
                      inStockOnly: inStockOnly ? "false" : "true",
                    }).toString()}`}
                    className="flex items-center gap-2.5 text-xs font-medium text-[#17231E] dark:text-[#E8EFEA] cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      readOnly
                      className="rounded border-[#DDE3DC] dark:border-[#285C4D] text-[#173B35] focus:ring-0 cursor-pointer"
                    />
                    <span>In-Stock Models Only</span>
                  </Link>
                </div>
              </div>
            </details>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Summary & Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#69736D] pb-3 border-b border-[#DDE3DC] dark:border-[#212E28]">
            <span className="font-medium text-[#17231E] dark:text-[#E8EFEA]">
              Showing <strong className="font-mono text-[#B3853E] dark:text-[#D8AB64]">{filteredProducts.length}</strong> wholesale handset models
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-[#69736D]">Sort by:</span>
              <div className="inline-flex rounded-xl border border-[#DDE3DC] dark:border-[#212E28] p-0.5 bg-white dark:bg-[#18221D]">
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
                      className={`px-3 py-1.5 text-[11px] rounded-lg transition font-medium ${
                        isActive
                          ? "bg-[#173B35] text-white font-semibold shadow-2xs"
                          : "text-[#69736D] dark:text-[#9BA59E] hover:text-[#173B35] dark:hover:text-white"
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
            <div className="bg-white dark:bg-[#18221D] rounded-2xl p-12 text-center border border-[#DDE3DC] dark:border-[#212E28] shadow-2xs space-y-3">
              <Smartphone className="w-10 h-10 text-[#69736D] mx-auto mb-2" />
              <h3 className="text-base font-bold text-[#17231E] dark:text-[#E8EFEA]">
                No matching smartphones found
              </h3>
              <p className="text-xs text-[#69736D] max-w-sm mx-auto">
                Try loosening your filters or search keywords. New shipments are added daily.
              </p>
              <div className="pt-2">
                <Link
                  href="/catalog"
                  className="inline-block px-4 py-2 bg-[#173B35] hover:bg-[#285C4D] text-white text-xs font-semibold rounded-xl shadow-2xs transition"
                >
                  Clear All Filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
                    className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] overflow-hidden flex flex-col hover:border-[#173B35] dark:hover:border-[#B3853E] shadow-2xs hover:shadow-xs transition"
                  >
                    {/* Handset Image */}
                    <div className="relative h-48 bg-[#EAECE8]/60 dark:bg-[#111916]/60 flex items-center justify-center p-4 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-3 hover:scale-105 transition duration-200"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-[#173B35]/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#285C4D]">
                        {product.brand.name}
                      </div>
                      {availableUnits <= 0 ? (
                        <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          SOLD OUT
                        </div>
                      ) : availableUnits <= (primaryVariant?.lowStockThreshold || 5) ? (
                        <div className="absolute top-3 right-3 bg-[#B3853E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          LOW STOCK ({availableUnits})
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          IN STOCK ({availableUnits})
                        </div>
                      )}
                    </div>

                    {/* Product Specs & Pricing */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-sm text-[#17231E] dark:text-[#E8EFEA] line-clamp-1 hover:text-[#173B35] dark:hover:text-[#D8AB64]">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] mt-0.5">
                          SKU: {primaryVariant?.sku || "N/A"}
                        </p>

                        {/* Configurations Pill List */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {product.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-[10px] font-semibold bg-[#EAECE8] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64] px-2 py-0.5 rounded-md"
                            >
                              {v.ramGb}/{v.storageGb}GB • {v.colorName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-[#DDE3DC] dark:border-[#212E28]">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-[#69736D] dark:text-[#9BA59E]">
                              Base Wholesale Price
                            </p>
                            <p className="text-base sm:text-lg font-bold text-[#17231E] dark:text-[#E8EFEA] tabular-nums font-mono">
                              {primaryVariant
                                ? formatCurrency(primaryVariant.baseWholesalePrice)
                                : "Price On Request"}
                            </p>
                          </div>
                          {primaryVariant && (
                            <span className="text-[10px] font-medium text-[#69736D] dark:text-[#9BA59E]">
                              MOQ: {primaryVariant.minOrderQty} pcs
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.slug}`}
                          className="mt-3.5 w-full block text-center py-2.5 bg-[#173B35] hover:bg-[#285C4D] text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-2xs"
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
