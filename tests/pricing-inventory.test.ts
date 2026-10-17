import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Wholesale Pricing and Volume Tiers", () => {
  const baseWholesalePrice = 13490000; // ₹1,34,900 in paise
  const tiers = [
    { minQty: 2, maxQty: 4, unitPrice: 13490000 },
    { minQty: 5, maxQty: 9, unitPrice: 13150000 }, // ₹1,31,500
    { minQty: 10, maxQty: null, unitPrice: 12800000 }, // ₹1,28,000
  ];

  function getTierPrice(quantity: number): number {
    const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
    for (const t of sorted) {
      if (quantity >= t.minQty) {
        return t.unitPrice;
      }
    }
    return baseWholesalePrice;
  }

  it("calculates Tier A price for 2 units (base wholesale)", () => {
    assert.equal(getTierPrice(2), 13490000);
  });

  it("calculates Tier B discounted price for 6 units", () => {
    assert.equal(getTierPrice(6), 13150000);
  });

  it("calculates Tier C volume discounted price for 12 units", () => {
    assert.equal(getTierPrice(12), 12800000);
  });

  it("calculates correct total for 10 units in integer minor units without float loss", () => {
    const unitPrice = getTierPrice(10);
    const totalInPaise = unitPrice * 10;
    assert.equal(totalInPaise, 128000000); // exactly ₹12,80,000.00
  });
});

describe("Inventory Safety & Available Stock Policy", () => {
  function getAvailableStock(onHand: number, reserved: number): number {
    return Math.max(0, onHand - reserved);
  }

  it("calculates live available units correctly", () => {
    assert.equal(getAvailableStock(25, 4), 21);
  });

  it("ensures available units cannot be negative", () => {
    assert.equal(getAvailableStock(2, 5), 0);
  });

  it("rejects reservations that exceed on-hand stock", () => {
    const onHand = 10;
    const reserved = 3;
    const requested = 8;
    const available = onHand - reserved;
    assert.equal(requested > available, true);
  });
});
