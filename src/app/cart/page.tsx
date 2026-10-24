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
  PackageCheck,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useStoreAvailability } from "@/hooks/use-store-availability";

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
  const { availability, isOpen, refresh: refreshAvailability } = useStoreAvailability();

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

  // Minimum Order Requirement Check (₹25,000 or at least 2 units)
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
      setErrorMessage("Your wholesale basket is empty.");
      return;
    }

    // Check store availability before proceeding
    if (!isOpen) {
      setErrorMessage(
        availability?.closureMessage ||
          "Our ordering service is currently unavailable. Please check back during our service hours."
      );
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
        if (response.status === 503 || data.code === "ORDERING_UNAVAILABLE") {
          refreshAvailability();
        }
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
      <div className="max-w-3xl mx-auto px-4 py-24 text-center bg-[#F6F5F0] dark:bg-[#111916] min-h-[80vh] flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] p-12 space-y-4 shadow-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#173B35]/10 text-[#173B35] dark:text-[#D8AB64] mx-auto flex items-center justify-center border border-[#173B35]/20">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#17231E] dark:text-[#E8EFEA]">
            Your Wholesale Basket is Empty
          </h2>
          <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] max-w-md mx-auto leading-relaxed">
            Browse our verified inventory of brand-sealed smartphones to select models and inspect automatic volume pricing tiers.
          </p>
          <div className="pt-3">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              <span>Explore Handset Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] min-h-[85vh] transition-colors">
      <div className="pb-5 border-b border-[#DDE3DC] dark:border-[#212E28]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3853E] dark:text-[#D8AB64]">
            Order Checkout
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231E] dark:text-[#E8EFEA] tracking-tight">
          Review Wholesale Order Request
        </h1>
        <p className="text-xs sm:text-sm text-[#69736D] dark:text-[#9BA59E] mt-1">
          Dealer-confirmed bulk purchasing with live volume tier recalculation
        </p>
      </div>

      {/* Service Unavailable Announcement Banner */}
      {!isOpen && (
        <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-800 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 dark:text-amber-200 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">
              Service Currently Unavailable
            </h4>
            <p className="leading-relaxed">
              {availability?.closureMessage ||
                "We're not accepting orders right now. You can continue browsing our products and return during our service hours."}
            </p>
            {availability?.nextOpenTime && (
              <p className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                Scheduled service reopening: {availability.nextOpenTime}
              </p>
            )}
            <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E] pt-0.5">
              Your wholesale basket items and delivery details are preserved. You can submit your order as soon as service opens.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrderRequest} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Basket Items & Delivery Address Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Basket Items List */}
          <div className="bg-white dark:bg-[#18221D] p-5 sm:p-6 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DDE3DC] dark:border-[#212E28]">
              <h2 className="font-bold text-sm text-[#17231E] dark:text-[#E8EFEA]">
                Selected Smartphones ({totalQuantity} units)
              </h2>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4 divide-y divide-[#DDE3DC] dark:divide-[#212E28]">
              {items.map((item) => {
                const effectiveUnitPrice = getItemEffectiveUnitPrice(item);
                const itemTotal = getItemSubtotal(item);

                return (
                  <div
                    key={item.variantId}
                    className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      {item.imageUrl && (
                        <div className="w-16 h-16 rounded-xl bg-[#EAECE8]/60 dark:bg-[#111916]/60 p-1.5 shrink-0 border border-[#DDE3DC] dark:border-[#212E28]">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#17231E] dark:text-[#E8EFEA]">
                          {item.productName}
                        </h4>
                        <p className="text-[11px] text-[#69736D] dark:text-[#9BA59E]">{item.variantName}</p>
                        <p className="text-[10px] text-[#69736D] font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                        <p className="text-xs font-semibold text-[#173B35] dark:text-[#D8AB64] tabular-nums font-mono mt-1">
                          {formatCurrency(effectiveUnitPrice)} / unit
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-[#EAECE8] dark:bg-[#212E28] p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > item.minOrderQty) {
                              updateQuantity(item.variantId, item.quantity - 1);
                            }
                          }}
                          disabled={item.quantity <= item.minOrderQty}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#285C4D] flex items-center justify-center font-bold text-xs disabled:opacity-30 text-[#17231E] dark:text-[#E8EFEA] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums font-mono text-[#17231E] dark:text-[#E8EFEA]">
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
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#18221D] border border-[#DDE3DC] dark:border-[#285C4D] flex items-center justify-center font-bold text-xs disabled:opacity-30 text-[#17231E] dark:text-[#E8EFEA] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-[90px]">
                        <p className="text-sm font-bold tabular-nums font-mono text-[#17231E] dark:text-[#E8EFEA]">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="text-[#69736D] hover:text-rose-600 p-1.5 transition cursor-pointer"
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
          <div className="bg-white dark:bg-[#18221D] p-5 sm:p-6 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] shadow-2xs">
            <GoogleMapsAddressPicker
              initialData={address}
              onChange={(updated) => setAddress(updated)}
            />
          </div>

          {/* Special Customer Notes */}
          <div className="bg-white dark:bg-[#18221D] p-5 sm:p-6 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-2.5 shadow-2xs">
            <label className="font-bold text-xs uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] block">
              Dealer Notes / Special Transit Requests (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please verify GST input credit invoice details before generating e-way bill. Dispatch via trusted air cargo if possible."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-[#EAECE8]/50 dark:bg-[#111916]/50 border border-[#DDE3DC] dark:border-[#212E28] rounded-xl p-3 text-xs text-[#17231E] dark:text-[#E8EFEA] focus:outline-none focus:ring-1 focus:ring-[#173B35] placeholder:text-[#69736D]"
            />
          </div>
        </div>

        {/* Right: Commercial Terms, Live Totals, Submit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#18221D] p-6 rounded-2xl border border-[#DDE3DC] dark:border-[#212E28] space-y-6 sticky top-24 shadow-2xs">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#17231E] dark:text-[#E8EFEA] pb-3.5 border-b border-[#DDE3DC] dark:border-[#212E28]">
              Commercial Order Summary
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-[#69736D] dark:text-[#9BA59E]">
                <span>Total Units Requested</span>
                <span className="font-bold tabular-nums font-mono text-[#17231E] dark:text-[#E8EFEA]">
                  {totalQuantity} Units
                </span>
              </div>
              <div className="flex items-center justify-between text-[#69736D] dark:text-[#9BA59E]">
                <span>Subtotal (Wholesale)</span>
                <span className="font-bold tabular-nums font-mono text-[#17231E] dark:text-[#E8EFEA]">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#69736D] dark:text-[#9BA59E]">
                <span>Estimated Freight & Transit Insurance</span>
                <span className="text-[#69736D]">Calculated on confirmation</span>
              </div>
              <div className="flex items-center justify-between text-[#69736D] dark:text-[#9BA59E]">
                <span>GST (18% Input Tax Credit Eligible)</span>
                <span className="text-[#69736D]">Included in invoice</span>
              </div>

              <div className="pt-4 border-t border-[#DDE3DC] dark:border-[#212E28] flex items-baseline justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#69736D]">
                    Estimated Order Total
                  </p>
                  <p className="text-2xl font-bold tabular-nums font-mono text-[#17231E] dark:text-[#E8EFEA] mt-0.5">
                    {formatCurrency(cartSubtotal)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#173B35] dark:text-[#D8AB64] bg-[#173B35]/10 dark:bg-[#173B35]/30 border border-[#173B35]/20 px-2.5 py-1 rounded-md">
                  Tier Discounts Applied
                </span>
              </div>
            </div>

            {/* Wholesale Policy Reminder Box */}
            <div className="bg-[#B3853E]/10 dark:bg-[#B3853E]/20 border border-[#B3853E]/30 p-4 rounded-xl space-y-1.5 text-xs text-[#17231E] dark:text-[#E8EFEA]">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#B3853E] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Important Notice:</strong> Submitting this request does not confirm the order or charge payment. Jagdamba Mobile distribution managers will review stock allocation, propose final dispatch arrangements, and open a direct order conversation with you.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Service Unavailable Inline Card in Sidebar Summary */}
            {!isOpen && (
              <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-800 rounded-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Ordering Service Closed</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {availability?.closureMessage || "New wholesale order submissions are temporarily paused."}
                </p>
                {availability?.nextOpenTime && (
                  <p className="font-semibold text-[11px] text-amber-800 dark:text-amber-300">
                    Reopens: {availability.nextOpenTime}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !meetsMinOrder || !isOpen}
              className="w-full py-3.5 bg-[#B3853E] hover:bg-[#9E7332] text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {submitting
                ? "Securing Live Inventory..."
                : !isOpen
                ? "Ordering Currently Unavailable"
                : user
                ? "Submit Wholesale Order Request"
                : "Sign In to Submit Order Request"}
            </button>

            {!meetsMinOrder && (
              <p className="text-[11px] text-center text-[#B3853E] dark:text-[#D8AB64] font-medium">
                Minimum order: ₹25,000 & 2 units required for B2B dispatch.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
