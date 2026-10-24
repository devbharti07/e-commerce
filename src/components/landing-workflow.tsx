"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  UserCheck,
  PackageCheck,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function LandingWorkflow() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      number: "01",
      title: "Store Application",
      subtitle: "GSTIN & Business Details",
      icon: Building2,
      summary:
        "Submit retail store details including verified trade name, location address, and official GST registration number.",
      detail:
        "Ensures legitimate wholesale transactions and prepares your account for input tax credit documentation.",
    },
    {
      number: "02",
      title: "Trade Credential Review",
      subtitle: "Commercial Onboarding",
      icon: ShieldCheck,
      summary:
        "Submit your contact phone and retail establishment profile for commercial wholesale verification.",
      detail:
        "Establishes authorized retail account ownership and prepares your account for fast priority dispatch.",
    },
    {
      number: "03",
      title: "HQ Verification Queue",
      subtitle: "Administrative Approval",
      icon: UserCheck,
      summary:
        "Jagdamba Mobile distribution operations review retailer credentials to confirm wholesale trade status.",
      detail:
        "Guarantees that proprietary bulk pricing and live warehouse quantities remain exclusive to authentic dealers.",
    },
    {
      number: "04",
      title: "Wholesale Portal Access",
      subtitle: "Volume Tiers & Fast Ordering",
      icon: PackageCheck,
      summary:
        "Log in to inspect live warehouse stock, unlock volume carton discounts, submit purchase requests, and track dispatches.",
      detail:
        "Direct trade access with atomic stock reservation, automated GST invoices, and dedicated order discussion chat.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#EAECE8]/60 dark:bg-[#18221D]/60 py-16 sm:py-24 border-y border-[#DDE3DC] dark:border-[#212E28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up" durationMs={500}>
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
              Structured Retailer Onboarding
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#17231E] dark:text-[#E8EFEA] tracking-tight mt-1.5">
              How Retailer Registration Works
            </h2>
            <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-2 leading-relaxed">
              A transparent 4-step pathway designed to verify legitimate electronics dealers while keeping trade pricing secure.
            </p>
          </div>
        </ScrollReveal>

        {/* 4-Step Interactive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isSelected = activeStep === index + 1;

            return (
              <ScrollReveal
                key={step.number}
                direction="up"
                delayMs={index * 80}
                durationMs={500}
              >
                <div
                  onClick={() => setActiveStep(index + 1)}
                  className={`group relative bg-white dark:bg-[#18221D] p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer h-full ${
                    isSelected
                      ? "border-[#173B35] dark:border-[#B3853E] shadow-md ring-1 ring-[#173B35]/20 dark:ring-[#B3853E]/20 -translate-y-1"
                      : "border-[#DDE3DC] dark:border-[#212E28] shadow-2xs hover:border-[#173B35]/50"
                  }`}
                >
                  <div>
                    {/* Step Number & Icon */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                          isSelected
                            ? "bg-[#173B35] text-[#D8AB64]"
                            : "bg-[#EAECE8] dark:bg-[#212E28] text-[#173B35] dark:text-[#D8AB64] group-hover:bg-[#173B35] group-hover:text-[#D8AB64]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-2xl font-serif font-extrabold text-[#DDE3DC] dark:text-[#26362E] group-hover:text-[#B3853E] transition-colors tabular-nums font-mono">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#17231E] dark:text-[#E8EFEA] mt-5">
                      {step.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#B3853E] dark:text-[#D8AB64] mt-0.5">
                      {step.subtitle}
                    </p>

                    <p className="text-xs text-[#69736D] dark:text-[#9BA59E] leading-relaxed mt-2.5">
                      {step.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#DDE3DC]/60 dark:border-[#212E28]/60 text-[11px] text-[#3D4E45] dark:text-[#A3B5AA] leading-normal">
                    {step.detail}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA Bar */}
        <ScrollReveal direction="up" delayMs={350} durationMs={500}>
          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#173B35] hover:bg-[#285C4D] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <span>Begin Dealer Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
