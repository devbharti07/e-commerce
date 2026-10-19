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
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-slate-800">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">100% Brand Sealed</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct manufacturer brand-sealed packs with official warranty and GST input credit invoice.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Truck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Insured Freight Transit</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Safe, insured express courier & transport hub dispatch for retail stores across India.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <RefreshCcw className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">7-Day DOA Protection</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct replacement policy for handsets dead on arrival with dealer escalation support.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Headphones className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Dedicated Wholesale Desk</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct order confirmation and order negotiations with authorized distribution owners.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                JAGDAMBA <span className="text-amber-400 font-semibold">MOBILE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s verified wholesale smartphone distribution platform supplying mobile retailers,
              telecom shops, and regional dealer networks with live warehouse stock and volume tier pricing.
            </p>
            <p className="text-[11px] text-slate-500">GSTIN: 07AAAAA0000A1Z5</p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Smartphone Brands
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/catalog?brand=apple" className="hover:text-white transition">Apple iPhones</Link></li>
              <li><Link href="/catalog?brand=samsung" className="hover:text-white transition">Samsung Galaxy</Link></li>
              <li><Link href="/catalog?brand=oneplus" className="hover:text-white transition">OnePlus Series</Link></li>
              <li><Link href="/catalog?brand=xiaomi" className="hover:text-white transition">Xiaomi & Redmi</Link></li>
              <li><Link href="/catalog" className="hover:text-white transition">All 5G Models</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Retailer Services
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/register" className="hover:text-white transition">Register Retail Store</Link></li>
              <li><Link href="/orders" className="hover:text-white transition">Order Tracking & Chat</Link></li>
              <li><Link href="/cart" className="hover:text-white transition">Wholesale Cart</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Retailer Portal Sign In</Link></li>
              <li><Link href="/admin/login" className="hover:text-white transition">Admin Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Distribution Center
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jagdamba Mobile Distribution Center<br />
              Commercial Electronics Hub, Central Plaza<br />
              New Delhi, Delhi - 110001, India<br />
              Wholesale Desk: +91 98765 43210<br />
              Email: orders@jagdambamobile.com
            </p>
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 Jagdamba Mobile Distribution. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/catalog" className="hover:text-slate-400 transition">Catalog</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-400 transition">Retailer Login</Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-slate-400 transition">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
