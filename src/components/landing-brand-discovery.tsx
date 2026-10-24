"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Smartphone, ArrowRight, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface LandingBrandDiscoveryProps {
  brands: BrandItem[];
}

export function LandingBrandDiscovery({ brands }: LandingBrandDiscoveryProps) {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  return (
    <section id="brands" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ScrollReveal direction="up" durationMs={500}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-[#DDE3DC] dark:border-[#212E28]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64] mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B3853E]" />
              <span>Manufacturer Authorized Stock</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] dark:text-[#E8EFEA] tracking-tight">
              Supported Smartphone Brands
            </h2>
            <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-0.5">
              Brand-sealed factory stock with 1-Year official manufacturer warranty across India
            </p>
          </div>
          <Link
            href="/catalog"
            className="group self-start sm:self-auto text-xs font-bold text-[#B3853E] dark:text-[#D8AB64] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Explore All Brands</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {brands.map((brand, index) => {
          const isHovered = activeHoverId === brand.id;

          return (
            <ScrollReveal
              key={brand.id}
              direction="up"
              delayMs={index * 40}
              durationMs={450}
            >
              <Link
                href={`/catalog?brand=${encodeURIComponent(brand.slug)}`}
                onMouseEnter={() => setActiveHoverId(brand.id)}
                onMouseLeave={() => setActiveHoverId(null)}
                className={`group relative bg-white dark:bg-[#18221D] p-4 rounded-xl border transition-all duration-200 text-center flex flex-col items-center justify-center space-y-2.5 cursor-pointer ${
                  isHovered
                    ? "border-[#173B35] dark:border-[#B3853E] shadow-sm -translate-y-1"
                    : "border-[#DDE3DC] dark:border-[#212E28] shadow-2xs hover:border-[#173B35]/60"
                }`}
              >
                {/* Brand Icon Plaque */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                    isHovered
                      ? "bg-[#173B35] text-white"
                      : "bg-[#EAECE8] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64]"
                  }`}
                >
                  <Smartphone className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </div>

                <div className="w-full">
                  <h3
                    className={`font-semibold text-xs truncate transition-colors duration-200 ${
                      isHovered
                        ? "text-[#173B35] dark:text-[#D8AB64] font-bold"
                        : "text-[#17231E] dark:text-[#E8EFEA]"
                    }`}
                  >
                    {brand.name}
                  </h3>
                  <span className="text-[10px] text-[#69736D] dark:text-[#9BA59E] block mt-0.5 uppercase tracking-wider font-medium">
                    Verified
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
