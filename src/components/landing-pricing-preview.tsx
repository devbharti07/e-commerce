"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Calculator, CheckCircle2, TrendingUp } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function LandingPricingPreview() {
  const [selectedQty, setSelectedQty] = useState<number>(10);

  // Example representative flagship wholesale model (Galaxy S24 Ultra / iPhone 16 Pro Max)
  const basePricePaise = 11499900; // Rs 1,14,999 in paise

  // Realistic tier calculation mirroring database pricing tier rules
  const getTierData = (qty: number) => {
    if (qty >= 10) {
      return {
        tierName: "Tier C (Carton Wholesale)",
        discountPercent: 4.5,
        unitPricePaise: Math.round(basePricePaise * 0.955),
        savingsPerUnitPaise: Math.round(basePricePaise * 0.045),
      };
    }
    if (qty >= 5) {
      return {
        tierName: "Tier B (Volume Lot)",
        discountPercent: 2.5,
        unitPricePaise: Math.round(basePricePaise * 0.975),
        savingsPerUnitPaise: Math.round(basePricePaise * 0.025),
      };
    }
    return {
      tierName: "Tier A (Base Wholesale MOQ)",
      discountPercent: 0,
      unitPricePaise: basePricePaise,
      savingsPerUnitPaise: 0,
    };
  };

  const tier = getTierData(selectedQty);
  const totalAmountPaise = tier.unitPricePaise * selectedQty;
  const totalSavingsPaise = tier.savingsPerUnitPaise * selectedQty;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ScrollReveal direction="up" durationMs={500}>
        <div className="bg-[#0F1A17] text-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#212E28] relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-[#B3853E]/12 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Narrative (6 cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18221D] text-[#D8AB64] text-xs font-semibold border border-[#2B3B33]">
                <Calculator className="w-3.5 h-3.5 text-[#B3853E]" />
                <span>Transparent Wholesale Economics</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                Scale Your Profit Margins with Automated Volume Tiers
              </h2>

              <p className="text-xs sm:text-sm text-[#D5DDD7] leading-relaxed">
                Wholesale pricing at Jagdamba Mobile is deterministic. The higher your carton commitment, the lower your per-unit acquisition cost. Every order request automatically recalculates line totals from our database tier formulas.
              </p>

              <div className="space-y-3 pt-2 text-xs text-[#D5DDD7]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D8AB64] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Tier A (2–4 Units):</strong> Minimum order wholesale access for fast retail restocking.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D8AB64] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Tier B (5–9 Units):</strong> Standard store batch discounting with ~2.5% unit price reduction.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D8AB64] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Tier C (10+ Units):</strong> Full carton distribution rate delivering maximum margin spread.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator (6 cols) */}
            <div className="lg:col-span-6 bg-[#18221D]/90 p-6 sm:p-8 rounded-2xl border border-[#2B3B33] backdrop-blur-md shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#212E28]">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D8AB64]" />
                    <span>Live Wholesale Tier Simulator</span>
                  </h3>
                  <p className="text-[11px] text-[#9BA59E] mt-0.5">
                    Flagship 5G Handset (256GB Indian Stock)
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#173B35] text-[#D8AB64] border border-[#285C4D]">
                  {tier.tierName}
                </span>
              </div>

              {/* Quantity Selector Pills */}
              <div>
                <label className="block text-xs font-semibold text-[#D5DDD7] mb-2.5">
                  Select Order Lot Size:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 5, 10, 20].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setSelectedQty(qty)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedQty === qty
                          ? "bg-[#B3853E] text-white shadow-xs"
                          : "bg-[#0F1A17] text-[#9BA59E] hover:text-white border border-[#212E28]"
                      }`}
                    >
                      {qty} Units
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Matrix */}
              <div className="space-y-2.5 bg-[#0F1A17] p-4 rounded-xl border border-[#212E28] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#9BA59E]">Standard Unit Price</span>
                  <span className="text-white font-mono tabular-nums">
                    {formatCurrency(basePricePaise)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9BA59E]">Applied Tier Discount</span>
                  <span className="font-bold text-[#D8AB64] font-mono tabular-nums">
                    {tier.discountPercent > 0 ? `-${tier.discountPercent}% OFF` : "Base Rate"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9BA59E]">Effective Unit Price</span>
                  <span className="font-bold text-white font-mono tabular-nums text-sm">
                    {formatCurrency(tier.unitPricePaise)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#212E28] flex items-center justify-between">
                  <span className="font-semibold text-white">Estimated Order Total</span>
                  <span className="font-extrabold text-base sm:text-lg text-[#D8AB64] font-mono tabular-nums">
                    {formatCurrency(totalAmountPaise)}
                  </span>
                </div>
              </div>

              {totalSavingsPaise > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
                  <span>Cumulative Carton Margin Savings:</span>
                  <span className="font-bold font-mono tabular-nums">
                    +{formatCurrency(totalSavingsPaise)}
                  </span>
                </div>
              )}

              <Link
                href="/register"
                className="w-full block text-center py-3 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-[0.98]"
              >
                Register Retail Store for Live Wholesale Quotes &rarr;
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
