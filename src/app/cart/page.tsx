"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, CartItem } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { formatCurrency } from "@/lib/utils";
import {
  GoogleMapsAddressPicker,
  AddressFormData,
} from "@/components/google-maps-address-picker";
import {
  Trash2,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  Info,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function CartAndCheckoutPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getItemEffectiveUnitPrice,
    getItemSubtotal,
    cartSubtotal,
    totalQuantity,
  } = useCart();

  const { user } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState<AddressFormData>({
    fullName: user?.name || "",
    mobileNumber: "",
    houseOrShop: "",
    street: "",
    locality: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    instructions: "",
    latitude: 28.6139,
    longitude: 77.209,
  });

  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        mobileNumber: prev.mobileNumber || user.phone || "",
      }));
    }
  }, [user]);

  // Minimum Order Requirement Check (e.g. ₹25,000 or at least 2 units)
  const MIN_ORDER_VALUE = 2500000; // ₹25,000 in paise
  const meetsMinOrder = cartSubtotal >= MIN_ORDER_VALUE && totalQuantity >= 2;

  const handleSubmitOrderRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      router.push("/login?redirect=/cart");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your basket is empty.");
      return;
    }

    if (!address.fullName || !address.mobileNumber || !address.houseOrShop || !address.city || !address.pinCode) {
      setErrorMessage("Please complete all required delivery address fields.");
      return;
    }

    if (!meetsMinOrder) {
      setErrorMessage("Wholesale minimum order requirement is ₹25,000 and at least 2 total units.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          addressSnapshot: address,
          customerNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to submit order request");
        setSubmitting(false);
        return;
      }

      // Order request created successfully! Clear cart & route to order conversation
      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Your Wholesale Basket is Empty
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Browse our verified inventory of brand-sealed smartphones to select models and volume pricing tiers.
          </p>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg transition"
            >
              Explore Smartphone Catalog
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Review Wholesale Order Request
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dealer-confirmed bulk purchasing with live volume tier recalculation
        </p>
      </div>

      <form onSubmit={handleSubmitOrderRequest} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Basket Items & Delivery Address Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Basket Items List */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Selected Smartphones ({totalQuantity} units)
              </h2>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-600 dark:text-rose-400 font-medium hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const effectiveUnitPrice = getItemEffectiveUnitPrice(item);
                const itemTotal = getItemSubtotal(item);

                return (
                  <div
                    key={item.variantId}
                    className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <div className="w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-800 p-1.5 shrink-0 border border-slate-200 dark:border-slate-700">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                          {item.productName}
                        </h4>
                        <p className="text-[11px] text-slate-500">{item.variantName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                          {formatCurrency(effectiveUnitPrice)} / unit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > item.minOrderQty) {
                              updateQuantity(item.variantId, item.quantity - 1);
                            }
                          }}
                          disabled={item.quantity <= item.minOrderQty}
                          className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs disabled:opacity-30 text-slate-700 dark:text-slate-200"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity < item.availableStock) {
                              updateQuantity(item.variantId, item.quantity + 1);
                            }
                          }}
                          disabled={item.quantity >= item.availableStock}
                          className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs disabled:opacity-30 text-slate-700 dark:text-slate-200"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-[90px]">
                        <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                        title="Remove from basket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address & Maps Component */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <GoogleMapsAddressPicker
              initialData={address}
              onChange={(updated) => setAddress(updated)}
            />
          </div>

          {/* Special Customer Notes */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
            <label className="font-medium text-xs text-slate-700 dark:text-slate-300 block">
              Dealer Notes / Specific Transit Requests (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please verify GST input credit invoice details before generating e-way bill. Dispatch via trusted air cargo if possible."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Right: Commercial Terms, Live Totals, Submit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5 sticky top-24 shadow-xs">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Commercial Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Total Units Requested</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {totalQuantity} Units
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal (Wholesale)</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Freight & Transit Insurance</span>
                <span className="text-slate-500">Calculated on confirmation</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>GST (18% Input Tax Credit Eligible)</span>
                <span className="text-slate-500">Included in final invoice</span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Estimated Order Total
                  </p>
                  <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(cartSubtotal)}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  Tier Discounts Applied
                </span>
              </div>
            </div>

            {/* Wholesale Policy Reminder Box */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-lg space-y-1.5 text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Important Notice:</strong> Submitting this request does not confirm the order or charge payment. Jagdamba Mobile distribution managers will review stock allocation, propose final dispatch arrangements, and open a direct order conversation with you.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !meetsMinOrder}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs rounded-lg transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              {submitting
                ? "Securing Live Inventory..."
                : user
                ? "Submit Wholesale Order Request"
                : "Sign In to Submit Order Request"}
            </button>

            {!meetsMinOrder && (
              <p className="text-[11px] text-center text-amber-600 dark:text-amber-400">
                Minimum order: ₹25,000 & 2 units required for B2B dispatch.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
