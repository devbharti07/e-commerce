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
  Bell,
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

  // Calculate dynamic unit price based on active quantity and volume tiers
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/catalog" className="hover:text-slate-900 dark:hover:text-white transition">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link
          href={`/catalog?brand=${product.brand.slug}`}
          className="hover:text-slate-900 dark:hover:text-white font-medium transition"
        >
          {product.brand.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 h-80 sm:h-96 lg:h-[420px] flex items-center justify-center p-6 shadow-2xs overflow-hidden">
            <img
              src={
                product.images[activeImageIndex]?.url ||
                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"
              }
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-3.5 left-3.5 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded">
              {product.brand.name} Sealed
            </div>
            {availableUnits <= 0 && (
              <div className="absolute top-3.5 right-3.5 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded">
                SOLD OUT
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg bg-white dark:bg-slate-900 border p-1 shrink-0 transition ${
                    activeImageIndex === idx
                      ? "border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-400"
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
          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {product.warrantyMonths} Mo Warranty
              </p>
              <p className="text-[10px] text-slate-400">Official Brand Care</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
              <RotateCcw className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {product.returnDays} Days DOA
              </p>
              <p className="text-[10px] text-slate-400">Dealer Replacement</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Truck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Insured Transit
              </p>
              <p className="text-[10px] text-slate-400">Safe Shop Delivery</p>
            </div>
          </div>
        </div>

        {/* Right: Product Details, Variant Selection, Pricing Tiers */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {product.brand.name} • Model: {product.modelNumber}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 1. VARIANT SELECTOR */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Choose Configuration & Color
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariant.id;
                const vStock = v.onHandStock - v.reservedStock;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantSelect(v.id)}
                    className={`text-left p-3 rounded-lg border transition flex flex-col justify-between ${
                      isSelected
                        ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {v.ramGb}GB / {v.storageGb}GB
                        </span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: v.colorHex }}
                          title={v.colorName}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{v.colorName}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(v.baseWholesalePrice)}
                      </span>
                      {vStock <= 0 ? (
                        <span className="text-rose-600 font-semibold text-[10px]">
                          Sold Out
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] tabular-nums">
                          {vStock} ready
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Active SKU:
              </span>
              <code className="text-slate-600 dark:text-slate-400">{selectedVariant.sku}</code>
            </div>
          </div>

          {/* 2. VOLUME PRICING TIERS */}
          {selectedVariant.pricingTiers && selectedVariant.pricingTiers.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  Volume Tier Wholesale Pricing
                </h3>
                <span className="text-[11px] text-slate-400">Live Tier Auto-Calculation</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                {selectedVariant.pricingTiers.map((tier) => {
                  const isActive =
                    quantity >= tier.minQty &&
                    (tier.maxQty === null || quantity <= tier.maxQty);
                  return (
                    <div
                      key={tier.id}
                      className={`p-2.5 rounded-lg border text-xs transition ${
                        isActive
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                      }`}
                    >
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        {tier.minQty}
                        {tier.maxQty ? ` - ${tier.maxQty}` : "+"} pcs
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                        {formatCurrency(tier.unitPrice)}
                      </p>
                      {isActive && (
                        <span className="inline-block mt-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
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
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl space-y-4 border border-slate-800 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Wholesale Unit Price
                </p>
                <p className="text-xl font-bold text-amber-400 tabular-nums">
                  {formatCurrency(currentUnitPrice)}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ unit</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Line Subtotal
                </p>
                <p className="text-lg font-bold text-white tabular-nums">
                  {formatCurrency(lineTotal)}
                </p>
              </div>
            </div>

            {availableUnits > 0 ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold block text-slate-200">
                      Order Quantity (Min: {selectedVariant.minOrderQty} pcs)
                    </label>
                    <span className="text-[11px] text-emerald-400 tabular-nums">
                      {availableUnits} units available in live warehouse stock
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.max(selectedVariant.minOrderQty, q - 1)
                        )
                      }
                      disabled={quantity <= selectedVariant.minOrderQty}
                      className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-xs disabled:opacity-30 transition"
                      aria-label="Decrease quantity"
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
                      className="w-12 text-center bg-transparent text-white font-bold text-xs focus:outline-none tabular-nums"
                      aria-label="Order quantity"
                    />
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(availableUnits, q + 1))
                      }
                      disabled={quantity >= availableUnits}
                      className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-xs disabled:opacity-30 transition"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {feedbackMessage && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      feedbackMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {feedbackMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={handleAddToBasket}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Wholesale Cart</span>
                  </button>
                  <Link
                    href="/cart"
                    onClick={handleAddToBasket}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    Review Order Request
                  </Link>
                </div>
              </div>
            ) : (
              /* SOLD OUT / NOTIFY ME SECTION */
              <div className="space-y-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                  This variant is currently SOLD OUT. Subscribe below for an automatic notification when new brand-sealed units arrive.
                </div>

                {!notifySubmitted ? (
                  <form onSubmit={handleRestockSubmit} className="space-y-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter dealer email for restock alert"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me When Back in Stock</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Restock alert active. You will receive an email as soon as fresh units arrive.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TECHNICAL SPECIFICATIONS TABLE */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Technical Specifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified hardware specifications for dealer inspection and retail customer advisory
          </p>
        </div>

        <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
          {Object.entries(specsByGroup).map(([group, specs]) => (
            <div key={group} className="pt-4 first:pt-0">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2.5">
                {group}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-baseline justify-between py-1 border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      {spec.key}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-right ml-4">
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
