"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Smartphone, ShieldCheck, Truck, RefreshCcw, Headphones } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-[#111916] text-[#E8EFEA] pt-14 pb-10 border-t border-[#212E28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-[#212E28]">
          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-[#18221D]/70 border border-[#2B3B33]/60">
            <ShieldCheck className="w-6 h-6 text-[#B3853E] dark:text-[#D8AB64] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">100% Brand-Sealed</h4>
              <p className="text-xs text-[#9BA59E] mt-1 leading-relaxed">
                Direct manufacturer brand-sealed packs with official 1-Year India warranty and 18% GST input credit invoices.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-[#18221D]/70 border border-[#2B3B33]/60">
            <Truck className="w-6 h-6 text-[#B3853E] dark:text-[#D8AB64] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Insured Freight Transit</h4>
              <p className="text-xs text-[#9BA59E] mt-1 leading-relaxed">
                Safe, insured express courier & transport hub dispatch for retail stores across all Indian states.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-[#18221D]/70 border border-[#2B3B33]/60">
            <RefreshCcw className="w-6 h-6 text-[#B3853E] dark:text-[#D8AB64] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">7-Day DOA Protection</h4>
              <p className="text-xs text-[#9BA59E] mt-1 leading-relaxed">
                Direct replacement policy for handsets dead on arrival with dealer escalation support.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-[#18221D]/70 border border-[#2B3B33]/60">
            <Headphones className="w-6 h-6 text-[#B3853E] dark:text-[#D8AB64] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Dedicated Wholesale Desk</h4>
              <p className="text-xs text-[#9BA59E] mt-1 leading-relaxed">
                Direct order confirmation and order negotiations with authorized distribution owners.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#173B35] text-[#B3853E] flex items-center justify-center font-bold border border-[#285C4D]">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-white font-serif-heading">
                JAGDAMBA <span className="text-[#B3853E] font-semibold">MOBILE</span>
              </span>
            </div>
            <p className="text-xs text-[#9BA59E] leading-relaxed">
              India&apos;s verified wholesale smartphone distribution platform supplying mobile retailers,
              telecom shops, and regional dealer networks with live warehouse stock and volume tier pricing.
            </p>
            <p className="text-[11px] font-mono text-[#69736D]">GSTIN: 07AAAAA0000A1Z5</p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#E8EFEA] mb-3">
              Smartphone Brands
            </h5>
            <ul className="space-y-2 text-xs text-[#9BA59E]">
              <li><Link href="/catalog?brand=apple" className="hover:text-white transition">Apple iPhones</Link></li>
              <li><Link href="/catalog?brand=samsung" className="hover:text-white transition">Samsung Galaxy</Link></li>
              <li><Link href="/catalog?brand=oneplus" className="hover:text-white transition">OnePlus Series</Link></li>
              <li><Link href="/catalog?brand=xiaomi" className="hover:text-white transition">Xiaomi & Redmi</Link></li>
              <li><Link href="/catalog" className="hover:text-white transition">All 5G Models</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#E8EFEA] mb-3">
              Retailer Services
            </h5>
            <ul className="space-y-2 text-xs text-[#9BA59E]">
              <li><Link href="/register" className="hover:text-white transition">Register Retail Store</Link></li>
              <li><Link href="/orders" className="hover:text-white transition">Order Tracking & Chat</Link></li>
              <li><Link href="/cart" className="hover:text-white transition">Wholesale Cart</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Retailer Portal Sign In</Link></li>
              <li><Link href="/admin/login" className="hover:text-white transition">Admin Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#E8EFEA] mb-3">
              Distribution Center
            </h5>
            <p className="text-xs text-[#9BA59E] leading-relaxed">
              Jagdamba Mobile Distribution Center<br />
              Commercial Electronics Hub, Central Plaza<br />
              New Delhi, Delhi - 110001, India<br />
              Wholesale Desk: +91 98765 00000<br />
              Email: orders@jagdambamobile.com
            </p>
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="pt-6 border-t border-[#212E28] flex flex-col sm:flex-row items-center justify-between text-xs text-[#69736D] gap-3 text-center sm:text-left">
          <p>© 2026 Jagdamba Mobile Distribution. All rights reserved.</p>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            <Link href="/catalog" className="hover:text-[#9BA59E] transition">Catalog</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-[#9BA59E] transition">Retailer Login</Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-[#9BA59E] transition">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
