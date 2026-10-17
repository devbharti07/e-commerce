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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-12 space-y-4 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Your Wholesale Basket is Empty
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Browse our verified inventory of brand-sealed smartphones to select models and volume pricing tiers.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-bold text-sm rounded-xl hover:opacity-90 transition mt-4"
          >
            Explore Smartphone Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Review Wholesale Order Request
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Dealer-confirmed bulk purchasing with live volume tier recalculation
        </p>
      </div>

      <form onSubmit={handleSubmitOrderRequest} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Basket Items & Delivery Address Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Basket Items List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-base text-gray-900 dark:text-white">
                Selected Smartphones ({totalQuantity} units)
              </h2>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-700">
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
                        <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-900 p-2 shrink-0 border border-gray-200 dark:border-gray-700">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                        <p className="text-xs font-semibold text-[#14213D] dark:text-[#FCA311] mt-1">
                          {formatCurrency(effectiveUnitPrice)} / unit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > item.minOrderQty) {
                              updateQuantity(item.variantId, item.quantity - 1);
                            }
                          }}
                          disabled={item.quantity <= item.minOrderQty}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-xs disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-900 dark:text-white">
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
                          className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-xs disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-[90px]">
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="text-gray-400 hover:text-red-600 p-1.5 transition"
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <GoogleMapsAddressPicker
              initialData={address}
              onChange={(updated) => setAddress(updated)}
            />
          </div>

          {/* Special Customer Notes */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
            <label className="font-bold text-xs text-gray-900 dark:text-white block">
              Dealer Notes / Specific Transit Requests (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please verify GST input credit invoice details before generating e-way bill. Dispatch via trusted air cargo if possible."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
            />
          </div>
        </div>

        {/* Right: Commercial Terms, Live Totals, Submit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-5 sticky top-24">
            <h3 className="font-black text-base text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-700">
              Commercial Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Total Units Requested</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalQuantity} Units
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal (Wholesale)</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Estimated Freight & Transit Insurance</span>
                <span className="text-gray-500">Calculated on confirmation</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18% Input Tax Credit Eligible)</span>
                <span className="text-gray-500">Included in final invoice</span>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">
                    Estimated Order Total
                  </p>
                  <p className="text-2xl font-black text-[#14213D] dark:text-[#FCA311] mt-0.5">
                    {formatCurrency(cartSubtotal)}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Tier Discounts Applied
                </span>
              </div>
            </div>

            {/* Wholesale Policy Reminder Box */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-xl space-y-2 text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Important Notice:</strong> Submitting this request does not confirm the order or charge payment. Jagdamba Mobile distribution managers will review stock allocation, propose final dispatch arrangements, and open a direct order conversation with you.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !meetsMinOrder}
              className="w-full py-4 bg-[#14213D] dark:bg-[#FCA311] text-white dark:text-[#14213D] font-black text-sm rounded-xl hover:opacity-95 transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
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
