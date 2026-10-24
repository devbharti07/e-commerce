"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Boxes, ArrowRight } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface VariantInfo {
  id: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  baseWholesalePrice: number;
  minOrderQty: number;
  onHandStock: number;
  reservedStock: number;
  lowStockThreshold: number;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  modelNumber: string;
  brand: {
    id: string;
    name: string;
  };
  variants: VariantInfo[];
  images: { url: string }[];
}

interface LandingFeaturedProductsProps {
  products: ProductItem[];
}

export function LandingFeaturedProducts({ products }: LandingFeaturedProductsProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");

  // Extract unique brands present in the actual returned products
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, string>();
    products.forEach((p) => {
      brandMap.set(p.brand.name, p.brand.name);
    });
    return Array.from(brandMap.values());
  }, [products]);

  // Filter products by selected brand tab
  const filteredProducts = useMemo(() => {
    if (selectedBrand === "ALL") return products;
    return products.filter((p) => p.brand.name === selectedBrand);
  }, [products, selectedBrand]);

  return (
    <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ScrollReveal direction="up" durationMs={500}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-[#DDE3DC] dark:border-[#212E28]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              Immediate Warehouse Allocation
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] dark:text-[#E8EFEA] tracking-tight mt-0.5">
              Featured Smartphone Handsets
            </h2>
            <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-0.5">
              Brand-sealed handsets physically on-hand at Central Delhi facility
            </p>
          </div>

          <Link
            href="/catalog"
            className="group self-start sm:self-auto text-xs font-bold text-[#B3853E] dark:text-[#D8AB64] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </ScrollReveal>

      {/* Brand Filter Tabs */}
      {availableBrands.length > 1 && (
        <ScrollReveal direction="up" delayMs={100} durationMs={450}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 scrollbar-none">
            <button
              onClick={() => setSelectedBrand("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedBrand === "ALL"
                  ? "bg-[#173B35] text-white shadow-xs"
                  : "bg-white dark:bg-[#18221D] text-[#69736D] dark:text-[#9BA59E] border border-[#DDE3DC] dark:border-[#212E28] hover:bg-[#EAECE8] dark:hover:bg-[#212E28]"
              }`}
            >
              All Featured ({products.length})
            </button>

            {availableBrands.map((brandName) => {
              const active = selectedBrand === brandName;
              return (
                <button
                  key={brandName}
                  onClick={() => setSelectedBrand(brandName)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-[#173B35] text-white shadow-xs"
                      : "bg-white dark:bg-[#18221D] text-[#69736D] dark:text-[#9BA59E] border border-[#DDE3DC] dark:border-[#212E28] hover:bg-[#EAECE8] dark:hover:bg-[#212E28]"
                  }`}
                >
                  {brandName}
                </button>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#18221D] rounded-2xl p-10 text-center border border-[#DDE3DC] dark:border-[#212E28] text-xs text-[#69736D] shadow-2xs">
          <Boxes className="w-10 h-10 text-[#69736D] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#17231E] dark:text-[#E8EFEA]">
            No Handsets Match Selected Brand Filter
          </p>
          <button
            onClick={() => setSelectedBrand("ALL")}
            className="mt-3 text-xs font-bold text-[#B3853E] hover:underline cursor-pointer"
          >
            Show All Handsets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product, index) => {
            const primaryVariant = product.variants[0];
            const availableUnits = primaryVariant
              ? Math.max(0, primaryVariant.onHandStock - primaryVariant.reservedStock)
              : 0;
            const imageUrl =
              product.images[0]?.url ||
              "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80";

            return (
              <ScrollReveal
                key={product.id}
                direction="up"
                delayMs={(index % 4) * 80}
                durationMs={500}
              >
                <div className="group bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] overflow-hidden flex flex-col hover:border-[#173B35] dark:hover:border-[#B3853E] shadow-2xs hover:shadow-md transition-all duration-300">
                  {/* Smartphone Image Container */}
                  <div className="relative h-52 bg-[#F6F5F0]/70 dark:bg-[#111916]/70 flex items-center justify-center p-4 overflow-hidden border-b border-[#DDE3DC]/60 dark:border-[#212E28]/60">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-4 group-hover:scale-108 transition-transform duration-300 ease-out"
                      priority={index < 2}
                      loading={index < 2 ? "eager" : "lazy"}
                    />

                    {/* Brand Pill */}
                    <div className="absolute top-3 left-3 bg-[#173B35]/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#285C4D]">
                      {product.brand.name}
                    </div>

                    {/* Stock Status Pill */}
                    {availableUnits <= 0 ? (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        SOLD OUT
                      </div>
                    ) : availableUnits <= (primaryVariant?.lowStockThreshold || 5) ? (
                      <div className="absolute top-3 right-3 bg-[#B3853E] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        LOW STOCK
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        IN STOCK
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div>
                      <h3 className="font-bold text-sm text-[#17231E] dark:text-[#E8EFEA] line-clamp-1 group-hover:text-[#173B35] dark:group-hover:text-[#D8AB64] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] mt-0.5">
                        Model: {product.modelNumber}
                      </p>

                      {/* Variant Configuration Pills */}
                      {primaryVariant && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-semibold bg-[#EAECE8] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64] px-2 py-0.5 rounded-md">
                            {primaryVariant.ramGb}GB RAM
                          </span>
                          <span className="text-[10px] font-semibold bg-[#EAECE8] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64] px-2 py-0.5 rounded-md">
                            {primaryVariant.storageGb}GB
                          </span>
                          <span className="text-[10px] font-semibold bg-[#EAECE8] dark:bg-[#212E28] text-[#69736D] dark:text-[#9BA59E] px-2 py-0.5 rounded-md">
                            {primaryVariant.colorName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#DDE3DC] dark:border-[#212E28]">
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
                          <div className="text-right">
                            <span className="text-[10px] font-medium text-[#69736D] dark:text-[#9BA59E] block">
                              Min: {primaryVariant.minOrderQty} pcs
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block tabular-nums font-mono">
                              {availableUnits} ready
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-3.5 w-full block text-center py-2.5 bg-[#173B35] hover:bg-[#285C4D] text-white font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer shadow-2xs active:scale-[0.98]"
                      >
                        Inspect Specifications & Tiers
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
