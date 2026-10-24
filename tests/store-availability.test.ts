import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";
import {
  evaluateStoreAvailability,
  getTimePartsInZone,
  DEFAULT_STORE_AVAILABILITY_CONFIG,
  StoreAvailabilityConfig,
} from "../src/lib/store-availability";

const BASE_URL = "http://localhost:3000";
const AUTH_COOKIE_NAME = "jm_auth_token";

describe("Store Availability & Order Scheduling System (Production Verification)", () => {
  let ownerToken: string;
  let customerToken: string;
  let ownerUserId: string;
  let customerUserId: string;
  let testVariantId: string;
  let testVariantMinQty = 3;
  let createdTestOrderIds: string[] = [];

  before(async () => {
    // 1. Get Owner Account
    const owner = await prisma.user.findFirst({
      where: { role: "OWNER" },
    });
    if (!owner) throw new Error("No owner account found in database");
    ownerUserId = owner.id;
    ownerToken = await createSessionToken({
      userId: owner.id,
      email: owner.email,
      role: "OWNER",
      name: owner.name,
    });

    // 2. Get Seed Customer Account
    const customer = await prisma.user.findUnique({
      where: { email: "rajesh.mobile@gmail.com" },
    });
    if (!customer) throw new Error("Seed customer rajesh.mobile@gmail.com not found");
    customerUserId = customer.id;
    customerToken = await createSessionToken({
      userId: customer.id,
      email: customer.email,
      role: "CUSTOMER",
      name: customer.name,
    });

    // 3. Get an available product variant with stock for test order attempts
    const variant = await prisma.productVariant.findFirst({
      where: { isAvailable: true, onHandStock: { gt: 10 } },
    });
    if (!variant) throw new Error("No available product variant with stock found");
    testVariantId = variant.id;
    testVariantMinQty = variant.minOrderQty || 3;

    // 4. Ensure StoreSchedule default row exists
    await prisma.storeSchedule.upsert({
      where: { id: "default" },
      update: {
        acceptOrders: true,
        scheduleMode: "FOLLOW_SCHEDULE",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
      },
      create: {
        id: "default",
        acceptOrders: true,
        scheduleMode: "FOLLOW_SCHEDULE",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
        version: 1,
      },
    });
  });

  after(async () => {
    // Cleanup any temporary orders placed during testing
    for (const orderId of createdTestOrderIds) {
      await prisma.inventoryMovement.deleteMany({ where: { referenceOrderId: orderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.message.deleteMany({ where: { conversation: { orderId } } }).catch(() => {});
      await prisma.conversation.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.orderRevision.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
    }

    // Reset store availability to default
    await prisma.storeSchedule.upsert({
      where: { id: "default" },
      update: {
        acceptOrders: true,
        scheduleMode: "FOLLOW_SCHEDULE",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
      },
      create: {
        id: "default",
        acceptOrders: true,
        scheduleMode: "FOLLOW_SCHEDULE",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
        version: 1,
      },
    });
  });

  // =========================================================================
  // DETERMINISTIC TIME EVALUATION TESTS (Requirements 1 - 6)
  // =========================================================================

  it("1. FOLLOW_SCHEDULE at 08:59 IST: orders rejected (CLOSED)", () => {
    // 08:59:00 IST is 03:29:00 UTC
    const date0859 = new Date("2026-10-22T03:29:00.000Z");
    const parts = getTimePartsInZone(date0859, "Asia/Kolkata");
    assert.equal(parts.timeString, "08:59");

    const config: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FOLLOW_SCHEDULE",
      openTime: "09:00",
      closeTime: "23:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Our ordering service is currently unavailable.",
      version: 1,
    };

    const res = evaluateStoreAvailability(config, date0859);
    assert.equal(res.isOpen, false, "Store must be CLOSED at 08:59 IST");
    assert.equal(res.status, "CLOSED");
    assert.ok(res.reason.includes("Outside scheduled service hours"));
    assert.ok(res.nextOpenTime?.includes("09:00 AM IST"));
  });

  it("2. FOLLOW_SCHEDULE at 09:00 IST: orders accepted (OPEN)", () => {
    // 09:00:00 IST is 03:30:00 UTC
    const date0900 = new Date("2026-10-22T03:30:00.000Z");
    const parts = getTimePartsInZone(date0900, "Asia/Kolkata");
    assert.equal(parts.timeString, "09:00");

    const config: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FOLLOW_SCHEDULE",
      openTime: "09:00",
      closeTime: "23:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Our ordering service is currently unavailable.",
      version: 1,
    };

    const res = evaluateStoreAvailability(config, date0900);
    assert.equal(res.isOpen, true, "Store must be OPEN starting exactly at 09:00 IST");
    assert.equal(res.status, "OPEN");
    assert.ok(res.reason.includes("Within scheduled service hours"));
  });

  it("3. FOLLOW_SCHEDULE at 22:59 IST: orders accepted (OPEN)", () => {
    // 22:59:00 IST is 17:29:00 UTC
    const date2259 = new Date("2026-10-22T17:29:00.000Z");
    const parts = getTimePartsInZone(date2259, "Asia/Kolkata");
    assert.equal(parts.timeString, "22:59");

    const config: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FOLLOW_SCHEDULE",
      openTime: "09:00",
      closeTime: "23:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Our ordering service is currently unavailable.",
      version: 1,
    };

    const res = evaluateStoreAvailability(config, date2259);
    assert.equal(res.isOpen, true, "Store must be OPEN right up to 22:59 IST");
    assert.equal(res.status, "OPEN");
  });

  it("4. FOLLOW_SCHEDULE at 23:00 IST: orders rejected (CLOSED)", () => {
    // 23:00:00 IST is 17:30:00 UTC
    const date2300 = new Date("2026-10-22T17:30:00.000Z");
    const parts = getTimePartsInZone(date2300, "Asia/Kolkata");
    assert.equal(parts.timeString, "23:00");

    const config: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FOLLOW_SCHEDULE",
      openTime: "09:00",
      closeTime: "23:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Our ordering service is currently unavailable.",
      version: 1,
    };

    const res = evaluateStoreAvailability(config, date2300);
    assert.equal(res.isOpen, false, "Store must be CLOSED starting at 23:00 IST");
    assert.equal(res.status, "CLOSED");
    assert.ok(res.nextOpenTime?.includes("Tomorrow at 09:00 AM IST"));
  });

  it("5. FORCE_OPEN outside normal hours: orders accepted (OPEN)", () => {
    // 03:15:00 IST (deep night)
    const date0315 = new Date("2026-10-22T21:45:00.000Z");
    const config: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FORCE_OPEN",
      openTime: "09:00",
      closeTime: "23:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Our ordering service is currently unavailable.",
      version: 1,
    };

    const res = evaluateStoreAvailability(config, date0315);
    assert.equal(res.isOpen, true, "FORCE_OPEN must allow ordering outside service hours");
    assert.equal(res.status, "OPEN");
    assert.ok(res.reason.includes("Force Open"));
  });

  it("6. FORCE_CLOSED during normal hours: orders rejected (CLOSED)", () => {
    // 14:00:00 IST (middle of normal business day)
    const date1400 = new Date("2026-10-22T08:30:00.000Z");
    const config: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FORCE_CLOSED",
      openTime: "09:00",
      closeTime: "23:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Special warehouse inventory audit in progress.",
      version: 1,
    };

    const res = evaluateStoreAvailability(config, date1400);
    assert.equal(res.isOpen, false, "FORCE_CLOSED must reject orders even during daylight service hours");
    assert.equal(res.status, "CLOSED");
    assert.equal(res.closureMessage, "Special warehouse inventory audit in progress.");
    assert.equal(res.nextOpenTime, null, "FORCE_CLOSED must not promise reopening time");
  });

  it("6b. Overnight schedules (e.g. 20:00 to 04:00 IST) evaluate correctly", () => {
    const overnightConfig: StoreAvailabilityConfig = {
      acceptOrders: true,
      scheduleMode: "FOLLOW_SCHEDULE",
      openTime: "20:00",
      closeTime: "04:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Closed during daytime.",
      version: 1,
    };

    // 23:00 IST -> inside overnight window
    const insideLate = new Date("2026-10-22T17:30:00.000Z");
    assert.equal(evaluateStoreAvailability(overnightConfig, insideLate).isOpen, true);

    // 02:00 IST -> inside overnight window
    const insideEarly = new Date("2026-10-22T20:30:00.000Z");
    assert.equal(evaluateStoreAvailability(overnightConfig, insideEarly).isOpen, true);

    // 12:00 IST -> daytime outside overnight window
    const outsideDay = new Date("2026-10-22T06:30:00.000Z");
    assert.equal(evaluateStoreAvailability(overnightConfig, outsideDay).isOpen, false);
  });

  // =========================================================================
  // API & BACKEND INTEGRATION TESTS (Requirements 7 - 17)
  // =========================================================================

  it("7. Admin settings persist in database after update and reload", async () => {
    const updatePayload = {
      acceptOrders: true,
      scheduleMode: "FOLLOW_SCHEDULE",
      openTime: "10:00",
      closeTime: "22:00",
      timeZone: "Asia/Kolkata",
      closureMessage: "Jagdamba Mobile dispatch terminal operates 10 AM to 10 PM IST daily.",
    };

    const res = await fetch(`${BASE_URL}/api/admin/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.config.openTime, "10:00");
    assert.equal(data.config.closeTime, "22:00");
    assert.equal(data.config.closureMessage, updatePayload.closureMessage);

    // Verify persisted directly in PostgreSQL
    const fromDb = await prisma.storeSchedule.findUnique({ where: { id: "default" } });
    assert.ok(fromDb);
    assert.equal(fromDb.openTime, "10:00");
    assert.equal(fromDb.closeTime, "22:00");
    assert.equal(fromDb.closureMessage, updatePayload.closureMessage);
  });

  it("8. Unauthorized users cannot update availability settings (403 Forbidden)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        acceptOrders: true,
        scheduleMode: "FORCE_OPEN",
        openTime: "00:00",
        closeTime: "23:59",
        closureMessage: "Hacked closure message",
      }),
    });

    assert.equal(res.status, 403, "Customer token must be strictly denied access to admin availability API");
  });

  it("9 & 10. Direct API order attempts via /api/orders/request are rejected with 503 when ordering is closed", async () => {
    // 1. Force close the store via admin API
    const closeRes = await fetch(`${BASE_URL}/api/admin/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        acceptOrders: true,
        scheduleMode: "FORCE_CLOSED",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: "Wholesale ordering is currently paused for warehouse stock intake.",
      }),
    });
    assert.equal(closeRes.status, 200);

    // 2. Customer attempts to place a new order
    const orderAttemptRes = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ variantId: testVariantId, quantity: 2 }],
        addressSnapshot: {
          fullName: "Rajesh Sharma",
          mobileNumber: "9823456789",
          houseOrShop: "Shop 14",
          street: "Main Market",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110092",
          country: "India",
        },
        customerNotes: "Test order attempt while closed",
      }),
    });

    assert.equal(
      orderAttemptRes.status,
      503,
      "Order creation endpoint must return HTTP 503 Service Unavailable when store is closed"
    );
    const errData = await orderAttemptRes.json();
    assert.equal(errData.code, "ORDERING_UNAVAILABLE");
    assert.equal(errData.error, "Wholesale ordering is currently paused for warehouse stock intake.");
    assert.equal(errData.availability?.isOpen, false);
  });

  it("11. Closing the store does not delete existing orders, customer records, or products", async () => {
    // Check that existing seed customer and order #JM-2026-0001 remain 100% intact
    const seedOrder = await prisma.order.findUnique({
      where: { orderNumber: "JM-2026-0001" },
    });
    assert.ok(seedOrder, "Seed order #JM-2026-0001 must remain completely intact");

    const seedCustomer = await prisma.user.findUnique({
      where: { email: "rajesh.mobile@gmail.com" },
    });
    assert.ok(seedCustomer, "Customer account must remain completely intact");

    const productCount = await prisma.product.count();
    assert.equal(productCount, 22, "All 22 smartphone products must remain intact");
  });

  it("12. Product browsing (/catalog, /products/[slug]) and login remain functional when ordering is closed", async () => {
    // Store is currently FORCE_CLOSED
    // 1. Catalog page loads with 200 OK
    const catalogRes = await fetch(`${BASE_URL}/catalog`);
    assert.equal(catalogRes.status, 200, "Catalog must remain fully browseable");
    const catalogHtml = await catalogRes.text();
    assert.ok(catalogHtml.includes("Samsung") || catalogHtml.includes("Apple") || catalogHtml.includes("Handset"));

    // 2. Product detail page loads with 200 OK
    const productRes = await fetch(`${BASE_URL}/products/apple-iphone-16-pro-max`);
    assert.equal(productRes.status, 200, "Product detail page must remain viewable");

    // 3. Login API works with 200 OK
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rajesh.mobile@gmail.com",
        password: "Retailer@2026",
      }),
    });
    assert.equal(loginRes.status, 200, "Customer authentication must remain operational");
  });

  it("13. Customers receive the configured closure message and public availability endpoint updates", async () => {
    const pubRes = await fetch(`${BASE_URL}/api/availability`);
    assert.equal(pubRes.status, 200);
    const pubData = await pubRes.json();
    assert.equal(pubData.isOpen, false);
    assert.equal(pubData.status, "CLOSED");
    assert.equal(pubData.closureMessage, "Wholesale ordering is currently paused for warehouse stock intake.");
    assert.equal(pubData.scheduleMode, "FORCE_CLOSED");
  });

  it("14. FORCE_OPEN accepts new orders even outside regular hours", async () => {
    // 1. Switch to FORCE_OPEN
    const openRes = await fetch(`${BASE_URL}/api/admin/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        acceptOrders: true,
        scheduleMode: "FORCE_OPEN",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: "Ordering available 24/7.",
      }),
    });
    assert.equal(openRes.status, 200);

    // 2. Customer places order
    const placeRes = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ variantId: testVariantId, quantity: testVariantMinQty }],
        addressSnapshot: {
          fullName: "Rajesh Sharma",
          mobileNumber: "9823456789",
          houseOrShop: "Shop 14",
          street: "Main Market",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110092",
          country: "India",
        },
        customerNotes: "Test order placed under FORCE_OPEN",
      }),
    });

    const orderData = await placeRes.json();
    assert.equal(placeRes.status, 200, `Expected 200 OK under FORCE_OPEN, got ${placeRes.status}: ${JSON.stringify(orderData)}`);
    assert.ok(orderData.order?.id);
    createdTestOrderIds.push(orderData.order.id);
  });

  it("15. Master Toggle Accept Orders = OFF rejects orders regardless of mode", async () => {
    // Set acceptOrders to false
    const toggleOffRes = await fetch(`${BASE_URL}/api/admin/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        acceptOrders: false,
        scheduleMode: "FORCE_OPEN", // Even if scheduleMode was set to FORCE_OPEN, master toggle OFF overrides!
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: "Master ordering switch is turned off.",
      }),
    });
    assert.equal(toggleOffRes.status, 200);

    const pubRes = await fetch(`${BASE_URL}/api/availability`);
    const pubData = await pubRes.json();
    assert.equal(pubData.isOpen, false);
    assert.equal(pubData.status, "CLOSED");
    assert.equal(pubData.acceptOrders, false);

    // Attempt order
    const orderRes = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ variantId: testVariantId, quantity: testVariantMinQty }],
        addressSnapshot: {
          fullName: "Rajesh Sharma",
          mobileNumber: "9823456789",
          houseOrShop: "Shop 14",
          street: "Main Market",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110092",
          country: "India",
        },
      }),
    });

    assert.equal(orderRes.status, 503);
    const err = await orderRes.json();
    assert.equal(err.code, "ORDERING_UNAVAILABLE");
  });

  it("16. Concurrency conflict detection rejects stale updates with 409 Conflict", async () => {
    // 1. Read current version
    const currentRes = await fetch(`${BASE_URL}/api/admin/availability`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
    });
    const { config } = await currentRes.json();
    const staleVersion = config.version - 1; // outdated version

    const conflictRes = await fetch(`${BASE_URL}/api/admin/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        acceptOrders: true,
        scheduleMode: "FOLLOW_SCHEDULE",
        openTime: "09:00",
        closeTime: "23:00",
        closureMessage: "Stale update payload",
        expectedVersion: staleVersion,
      }),
    });

    assert.equal(conflictRes.status, 409, "Must return 409 Conflict on version mismatch");
    const conflictData = await conflictRes.json();
    assert.equal(conflictData.code, "CONCURRENCY_CONFLICT");
  });

  it("17. Invalid time values and malformed API requests are rejected with 400 Bad Request", async () => {
    const invalidPayloads = [
      { openTime: "25:00", closeTime: "23:00" }, // hour > 23
      { openTime: "09:00", closeTime: "11:65" }, // minute > 59
      { openTime: "9:00", closeTime: "23:00" }, // missing leading zero
      { openTime: "invalid", closeTime: "23:00" }, // non-time string
      { closureMessage: "abc" }, // too short (< 5 chars)
      { scheduleMode: "UNKNOWN_MODE" }, // invalid enum
    ];

    for (const bad of invalidPayloads) {
      const res = await fetch(`${BASE_URL}/api/admin/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
        },
        body: JSON.stringify({
          acceptOrders: true,
          scheduleMode: "FOLLOW_SCHEDULE",
          openTime: "09:00",
          closeTime: "23:00",
          closureMessage: "Valid message string",
          ...bad,
        }),
      });

      assert.equal(res.status, 400, `Expected 400 Bad Request for ${JSON.stringify(bad)}, got ${res.status}`);
    }
  });
});
