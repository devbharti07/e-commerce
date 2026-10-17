import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  Boxes,
  Zap,
  PhoneCall,
  Clock,
  Layers,
} from "lucide-react";

export default async function HomePage() {
  // Fetch real brands from DB
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Fetch real published products with variants & pricing
  const products = await prisma.product.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  // Calculate live wholesale statistics
  const totalVariantsCount = await prisma.productVariant.count({
    where: { isAvailable: true },
  });

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#14213D] via-[#1a2d52] to-[#0c1527] text-white py-16 lg:py-24 overflow-hidden border-b border-[#FCA311]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FCA311] text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 text-[#FCA311]" />
                India's Verified Wholesale Smartphone Hub
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Direct Distributor Stock. <br />
                <span className="text-[#FCA311]">Real Wholesale Tiers.</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
                Empowering mobile retailers and telecom resellers with 100% genuine brand-sealed smartphones, live warehouse inventory, transparent volume tier pricing, and direct dealer confirmation.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/catalog"
                  className="px-6 py-3.5 bg-[#FCA311] text-[#14213D] font-bold text-sm rounded-xl shadow-lg hover:bg-[#e5940f] hover:shadow-xl transition flex items-center gap-2"
                >
                  Browse Smartphone Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-sm transition"
                >
                  Register as Retailer
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs">
                <div>
                  <p className="font-bold text-lg sm:text-2xl text-[#FCA311]">100%</p>
                  <p className="text-gray-400">Brand Sealed Pack</p>
                </div>
                <div>
                  <p className="font-bold text-lg sm:text-2xl text-[#FCA311]">GST</p>
                  <p className="text-gray-400">18% Input Credit</p>
                </div>
                <div>
                  <p className="font-bold text-lg sm:text-2xl text-[#FCA311]">7 Days</p>
                  <p className="text-gray-400">DOA Replacement</p>
                </div>
              </div>
            </div>

            {/* Quick Inquiry / Status Card */}
            <div className="lg:col-span-5">
              <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h3 className="font-bold text-lg text-white">Live Warehouse Desk</h3>
                    <p className="text-xs text-gray-400">Real-time dealer ordering & dispatch</p>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Open for Bookings
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-300">Active Handset SKUs</span>
                    <span className="font-bold text-white text-sm">{totalVariantsCount}+ Models Ready</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-300">Min. Order Requirement</span>
                    <span className="font-bold text-white text-sm">₹25,000 / 2 Units Min</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-300">Direct Dealer Line</span>
                    <span className="font-bold text-[#FCA311] text-sm">+91 98765 43210</span>
                  </div>
                </div>

                <Link
                  href="/catalog"
                  className="w-full block text-center py-3 bg-white text-[#14213D] font-bold text-xs rounded-xl hover:bg-gray-100 transition shadow"
                >
                  View Live Wholesale Inventory
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR SMARTPHONE BRANDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Authorized Wholesale Brands
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Direct brand sealed inventory with manufacturer India warranty
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-semibold text-[#14213D] dark:text-[#FCA311] hover:underline flex items-center gap-1"
          >
            All Brands <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalog?brand=${encodeURIComponent(b.slug)}`}
              className="group bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-[#FCA311] dark:hover:border-[#FCA311] shadow-sm hover:shadow-md transition text-center flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 group-hover:bg-[#14213D] group-hover:text-white flex items-center justify-center transition">
                <Smartphone className="w-6 h-6 text-[#14213D] dark:text-[#FCA311] group-hover:text-[#FCA311]" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {b.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bulk Wholesale Deals
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED WHOLESALE PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Featured Smartphone Models
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verified live on-hand stock ready for dealer bulk order request
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-semibold text-[#14213D] dark:text-[#FCA311] hover:underline flex items-center gap-1"
          >
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <Boxes className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Products Published Yet</h3>
            <p className="text-sm text-gray-500 mt-1">Check back soon or sign in as administrator to add models.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col hover:border-[#FCA311] dark:hover:border-[#FCA311] shadow-sm hover:shadow-md transition"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 overflow-hidden">
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
                        LOW STOCK
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        IN STOCK
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Model No: {product.modelNumber}
                      </p>

                      {/* Variant Specs */}
                      {primaryVariant && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                            {primaryVariant.ramGb}GB RAM
                          </span>
                          <span className="text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                            {primaryVariant.storageGb}GB Storage
                          </span>
                          <span className="text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                            {primaryVariant.colorName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            Base Wholesale Price
                          </p>
                          <p className="text-lg font-black text-[#14213D] dark:text-[#FCA311]">
                            {primaryVariant
                              ? formatCurrency(primaryVariant.baseWholesalePrice)
                              : "Price On Request"}
                          </p>
                        </div>
                        {primaryVariant && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-500 block">
                              Min Qty: {primaryVariant.minOrderQty} pcs
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold block">
                              {availableUnits} in stock
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-3 w-full block text-center py-2.5 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-xs rounded-xl hover:opacity-90 transition"
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
      <section className="bg-gray-100 dark:bg-gray-800/60 py-16 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCA311]">
              Transparent B2B Workflow
            </span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              How Wholesale Ordering Works
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Unlike retail websites with instant checkout, wholesale distribution requires dealer confirmation, stock allocation, and dispatch schedule verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-black">
                1
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Select Models & Tiers</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Choose models, RAM/Storage configurations, and quantities. Unit prices dynamically adjust based on volume tiers.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-black">
                2
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Pin Delivery Address</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter your retail shop address or select the exact location on Google Maps for freight transit calculation.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-black">
                3
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Submit Order Request</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Generate your formal bulk request. An order conversation opens directly with Jagdamba Mobile distribution managers.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-black">
                4
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Dealer Confirmation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Align on delivery timeline and payment terms. Dealer confirms the order, reserves physical stock, and initiates dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHOLESALE ADVANTAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#14213D] text-white rounded-3xl p-8 lg:p-12 shadow-xl border border-[#FCA311]/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FCA311]">
                Dealer Partnership
              </span>
              <h2 className="text-3xl font-black mt-2 leading-tight">
                Why Mobile Retailers Across India Trust Jagdamba Mobile
              </h2>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FCA311] shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    <strong className="text-white">Verified IMEI & Genuine Invoices:</strong> Every unit is scanned before packing. Full 18% GST Input Tax Credit provided.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FCA311] shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    <strong className="text-white">Concurrency-Safe Stock:</strong> Real-time database inventory ensures zero overselling. What you see is available in warehouse.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FCA311] shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    <strong className="text-white">Direct Order Messaging:</strong> Propose revisions, negotiate volume pricing for 50+ units, and track dispatch status seamlessly.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 lg:p-8 rounded-2xl border border-white/15 text-center space-y-4">
              <h3 className="text-xl font-bold">Ready to Elevate Your Mobile Store Inventory?</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Register your retail business today to inspect tier pricing, download wholesale catalog sheets, and place priority order requests.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-[#FCA311] text-[#14213D] font-bold text-xs rounded-xl hover:bg-[#e5940f] transition shadow"
                >
                  Create Retailer Account
                </Link>
                <Link
                  href="/catalog"
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl transition"
                >
                  Explore All Models
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
