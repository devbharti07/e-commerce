"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bell,
  MessageSquare,
  ShoppingCart,
  ChevronRight,
  Info,
} from "lucide-react";

interface Variant {
  id: string;
  sku: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  colorHex: string;
  region: string;
  condition: string;
  baseWholesalePrice: number;
  minOrderQty: number;
  maxOrderQty: number | null;
  lowStockThreshold: number;
  onHandStock: number;
  reservedStock: number;
  isAvailable: boolean;
  pricingTiers: { id: string; minQty: number; maxQty: number | null; unitPrice: number }[];
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    model: string;
    modelNumber: string;
    description: string;
    condition: string;
    warrantyMonths: number;
    returnDays: number;
    brand: { name: string; slug: string };
    variants: Variant[];
    specifications: { id: string; group: string; key: string; value: string }[];
    images: { id: string; url: string; variantId: string | null }[];
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ""
  );

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  const availableUnits = selectedVariant
    ? Math.max(0, selectedVariant.onHandStock - selectedVariant.reservedStock)
    : 0;

  const [quantity, setQuantity] = useState<number>(
    selectedVariant?.minOrderQty || 2
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Notify Me state
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  // Calculate dynamic unit price based on active quantity and tiers
  const calculateUnitPrice = (qty: number): number => {
    if (!selectedVariant) return 0;
    if (!selectedVariant.pricingTiers || selectedVariant.pricingTiers.length === 0) {
      return selectedVariant.baseWholesalePrice;
    }
    const sortedTiers = [...selectedVariant.pricingTiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.unitPrice;
      }
    }
    return selectedVariant.baseWholesalePrice;
  };

  const currentUnitPrice = calculateUnitPrice(quantity);
  const lineTotal = currentUnitPrice * quantity;

  // Handle Variant Change
  const handleVariantSelect = (vId: string) => {
    setSelectedVariantId(vId);
    const v = product.variants.find((x) => x.id === vId);
    if (v) {
      setQuantity(v.minOrderQty);
      setFeedbackMessage(null);
    }
  };

  // Add to Cart
  const handleAddToBasket = () => {
    if (!selectedVariant) return;

    if (quantity < selectedVariant.minOrderQty) {
      setFeedbackMessage({
        type: "error",
        text: `Minimum wholesale order quantity is ${selectedVariant.minOrderQty} units.`,
      });
      return;
    }

    if (quantity > availableUnits) {
      setFeedbackMessage({
        type: "error",
        text: `Requested quantity exceeds available live stock (${availableUnits} units).`,
      });
      return;
    }

    const res = addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        variantName: `${selectedVariant.ramGb}GB RAM / ${selectedVariant.storageGb}GB - ${selectedVariant.colorName}`,
        sku: selectedVariant.sku,
        ramGb: selectedVariant.ramGb,
        storageGb: selectedVariant.storageGb,
        colorName: selectedVariant.colorName,
        minOrderQty: selectedVariant.minOrderQty,
        maxOrderQty: selectedVariant.maxOrderQty,
        baseWholesalePrice: selectedVariant.baseWholesalePrice,
        tiers: selectedVariant.pricingTiers,
        availableStock: availableUnits,
        imageUrl: product.images[0]?.url,
      },
      quantity
    );

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: `Added ${quantity} units of ${product.name} to bulk basket.`,
      });
    } else {
      setFeedbackMessage({
        type: "error",
        text: res.message || "Failed to add to basket",
      });
    }
  };

  // Restock Subscription
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    try {
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          email: notifyEmail,
        }),
      });
      setNotifySubmitted(true);
    } catch {
      setNotifySubmitted(true);
    }
  };

  // Group specs
  const specsByGroup = product.specifications.reduce((acc, spec) => {
    if (!acc[spec.group]) acc[spec.group] = [];
    acc[spec.group].push(spec);
    return acc;
  }, {} as Record<string, typeof product.specifications>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-white">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/catalog" className="hover:text-gray-900 dark:hover:text-white">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/catalog?brand=${product.brand.slug}`}
          className="hover:text-gray-900 dark:hover:text-white font-medium"
        >
          {product.brand.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-white font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-96 sm:h-[450px] flex items-center justify-center p-6 shadow-sm overflow-hidden">
            <img
              src={
                product.images[activeImageIndex]?.url ||
                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"
              }
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-[#14213D] text-white text-xs font-bold px-3 py-1 rounded-full">
              {product.brand.name} Sealed
            </div>
            {availableUnits <= 0 && (
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                SOLD OUT
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl bg-white dark:bg-gray-800 border p-1 shrink-0 ${
                    activeImageIndex === idx
                      ? "border-[#FCA311] ring-2 ring-[#FCA311]/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={img.url}
                    alt="thumbnail"
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <ShieldCheck className="w-5 h-5 text-[#FCA311] mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                {product.warrantyMonths} Months Warranty
              </p>
              <p className="text-[10px] text-gray-500">Official Brand Care</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <RotateCcw className="w-5 h-5 text-[#FCA311] mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                {product.returnDays} Days DOA
              </p>
              <p className="text-[10px] text-gray-500">Dealer Replacement</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Truck className="w-5 h-5 text-[#FCA311] mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                Insured Transit
              </p>
              <p className="text-[10px] text-gray-500">Safe Shop Delivery</p>
            </div>
          </div>
        </div>

        {/* Right: Product Details, Variant Selection, Pricing Tiers */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCA311]">
              {product.brand.name} • Model: {product.modelNumber}
            </span>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 1. VARIANT SELECTOR */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Choose Configuration & Color
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariant.id;
                const vStock = v.onHandStock - v.reservedStock;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantSelect(v.id)}
                    className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      isSelected
                        ? "border-[#FCA311] bg-[#FCA311]/5 dark:bg-[#FCA311]/10 ring-1 ring-[#FCA311]"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {v.ramGb}GB / {v.storageGb}GB
                        </span>
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: v.colorHex }}
                          title={v.colorName}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{v.colorName}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#14213D] dark:text-[#FCA311]">
                        {formatCurrency(v.baseWholesalePrice)}
                      </span>
                      {vStock <= 0 ? (
                        <span className="text-red-500 font-semibold text-[11px]">
                          Sold Out
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">
                          {vStock} in stock
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Active SKU:
              </span>
              <code>{selectedVariant.sku}</code>
            </div>
          </div>

          {/* 2. VOLUME PRICING TIERS */}
          {selectedVariant.pricingTiers && selectedVariant.pricingTiers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#FCA311]" />
                  Volume Tier Wholesale Pricing
                </h3>
                <span className="text-xs text-gray-500">Live Tier Calculation</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {selectedVariant.pricingTiers.map((tier, idx) => {
                  const isActive =
                    quantity >= tier.minQty &&
                    (tier.maxQty === null || quantity <= tier.maxQty);
                  return (
                    <div
                      key={tier.id}
                      className={`p-3 rounded-xl border text-xs transition ${
                        isActive
                          ? "border-[#FCA311] bg-[#FCA311]/10 font-bold"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                      }`}
                    >
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {tier.minQty}
                        {tier.maxQty ? ` - ${tier.maxQty}` : "+"} units
                      </p>
                      <p className="text-sm font-black text-[#14213D] dark:text-[#FCA311] mt-1">
                        {formatCurrency(tier.unitPrice)}
                      </p>
                      {isActive && (
                        <span className="inline-block mt-1 text-[10px] text-emerald-600 font-bold">
                          Applied
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ORDER / INVENTORY ACTION BOX */}
          <div className="bg-[#14213D] text-white p-6 rounded-2xl space-y-5">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase font-bold text-gray-300">
                  Applied Wholesale Unit Price
                </p>
                <p className="text-2xl font-black text-[#FCA311]">
                  {formatCurrency(currentUnitPrice)}
                  <span className="text-xs font-normal text-gray-300 ml-1">/ unit</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-300">Line Subtotal</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(lineTotal)}
                </p>
              </div>
            </div>

            {availableUnits > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold block text-gray-200">
                      Order Quantity (Min: {selectedVariant.minOrderQty} pcs)
                    </label>
                    <span className="text-[11px] text-emerald-400">
                      {availableUnits} units available in live warehouse stock
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl">
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.max(selectedVariant.minOrderQty, q - 1)
                        )
                      }
                      disabled={quantity <= selectedVariant.minOrderQty}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold disabled:opacity-30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={selectedVariant.minOrderQty}
                      max={availableUnits}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || selectedVariant.minOrderQty;
                        setQuantity(val);
                      }}
                      className="w-14 text-center bg-transparent text-white font-bold text-sm focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(availableUnits, q + 1))
                      }
                      disabled={quantity >= availableUnits}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                {feedbackMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      feedbackMessage.type === "success"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {feedbackMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAddToBasket}
                    className="w-full py-3.5 bg-[#FCA311] text-[#14213D] font-bold text-sm rounded-xl hover:bg-[#e5940f] transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Bulk Basket
                  </button>
                  <Link
                    href={`/cart`}
                    onClick={handleAddToBasket}
                    className="w-full py-3.5 bg-white text-[#14213D] font-bold text-sm rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2"
                  >
                    Review Order Request
                  </Link>
                </div>
              </div>
            ) : (
              /* SOLD OUT / NOTIFY ME SECTION */
              <div className="space-y-4">
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-200">
                  This variant is currently SOLD OUT in our warehouse. Enter your email to be automatically notified when new brand-sealed units arrive.
                </div>

                {!notifySubmitted ? (
                  <form onSubmit={handleRestockSubmit} className="space-y-3">
                    <input
                      type="email"
                      required
                      placeholder="Enter dealer email for restock alert"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 text-xs rounded-xl px-4 py-2.5 border border-white/20 focus:outline-none focus:border-[#FCA311]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#FCA311] text-[#14213D] font-bold text-xs rounded-xl hover:bg-[#e5940f] transition flex items-center justify-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Notify Me When Back in Stock
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Restock subscription confirmed. You will receive an alert once fresh stock is entered.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TECHNICAL SPECIFICATIONS TABLE (Cashify / GSM style detailed specs) */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Full Technical Specifications
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Verified hardware specifications for retail inspection and consumer advisory
          </p>
        </div>

        <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-700">
          {Object.entries(specsByGroup).map(([group, specs]) => (
            <div key={group} className="pt-4 first:pt-0">
              <h3 className="font-bold text-sm text-[#14213D] dark:text-[#FCA311] mb-3">
                {group}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-baseline justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      {spec.key}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right ml-4">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
