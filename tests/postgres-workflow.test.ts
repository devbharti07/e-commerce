import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

describe("PostgreSQL Database Integration Tests", () => {
  it("verifies live PostgreSQL connectivity and engine info", async () => {
    const rawResult: any[] = await prisma.$queryRaw`SELECT current_database() as db_name, version() as version`;
    assert.equal(rawResult[0]?.db_name, "jagdamba_mobile");
    assert.match(rawResult[0]?.version, /PostgreSQL 16/i);
  });

  it("verifies seeded Owner and Retailer accounts with bcrypt authentication in PostgreSQL", async () => {
    const owner = await prisma.user.findUnique({
      where: { email: "owner@jagdambamobile.com" },
    });
    assert.ok(owner, "Owner account must exist");
    assert.equal(owner.role, "OWNER");
    const isOwnerPasswordValid = await bcrypt.compare("Owner@Jagdamba2026", owner.passwordHash);
    assert.equal(isOwnerPasswordValid, true);

    const retailer = await prisma.user.findUnique({
      where: { email: "rajesh.mobile@gmail.com" },
    });
    assert.ok(retailer, "Retailer account must exist");
    assert.equal(retailer.role, "CUSTOMER");
    const isRetailerPasswordValid = await bcrypt.compare("Retailer@2026", retailer.passwordHash);
    assert.equal(isRetailerPasswordValid, true);
  });

  it("verifies products, variants, and pricing tiers in PostgreSQL", async () => {
    const products = await prisma.product.findMany({
      include: {
        brand: true,
        variants: {
          include: { pricingTiers: { orderBy: { minQty: "asc" } } },
        },
      },
    });

    assert.ok(products.length >= 3, "At least 3 products must exist in database");

    const iphone = products.find((p) => p.slug === "apple-iphone-16-pro-max");
    assert.ok(iphone, "iPhone 16 Pro Max must exist");
    assert.equal(iphone.brand.name, "Apple");
    assert.ok(iphone.variants.length >= 2, "iPhone should have at least 2 variants");

    const naturalTitanium = iphone.variants.find((v) => v.sku === "APL-IP16PM-256-NAT");
    assert.ok(naturalTitanium, "Natural Titanium 256GB variant must exist");
    assert.equal(naturalTitanium.baseWholesalePrice, 13490000);
    assert.ok(naturalTitanium.pricingTiers.length >= 3, "Should have 3 pricing tiers");
  });

  it("verifies order lifecycle and chat conversation persistence in PostgreSQL", async () => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: "JM-2026-0001" },
      include: {
        items: true,
        conversation: {
          include: { messages: true },
        },
      },
    });

    assert.ok(order, "Sample order JM-2026-0001 must exist");
    assert.equal(order.status, "REQUESTED");
    assert.ok(order.items.length >= 1, "Order must have items");
    assert.ok(order.conversation, "Order must have an associated conversation");
    assert.ok(order.conversation.messages.length >= 2, "Conversation must contain historical messages");
  });

  it("verifies atomic stock reservation and release logic in PostgreSQL", async () => {
    const variant = await prisma.productVariant.findUnique({
      where: { sku: "1P-12-16-512-EMR" },
    });
    assert.ok(variant, "OnePlus variant must exist");

    const initialReserved = variant.reservedStock;
    const initialOnHand = variant.onHandStock;

    // Simulate reservation in atomic transaction
    const reservedVariant = await prisma.$transaction(async (tx) => {
      return tx.productVariant.update({
        where: { id: variant.id },
        data: { reservedStock: { increment: 5 } },
      });
    });

    assert.equal(reservedVariant.reservedStock, initialReserved + 5);

    // Simulate release in atomic transaction
    const restoredVariant = await prisma.$transaction(async (tx) => {
      return tx.productVariant.update({
        where: { id: variant.id },
        data: { reservedStock: { decrement: 5 } },
      });
    });

    assert.equal(restoredVariant.reservedStock, initialReserved);
    assert.equal(restoredVariant.onHandStock, initialOnHand);
  });
});
