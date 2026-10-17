import React from "react";
import Link from "next/link";
import { Smartphone, ShieldCheck, Truck, RefreshCcw, Headphones } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#14213D] text-white pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-gray-700/60">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-8 h-8 text-[#FCA311] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">100% Genuine Sealed</h4>
              <p className="text-xs text-gray-300 mt-1">
                Official brand inventory with manufacturer warranty cards and GST invoice.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Truck className="w-8 h-8 text-[#FCA311] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Express Transit Support</h4>
              <p className="text-xs text-gray-300 mt-1">
                Secured insured dispatch for retail shops and bulk electronics dealers.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <RefreshCcw className="w-8 h-8 text-[#FCA311] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Dealer Replacement</h4>
              <p className="text-xs text-gray-300 mt-1">
                7-day DOA (Dead on Arrival) replacement support on all wholesale batches.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Headphones className="w-8 h-8 text-[#FCA311] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Dedicated B2B Desk</h4>
              <p className="text-xs text-gray-300 mt-1">
                Direct phone & live order chat with Jagdamba distribution managers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FCA311] flex items-center justify-center text-[#14213D] font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-tight">
                JAGDAMBA <span className="text-[#FCA311]">MOBILE</span>
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              India's trusted wholesale smartphone distributor supplying mobile retailers,
              resellers, and regional dealer networks with live inventory and volume tier pricing.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#FCA311] mb-3">
              Popular Brands
            </h5>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li><Link href="/catalog?brand=apple" className="hover:text-white">Apple iPhones</Link></li>
              <li><Link href="/catalog?brand=samsung" className="hover:text-white">Samsung Galaxy</Link></li>
              <li><Link href="/catalog?brand=oneplus" className="hover:text-white">OnePlus Series</Link></li>
              <li><Link href="/catalog?brand=xiaomi" className="hover:text-white">Xiaomi & Redmi</Link></li>
              <li><Link href="/catalog" className="hover:text-white">All 5G Smartphones</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#FCA311] mb-3">
              Dealer Services
            </h5>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li><Link href="/register" className="hover:text-white">Retailer Registration</Link></li>
              <li><Link href="/orders" className="hover:text-white">Order Status & Chat</Link></li>
              <li><Link href="/cart" className="hover:text-white">Bulk Order Basket</Link></li>
              <li><Link href="/login" className="hover:text-white">Dealer Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#FCA311] mb-3">
              Business Headquarters
            </h5>
            <p className="text-xs text-gray-300 leading-relaxed">
              Jagdamba Mobile Distribution Center<br />
              Commercial Electronics Hub, Central Plaza<br />
              New Delhi, Delhi - 110001, India<br />
              Phone: +91 98765 43210<br />
              Email: orders@jagdambamobile.com
            </p>
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="pt-6 border-t border-gray-800 text-center text-xs text-gray-400">
          <p>© 2026 Jagdamba Mobile. Wholesale smartphone distribution platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
