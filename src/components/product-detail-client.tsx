"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Clock,
} from "lucide-react";
import { useStoreAvailability } from "@/hooks/use-store-availability";

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
  const { availability, isOpen } = useStoreAvailability();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] min-h-[85vh] transition-colors">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#69736D] dark:text-[#9BA59E]">
        <Link href="/" className="hover:text-[#173B35] dark:hover:text-white transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#69736D]" />
        <Link href="/catalog" className="hover:text-[#173B35] dark:hover:text-white transition">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#69736D]" />
        <Link
          href={`/catalog?brand=${product.brand.slug}`}
          className="hover:text-[#173B35] dark:hover:text-white font-medium transition"
        >
          {product.brand.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#69736D]" />
        <span className="text-[#17231E] dark:text-[#E8EFEA] font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] h-80 sm:h-96 lg:h-[420px] flex items-center justify-center p-6 shadow-2xs overflow-hidden">
            <Image
              src={
                product.images[activeImageIndex]?.url ||
                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"
              }
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-6"
              priority
            />
            <div className="absolute top-3.5 left-3.5 bg-[#173B35] text-white text-[10px] font-bold px-3 py-1 rounded-full border border-[#285C4D]">
              {product.brand.name} Sealed
            </div>
            {availableUnits <= 0 && (
              <div className="absolute top-3.5 right-3.5 bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
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
                  className={`w-16 h-16 rounded-xl bg-white dark:bg-[#18221D] border p-1 shrink-0 transition relative overflow-hidden ${
                    activeImageIndex === idx
                      ? "border-[#173B35] dark:border-[#B3853E] ring-1 ring-[#173B35] dark:ring-[#B3853E]"
                      : "border-[#DDE3DC] dark:border-[#212E28] hover:border-[#173B35]"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3.5 bg-white dark:bg-[#18221D] rounded-xl border border-[#DDE3DC] dark:border-[#212E28] shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#B3853E] dark:text-[#D8AB64] mx-auto mb-1" />
              <p className="font-bold text-[#17231E] dark:text-[#E8EFEA]">
                {product.warrantyMonths} Mo Warranty
              </p>
              <p className="text-[10px] text-[#69736D] dark:text-[#9BA59E]">Official Brand Care</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-[#18221D] rounded-xl border border-[#DDE3DC] dark:border-[#212E28] shadow-2xs">
              <RotateCcw className="w-5 h-5 text-[#B3853E] dark:text-[#D8AB64] mx-auto mb-1" />
              <p className="font-bold text-[#17231E] dark:text-[#E8EFEA]">
                {product.returnDays} Days DOA
              </p>
              <p className="text-[10px] text-[#69736D] dark:text-[#9BA59E]">Dealer Replacement</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-[#18221D] rounded-xl border border-[#DDE3DC] dark:border-[#212E28] shadow-2xs">
              <Truck className="w-5 h-5 text-[#B3853E] dark:text-[#D8AB64] mx-auto mb-1" />
              <p className="font-bold text-[#17231E] dark:text-[#E8EFEA]">
                Insured Transit
              </p>
              <p className="text-[10px] text-[#69736D] dark:text-[#9BA59E]">Direct Shop Delivery</p>
            </div>
          </div>
        </div>

        {/* Right: Product Details, Variant Selection, Pricing Tiers */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#173B35]/10 dark:bg-[#173B35]/30 text-[#173B35] dark:text-[#D8AB64] text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>{product.brand.name}</span>
              <span>•</span>
              <span>Model: {product.modelNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231E] dark:text-[#E8EFEA] tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-2.5 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 1. VARIANT SELECTOR */}
          <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-4 shadow-2xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA]">
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
                    className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "border-[#173B35] dark:border-[#B3853E] bg-[#EAECE8]/70 dark:bg-[#212E28] ring-1 ring-[#173B35] dark:ring-[#B3853E]"
                        : "border-[#DDE3DC] dark:border-[#212E28] hover:border-[#173B35]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#17231E] dark:text-[#E8EFEA]">
                          {v.ramGb}GB / {v.storageGb}GB
                        </span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: v.colorHex }}
                          title={v.colorName}
                        />
                      </div>
                      <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] mt-0.5">{v.colorName}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#DDE3DC] dark:border-[#212E28] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#17231E] dark:text-[#E8EFEA] tabular-nums font-mono">
                        {formatCurrency(v.baseWholesalePrice)}
                      </span>
                      {vStock <= 0 ? (
                        <span className="text-rose-600 font-semibold text-[10px]">
                          Sold Out
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] tabular-nums font-mono">
                          {vStock} ready
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-[#69736D] dark:text-[#9BA59E] flex items-center gap-1.5 pt-1">
              <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA]">
                Active SKU:
              </span>
              <code className="text-[#173B35] dark:text-[#D8AB64] font-mono">{selectedVariant.sku}</code>
            </div>
          </div>

          {/* 2. VOLUME PRICING TIERS */}
          {selectedVariant.pricingTiers && selectedVariant.pricingTiers.length > 0 && (
            <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#B3853E] dark:text-[#D8AB64]" />
                  Volume Tier Wholesale Pricing
                </h3>
                <span className="text-[11px] text-[#69736D] dark:text-[#9BA59E]">Live Tier Auto-Calculation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                {selectedVariant.pricingTiers.map((tier) => {
                  const isActive =
                    quantity >= tier.minQty &&
                    (tier.maxQty === null || quantity <= tier.maxQty);
                  return (
                    <div
                      key={tier.id}
                      className={`p-3 rounded-xl border text-xs transition ${
                        isActive
                          ? "border-[#B3853E] bg-[#B3853E]/10 dark:bg-[#B3853E]/20 font-bold"
                          : "border-[#DDE3DC] dark:border-[#212E28] bg-[#EAECE8]/50 dark:bg-[#111916]/50"
                      }`}
                    >
                      <p className="text-[#69736D] dark:text-[#9BA59E] text-[11px] font-medium">
                        {tier.minQty}
                        {tier.maxQty ? ` - ${tier.maxQty}` : "+"} pcs
                      </p>
                      <p className="text-sm font-bold text-[#17231E] dark:text-[#E8EFEA] mt-1 tabular-nums font-mono">
                        {formatCurrency(tier.unitPrice)}
                      </p>
                      {isActive && (
                        <span className="inline-block mt-1 text-[9px] text-[#B3853E] dark:text-[#D8AB64] font-bold uppercase tracking-wider">
                          Active Tier
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ORDER / INVENTORY ACTION BOX */}
          <div className="bg-[#0F1A17] text-white p-6 rounded-2xl space-y-5 border border-[#212E28] shadow-lg">
            {availability && !isOpen && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Ordering Service Temporarily Closed</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {availability.closureMessage}
                </p>
                {availability.nextOpenTime && (
                  <p className="text-[11px] font-semibold text-amber-300">
                    Next Service Window: {availability.nextOpenTime}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-baseline justify-between border-b border-[#212E28] pb-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#9BA59E] tracking-wider">
                  Wholesale Unit Price
                </p>
                <p className="text-2xl font-bold text-[#D8AB64] tabular-nums font-mono">
                  {formatCurrency(currentUnitPrice)}
                  <span className="text-xs font-normal text-[#9BA59E] ml-1">/ unit</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-[#9BA59E] tracking-wider">
                  Line Subtotal
                </p>
                <p className="text-xl font-bold text-white tabular-nums font-mono">
                  {formatCurrency(lineTotal)}
                </p>
              </div>
            </div>

            {availableUnits > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold block text-[#E8EFEA]">
                      Order Quantity (Min: {selectedVariant.minOrderQty} pcs)
                    </label>
                    <span className="text-[11px] text-emerald-400 tabular-nums font-mono">
                      {availableUnits} units available in live warehouse stock
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#18221D] p-1 rounded-xl border border-[#2B3B33] self-start sm:self-auto">
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.max(selectedVariant.minOrderQty, q - 1)
                        )
                      }
                      disabled={quantity <= selectedVariant.minOrderQty}
                      className="w-8 h-8 rounded-lg bg-[#212E28] hover:bg-[#285C4D] flex items-center justify-center font-bold text-xs disabled:opacity-30 transition cursor-pointer"
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
                      className="w-14 text-center bg-transparent text-white font-bold text-xs focus:outline-none tabular-nums font-mono"
                      aria-label="Order quantity"
                    />
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(availableUnits, q + 1))
                      }
                      disabled={quantity >= availableUnits}
                      className="w-8 h-8 rounded-lg bg-[#212E28] hover:bg-[#285C4D] flex items-center justify-center font-bold text-xs disabled:opacity-30 transition cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {feedbackMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      feedbackMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {feedbackMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleAddToBasket}
                    className="w-full py-3 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Wholesale Cart</span>
                  </button>
                  <Link
                    href="/cart"
                    onClick={handleAddToBasket}
                    className="w-full py-3 bg-[#18221D] hover:bg-[#212E28] text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-[#2B3B33] cursor-pointer"
                  >
                    Review Order Request
                  </Link>
                </div>
              </div>
            ) : (
              /* SOLD OUT / NOTIFY ME SECTION */
              <div className="space-y-3.5">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  This variant is currently SOLD OUT. Subscribe below for an automatic notification when new brand-sealed units arrive.
                </div>

                {!notifySubmitted ? (
                  <form onSubmit={handleRestockSubmit} className="space-y-2.5">
                    <input
                      type="email"
                      required
                      placeholder="Enter dealer email for restock alert"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="w-full bg-[#18221D] text-white placeholder-[#9BA59E] text-xs rounded-xl px-3.5 py-2.5 border border-[#2B3B33] focus:outline-none focus:border-[#B3853E]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me When Back in Stock</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Restock alert active. You will receive an email as soon as fresh units arrive.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TECHNICAL SPECIFICATIONS TABLE */}
      <section className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-6 sm:p-8 space-y-6 shadow-2xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#17231E] dark:text-[#E8EFEA]">
            Technical Specifications
          </h2>
          <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-1">
            Verified hardware specifications for dealer inspection and retail customer advisory
          </p>
        </div>

        <div className="space-y-6 divide-y divide-[#DDE3DC] dark:divide-[#212E28]">
          {Object.entries(specsByGroup).map(([group, specs]) => (
            <div key={group} className="pt-5 first:pt-0">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#173B35] dark:text-[#D8AB64] mb-3">
                {group}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-xs">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-baseline justify-between py-1.5 border-b border-[#EAECE8] dark:border-[#212E28]/60"
                  >
                    <span className="font-medium text-[#69736D] dark:text-[#9BA59E]">
                      {spec.key}
                    </span>
                    <span className="font-semibold text-[#17231E] dark:text-[#E8EFEA] text-right ml-4">
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
