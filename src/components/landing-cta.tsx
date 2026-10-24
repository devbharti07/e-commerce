"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Store,
  ShieldCheck,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface LandingCtaProps {
  contactPhone: string;
}

export function LandingCta({ contactPhone }: LandingCtaProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* High-Impact Invitation Box */}
      <ScrollReveal direction="up" durationMs={500}>
        <div className="bg-gradient-to-br from-[#173B35] via-[#122A25] to-[#0D1815] text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#285C4D] shadow-2xl relative overflow-hidden text-center space-y-6">
          {/* Subtle Ambient Radial Backlight */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[#B3853E]/15 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18221D]/90 text-[#D8AB64] text-xs font-semibold border border-[#2B3B33] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#B3853E]" />
              <span>Direct B2B Distribution • Central Delhi Terminal</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              Ready to Expand Your Store&apos;s Smartphone Inventory?
            </h2>

            <p className="text-xs sm:text-sm text-[#D5DDD7] leading-relaxed max-w-lg mx-auto">
              Join retail mobile businesses sourcing brand-sealed handsets with transparent tier rates, live warehouse allocation, and verified 18% GST invoices.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-7 py-3.5 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Register Retailer Account</span>
              </Link>

              <Link
                href="/catalog"
                className="w-full sm:w-auto px-7 py-3.5 bg-[#18221D] hover:bg-[#212E28] text-[#E8EFEA] hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-[#2B3B33] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <span>Browse Handset Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Verified Operations Information Cards */}
      <ScrollReveal direction="up" delayMs={150} durationMs={500}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              Warehouse Terminal
            </span>
            <p className="font-bold text-[#17231E] dark:text-white text-sm">
              Central Delhi Distribution Hub
            </p>
            <p className="text-[#69736D] dark:text-[#9BA59E] leading-relaxed">
              Serving registered mobile shops and regional electronics dealers across North India with insured courier transit.
            </p>
          </div>

          <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              Direct Wholesale Desk
            </span>
            <p className="font-bold text-[#17231E] dark:text-white text-sm font-mono">
              {contactPhone}
            </p>
            <p className="text-[#69736D] dark:text-[#9BA59E] leading-relaxed">
              Available Monday to Saturday, 10:00 AM to 8:00 PM for dealer bookings, dispatch updates, and carton inquiries.
            </p>
          </div>

          <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              GST & Legal Authority
            </span>
            <p className="font-bold text-[#17231E] dark:text-white text-sm">
              100% Tax Compliant Supply
            </p>
            <p className="text-[#69736D] dark:text-[#9BA59E] leading-relaxed">
              Legitimate 18% GST invoices generated for every order. Genuine brand-sealed Indian stock with registered IMEI records.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
