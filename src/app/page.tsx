import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Boxes,
  Zap,
  PhoneCall,
  Clock,
  Layers,
  Truck,
  Sparkles,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let brands: any[] = [];
  let products: any[] = [];
  let totalVariantsCount = 0;
  let siteSettings: any[] = [];

  try {
    const [fetchedBrands, fetchedProducts, count, settings] = await Promise.all([
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { isPublished: true, isArchived: false },
        include: {
          brand: true,
          variants: {
            where: { isAvailable: true },
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
        take: 8,
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.productVariant.count({
        where: { isAvailable: true },
      }),
      prisma.siteSetting.findMany(),
    ]);

    brands = fetchedBrands;
    products = fetchedProducts;
    totalVariantsCount = count;
    siteSettings = settings;
  } catch (error) {
    console.warn("Database queries fallback during HomePage render:", error);
  }

  const settingsMap: Record<string, string> = {};
  siteSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const announcementBanner = settingsMap["ANNOUNCEMENT_BANNER"];
  const isAnnouncementActive = settingsMap["ANNOUNCEMENT_ACTIVE"] === "true";
  const contactPhone = settingsMap["CONTACT_PHONE"] || "+91 98765 43210";
  const minOrderValuePaise = parseInt(settingsMap["MIN_ORDER_VALUE"] || "2500000");

  return (
    <div className="space-y-12 pb-16">
      {/* Dynamic Announcement Banner */}
      {isAnnouncementActive && announcementBanner && (
        <div className="bg-amber-400 text-slate-900 px-4 py-2 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-2xs">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>{announcementBanner}</span>
        </div>
      )}

      {/* 1. PROFESSIONAL HERO SECTION */}
      <section className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-medium border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Verified B2B Wholesale Smartphone Hub</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Direct Distributor Stock. <br />
                <span className="text-amber-400">Transparent Volume Tiers.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Supplying mobile retailers and telecom dealers across India with 100% genuine brand-sealed smartphones, live warehouse inventory, GST input credit invoices, and direct dealer order confirmation.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs sm:text-sm rounded-lg shadow-xs transition flex items-center gap-2"
                >
                  <span>Browse Handset Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-lg border border-slate-700 transition"
                >
                  Register Retail Store
                </Link>
              </div>

              {/* Trust Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <p className="font-bold text-base sm:text-lg text-amber-400">100%</p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">Brand Sealed Pack</p>
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg text-amber-400">18% GST</p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">Input Credit Invoices</p>
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg text-amber-400">7 Days</p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">DOA Replacement</p>
                </div>
              </div>
            </div>

            {/* Live Warehouse Desk Status Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 rounded-xl p-5 sm:p-6 border border-slate-700/80 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div>
                    <h3 className="font-bold text-sm text-white">Live Warehouse Desk</h3>
                    <p className="text-[11px] text-slate-400">Central Delhi Distribution Terminal</p>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Open for Bookings
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Active Handset SKUs</span>
                    <span className="font-semibold text-white tabular-nums">{totalVariantsCount}+ Models Ready</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Minimum Order Value</span>
                    <span className="font-semibold text-white tabular-nums">{formatCurrency(minOrderValuePaise)} (2 pcs min)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Wholesale Desk Line</span>
                    <span className="font-bold text-amber-400">{contactPhone}</span>
                  </div>
                </div>

                <Link
                  href="/catalog"
                  className="w-full block text-center py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg transition"
                >
                  View Live Wholesale Inventory &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND QUICK DISCOVERY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Authorized Smartphone Brands
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct brand sealed inventory with manufacturer India warranty
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            All Brands <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalog?brand=${encodeURIComponent(b.slug)}`}
              className="group bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs transition text-center flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 flex items-center justify-center transition">
                <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-amber-400 dark:group-hover:text-amber-600" />
              </div>
              <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate w-full">
                {b.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED WHOLESALE PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Featured Smartphone Models
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified warehouse on-hand stock ready for dealer bulk order requests
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-10 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500 shadow-2xs">
            <Boxes className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Products Published Yet</p>
            <p className="mt-1 text-slate-500 max-w-sm mx-auto">
              Wholesale smartphone inventory is currently being updated. Authorized administrators can add new models in the admin console.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product (Admin)
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product) => {
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
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
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
                        LOW STOCK
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        IN STOCK
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Model: {product.modelNumber}
                      </p>

                      {/* Variant Specs */}
                      {primaryVariant && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {primaryVariant.ramGb}GB RAM
                          </span>
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {primaryVariant.storageGb}GB Storage
                          </span>
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {primaryVariant.colorName}
                          </span>
                        </div>
                      )}
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
                          <div className="text-right">
                            <span className="text-[10px] font-medium text-slate-500 block">
                              Min: {primaryVariant.minOrderQty} pcs
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block tabular-nums">
                              {availableUnits} ready
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-3 w-full block text-center py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition"
                      >
                        Inspect Specifications & Tiers
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. HOW WHOLESALE ORDERING WORKS */}
      <section className="bg-slate-100 dark:bg-slate-900/60 py-12 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              B2B Wholesale Workflow
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              How Wholesale Ordering Works
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Structured B2B order handling with dealer confirmation, physical stock allocation, and dispatch schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Select Models & Tiers</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose storage/RAM variants and order quantities. Unit prices automatically apply wholesale volume discounts.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Pin Delivery Shop</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide your mobile shop delivery address or select the exact location on Google Maps for freight transit calculations.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Submit Order Request</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Generate your formal bulk request. An order conversation opens directly with Jagdamba distribution managers.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                4
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Dealer Confirmation</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Confirm final pricing and payment terms. Stock is reserved atomically and dispatched via insured transit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DEALER ADVANTAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 lg:p-8 border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Dealer Partnership Guarantee
              </span>
              <h2 className="text-2xl font-bold leading-tight">
                Why Mobile Retailers Across India Rely on Jagdamba Mobile
              </h2>
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Verified IMEI & Genuine Invoices:</strong> Every unit is verified before packing. Legitimate 18% GST Input Credit invoices provided.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Concurrency-Safe Stock:</strong> Real-time PostgreSQL inventory prevents overselling. What is displayed is physically on-hand.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Direct Order Negotiations:</strong> Propose revisions, review revised terms, and communicate directly with the owner desk.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 lg:p-6 rounded-lg border border-slate-700/60 text-center space-y-3">
              <h3 className="text-base font-bold text-white">Ready to Source Handsets for Your Store?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Register your retail business today to inspect volume tier discounts, request custom bulk quotes, and receive prioritized dispatch.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <Link
                  href="/register"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition shadow-2xs"
                >
                  Create Retailer Account
                </Link>
                <Link
                  href="/catalog"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg transition"
                >
                  Explore All Handsets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
