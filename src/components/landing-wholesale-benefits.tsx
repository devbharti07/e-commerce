"use client";

import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Boxes,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function LandingWholesaleBenefits() {
  const benefits = [
    {
      icon: Boxes,
      title: "Atomic Stock Reservation",
      badge: "Zero Overselling",
      description:
        "Real-time PostgreSQL concurrency-safe stock locking. When an order request is confirmed, physical warehouse units are reserved immediately.",
    },
    {
      icon: Sparkles,
      title: "Automated Volume Tiers",
      badge: "Carton Discounts",
      description:
        "Dynamic volume tier matrices automatically calculate scaled price cuts per unit based on order batch size (Tier A, B, and C).",
    },
    {
      icon: FileText,
      title: "18% GST Input Credit",
      badge: "Tax Compliant",
      description:
        "Legitimate tax invoices generated with your registered business GSTIN. Inspect input tax credit figures directly on invoices.",
    },
    {
      icon: MessageSquare,
      title: "Direct Dealer Chat Desk",
      badge: "Interactive Orders",
      description:
        "Propose price revisions, review adjusted terms, and coordinate dispatch dates directly with administration via dedicated order threads.",
    },
    {
      icon: ShieldCheck,
      title: "100% Brand-Sealed Stock",
      badge: "Authentic Goods",
      description:
        "Factory-sealed packaging with registered IMEI barcodes and 1-Year official manufacturer warranty coverage throughout India.",
    },
    {
      icon: RotateCcw,
      title: "7-Day DOA Handset Protection",
      badge: "Immediate Replacement",
      description:
        "Defective-on-arrival handset replacement guarantee within 7 days of verified warehouse dispatch to safeguard retail margins.",
    },
  ];

  return (
    <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <ScrollReveal direction="up" durationMs={500}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
            Verified Trade Capabilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#17231E] dark:text-[#E8EFEA] tracking-tight mt-1.5">
            Engineered for Mobile Retailers & Regional Distributors
          </h2>
          <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-2 leading-relaxed">
            Eliminating supply chain uncertainties with verified stock allocation, legitimate documentation, and clear wholesale terms.
          </p>
        </div>
      </ScrollReveal>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {benefits.map((item, index) => {
          const Icon = item.icon;

          return (
            <ScrollReveal
              key={item.title}
              direction="up"
              delayMs={index * 60}
              durationMs={500}
            >
              <div className="group relative bg-white dark:bg-[#18221D] p-6 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] hover:border-[#173B35] dark:hover:border-[#B3853E] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#EAECE8] dark:bg-[#212E28] group-hover:bg-[#173B35] group-hover:text-white dark:group-hover:bg-[#173B35] text-[#173B35] dark:text-[#D8AB64] flex items-center justify-center transition-colors duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64] bg-[#F8F3EA] dark:bg-[#2A2214] px-2.5 py-1 rounded-full border border-[#B3853E]/20">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#17231E] dark:text-[#E8EFEA] mt-4 group-hover:text-[#173B35] dark:group-hover:text-[#D8AB64] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#69736D] dark:text-[#9BA59E] leading-relaxed mt-1.5">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DDE3DC]/60 dark:border-[#212E28]/60 flex items-center gap-1.5 text-[11px] font-semibold text-[#173B35] dark:text-[#D8AB64]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#173B35] dark:text-[#D8AB64]" />
                  <span>Integrated in Wholesale Platform</span>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
