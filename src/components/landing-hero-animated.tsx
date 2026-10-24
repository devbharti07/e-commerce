"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Store,
} from "lucide-react";

interface LandingHeroProps {
  totalVariantsCount: number;
  contactPhone: string;
  minOrderValuePaise: number;
  featuredImageUrl?: string;
  featuredProductName?: string;
}

export function LandingHeroAnimated({
  totalVariantsCount,
  contactPhone,
  minOrderValuePaise,
  featuredImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80",
  featuredProductName = "Apple iPhone 16 Pro Max",
}: LandingHeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#0D1815] text-white pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 border-b border-[#212E28]">
      {/* Editorial Ambient Light & Delicate Grid Pattern */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(179,133,62,0.22),rgba(13,24,21,0))] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Content (7 cols) */}
          <div className="lg:col-span-7 space-y-7">
            {/* Direct Distributor Trust Chip */}
            <div className="animate-hero-entrance inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#18221D]/90 text-[#D8AB64] text-xs font-semibold border border-[#2B3B33] shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#B3853E] animate-ping" />
              <span>Direct Central Delhi B2B Warehouse • Legitimate Indian Stock</span>
            </div>

            {/* Main Headline with Staggered Entrance */}
            <div className="animate-hero-delay-1 space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Direct Factory Allotment. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D8AB64] via-[#F4E3B9] to-[#B3853E]">
                  Transparent Wholesale Tiers.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#D5DDD7] max-w-xl leading-relaxed font-normal pt-1">
                Supplying retail electronics stores, mobile trade shops, and regional distributors across India with 100% brand-sealed smartphones, live warehouse stock allocation, legitimate 18% GST input credit invoices, and direct dealer order confirmation.
              </p>
            </div>

            {/* Interactive Call to Actions */}
            <div className="animate-hero-delay-2 flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/catalog"
                className="group relative px-6 py-3.5 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Explore Handset Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link
                href="/register"
                className="px-6 py-3.5 bg-[#18221D] hover:bg-[#212E28] text-[#E8EFEA] hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-[#2B3B33] hover:border-[#3D4F45] transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-[#D8AB64]" />
                <span>Register Retail Store</span>
              </Link>
            </div>

            {/* Verified Wholesale Trust Indicators Strip */}
            <div className="animate-hero-delay-2 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#212E28] text-xs">
              <div>
                <p className="font-extrabold text-lg sm:text-xl text-[#D8AB64] tabular-nums font-mono">100%</p>
                <p className="text-[#9BA59E] text-[11px] mt-0.5">Brand-Sealed Packs</p>
              </div>
              <div>
                <p className="font-extrabold text-lg sm:text-xl text-[#D8AB64] tabular-nums font-mono">18% GST</p>
                <p className="text-[#9BA59E] text-[11px] mt-0.5">Input Tax Invoices</p>
              </div>
              <div>
                <p className="font-extrabold text-lg sm:text-xl text-[#D8AB64] tabular-nums font-mono">7 Days</p>
                <p className="text-[#9BA59E] text-[11px] mt-0.5">DOA Replacement</p>
              </div>
              <div>
                <p className="font-extrabold text-lg sm:text-xl text-[#D8AB64] tabular-nums font-mono">2 Pcs</p>
                <p className="text-[#9BA59E] text-[11px] mt-0.5">Flexible Min Order</p>
              </div>
            </div>
          </div>

          {/* Right Smartphone Visual & Live Warehouse Terminal (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative bg-gradient-to-b from-[#18221D] to-[#121B17] rounded-3xl p-6 sm:p-7 border border-[#2B3B33] shadow-2xl backdrop-blur-md overflow-hidden group transition-all duration-300"
            >
              {/* Subtle Corner Accent Light */}
              <div
                className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#B3853E]/15 blur-2xl pointer-events-none"
                aria-hidden="true"
              />

              {/* Floating Genuine Stock Badge */}
              <div className="absolute top-4 right-4 bg-[#173B35] text-[#D8AB64] text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full border border-[#B3853E]/40 shadow-md flex items-center gap-1.5 z-10">
                <BadgeCheck className="w-3.5 h-3.5 text-[#B3853E]" />
                <span>Verified Stock</span>
              </div>

              {/* Live Warehouse Terminal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#212E28]">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Live Warehouse Terminal</h3>
                  <p className="text-[11px] text-[#9BA59E]">Central Delhi B2B Distribution Hub</p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-[11px] font-semibold border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Allocation
                </span>
              </div>

              {/* Animated Smartphone Frame */}
              <div className="relative my-4 h-52 sm:h-60 w-full flex items-center justify-center">
                <div
                  className={`relative w-full h-full transition-transform duration-700 ease-out ${
                    isHovered ? "scale-105 -translate-y-1" : "animate-float-gentle"
                  }`}
                >
                  <Image
                    src={featuredImageUrl}
                    alt={featuredProductName}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    priority
                    className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
                  />
                </div>
                
                {/* Floating stock pill pinned on handset */}
                <div className="absolute bottom-2 left-2 bg-[#0F1A17]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2B3B33] text-[10px] font-semibold text-[#E8EFEA] flex items-center gap-2 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Physical Indian Retail Stock</span>
                </div>
              </div>

              {/* Real-time Warehouse Metrics */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-[#0F1A17]/80 p-3 rounded-xl border border-[#212E28]">
                  <span className="text-[#9BA59E]">Available Handset SKUs</span>
                  <span className="font-bold text-white tabular-nums text-xs sm:text-sm font-mono">
                    {totalVariantsCount}+ Models Ready
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#0F1A17]/80 p-3 rounded-xl border border-[#212E28]">
                  <span className="text-[#9BA59E]">Minimum Order Size</span>
                  <span className="font-bold text-white tabular-nums font-mono">
                    {formatCurrency(minOrderValuePaise)} (2 pcs min)
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#0F1A17]/80 p-3 rounded-xl border border-[#212E28]">
                  <span className="text-[#9BA59E]">Direct Wholesale Desk</span>
                  <span className="font-bold text-[#D8AB64] font-mono">{contactPhone}</span>
                </div>
              </div>

              {/* Catalog CTA Link */}
              <Link
                href="/catalog"
                className="mt-4 w-full block text-center py-3 bg-[#173B35] hover:bg-[#285C4D] text-white font-semibold text-xs rounded-xl transition duration-200 border border-[#285C4D] shadow-xs cursor-pointer group"
              >
                <span>View Real-Time Warehouse Stock</span>
                <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform duration-200">&rarr;</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
