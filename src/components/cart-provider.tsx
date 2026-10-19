"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  quantity: number;
  minOrderQty: number;
  maxOrderQty?: number | null;
  baseWholesalePrice: number; // in paise
  tiers: { minQty: number; maxQty: number | null; unitPrice: number }[];
  availableStock: number;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => { success: boolean; message?: string };
  updateQuantity: (variantId: string, quantity: number) => { success: boolean; message?: string };
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getItemEffectiveUnitPrice: (item: CartItem) => number;
  getItemSubtotal: (item: CartItem) => number;
  cartSubtotal: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jm_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => {
          setItems(parsed);
          setLoaded(true);
        });
        return;
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    queueMicrotask(() => {
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("jm_cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  const getItemEffectiveUnitPrice = (item: CartItem): number => {
    if (!item.tiers || item.tiers.length === 0) {
      return item.baseWholesalePrice;
    }
    // Find matching tier
    const sortedTiers = [...item.tiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (item.quantity >= tier.minQty) {
        return tier.unitPrice;
      }
    }
    return item.baseWholesalePrice;
  };

  const getItemSubtotal = (item: CartItem): number => {
    return getItemEffectiveUnitPrice(item) * item.quantity;
  };

  const addItem = (
    itemData: Omit<CartItem, "quantity">,
    qty: number
  ): { success: boolean; message?: string } => {
    if (qty < itemData.minOrderQty) {
      return {
        success: false,
        message: `Minimum wholesale order quantity for this item is ${itemData.minOrderQty} units.`,
      };
    }
    if (qty > itemData.availableStock) {
      return {
        success: false,
        message: `Only ${itemData.availableStock} units available in live stock.`,
      };
    }

    setItems((prev) => {
      const existing = prev.find((x) => x.variantId === itemData.variantId);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > itemData.availableStock) {
          return prev;
        }
        return prev.map((x) =>
          x.variantId === itemData.variantId ? { ...x, quantity: newQty } : x
        );
      }
      return [...prev, { ...itemData, quantity: qty }];
    });

    return { success: true };
  };

  const updateQuantity = (
    variantId: string,
    quantity: number
  ): { success: boolean; message?: string } => {
    const item = items.find((x) => x.variantId === variantId);
    if (!item) return { success: false, message: "Item not in basket" };

    if (quantity < item.minOrderQty) {
      return {
        success: false,
        message: `Minimum order quantity is ${item.minOrderQty} units.`,
      };
    }
    if (quantity > item.availableStock) {
      return {
        success: false,
        message: `Only ${item.availableStock} units currently available.`,
      };
    }

    setItems((prev) =>
      prev.map((x) => (x.variantId === variantId ? { ...x, quantity } : x))
    );
    return { success: true };
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((x) => x.variantId !== variantId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartSubtotal = items.reduce(
    (sum, item) => sum + getItemSubtotal(item),
    0
  );

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getItemEffectiveUnitPrice,
        getItemSubtotal,
        cartSubtotal,
        totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
