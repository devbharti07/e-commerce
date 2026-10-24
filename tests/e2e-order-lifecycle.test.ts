import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const BASE_URL = "http://localhost:3000";

describe("E2E Wholesale Order Lifecycle & Security Verification", () => {
  let customerToken: string;
  let ownerToken: string;
  let customerUser: any;
  let ownerUser: any;
  let testVariant: any;
  let createdOrderId: string;
  let createdOrderNumber: string;
  let fulfillmentOrderId: string;

  before(async () => {
    // Fetch seeded customer and owner
    customerUser = await prisma.user.findUnique({
      where: { email: "rajesh.mobile@gmail.com" },
    });
    ownerUser = await prisma.user.findUnique({
      where: { email: "owner@jagdambamobile.com" },
    });

    assert.ok(customerUser, "Customer must exist in DB");
    assert.ok(ownerUser, "Owner must exist in DB");

    // Generate JWT auth session tokens
    customerToken = await createSessionToken({
      userId: customerUser.id,
      email: customerUser.email,
      role: "CUSTOMER",
      name: customerUser.name,
    });

    ownerToken = await createSessionToken({
      userId: ownerUser.id,
      email: ownerUser.email,
      role: "OWNER",
      name: ownerUser.name,
    });

    // Reset test variant stock so previous test runs don't deplete inventory
    await prisma.productVariant.updateMany({
      where: { sku: "SAM-S24U-12-256-GRY" },
      data: { onHandStock: 25, reservedStock: 0 },
    });

    // Ensure store is open for order placement testing
    await prisma.storeSchedule.upsert({
      where: { id: "default" },
      update: { scheduleMode: "FORCE_OPEN", acceptOrders: true },
      create: {
        id: "default",
        acceptOrders: true,
        scheduleMode: "FORCE_OPEN",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: "Our ordering service is currently unavailable. Please check back during our service hours.",
        version: 1,
      },
    });

    // Find test variant (Samsung Galaxy S24 Ultra 256GB Gray)
    testVariant = await prisma.productVariant.findFirst({
      where: { sku: "SAM-S24U-12-256-GRY" },
      include: { product: true },
    });
    assert.ok(testVariant, "Test variant must exist");
  });

  it("1. Verifies Customer and Owner authentication & role guards", async () => {
    // Unauthenticated request to /api/auth/me -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/auth/me`);
    assert.equal(unauthRes.status, 401);

    // Customer authenticated request
    const custRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerToken}` },
    });
    assert.equal(custRes.status, 200);
    const custData = await custRes.json();
    assert.equal(custData.user.role, "CUSTOMER");

    // Owner authenticated request
    const ownerRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
    });
    assert.equal(ownerRes.status, 200);
    const ownerData = await ownerRes.json();
    assert.equal(ownerData.user.role, "OWNER");
  });

  it("2. Verifies Customer CANNOT perform owner-only operations via direct API calls", async () => {
    // Customer calling stock adjustment -> 403 Forbidden
    const adjustRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        variantId: testVariant.id,
        changeQty: 10,
        reason: "HACK",
      }),
    });
    assert.equal(adjustRes.status, 403, "Customer must be rejected from inventory adjustment");

    // Customer calling CSV export -> 403 Forbidden
    const exportRes = await fetch(`${BASE_URL}/api/admin/inventory/export`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerToken}` },
    });
    assert.equal(exportRes.status, 403, "Customer must be rejected from inventory export");

    // Customer calling product status toggle -> 403 Forbidden
    const productRes = await fetch(`${BASE_URL}/api/admin/products/${testVariant.productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({ isPublished: false }),
    });
    assert.equal(productRes.status, 403, "Customer must be rejected from modifying product publish status");
  });

  it("3. Customer submits an order request with volume tier pricing", async () => {
    const initialReserved = testVariant.reservedStock;
    const initialOnHand = testVariant.onHandStock;

    // Submit order for 3 units (Tier B minQty is 3 units -> ₹1,09,999 each)
    const orderReqRes = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ variantId: testVariant.id, quantity: 3 }],
        addressSnapshot: {
          fullName: "Rajesh Sharma",
          mobileNumber: "+91 98234 56789",
          houseOrShop: "Shop No. 14, Ground Floor",
          street: "Main Market Road",
          locality: "Laxmi Nagar",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110092",
          country: "India",
        },
        customerNotes: "Please confirm dispatch date.",
      }),
    });

    assert.equal(orderReqRes.status, 200);
    const orderData = await orderReqRes.json();
    assert.equal(orderData.success, true);
    assert.ok(orderData.order.id);
    assert.equal(orderData.order.status, "REQUESTED");
    // Expected: 3 units * 10999900 paise = 32999700 paise (₹3,29,997)
    assert.equal(orderData.order.totalAmount, 32999700);

    createdOrderId = orderData.order.id;
    createdOrderNumber = orderData.order.orderNumber;

    // Check inventory reservation: in REQUESTED state, inventory is NOT yet reserved
    const checkVariant = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    assert.equal(checkVariant?.reservedStock, initialReserved);
    assert.equal(checkVariant?.onHandStock, initialOnHand);
  });

  it("4. Chat message persistence and participant authorization", async () => {
    // Customer posts a chat message
    const msgRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        content: "Can you provide expedited delivery to Delhi by Tuesday?",
      }),
    });
    assert.equal(msgRes.status, 200);
    const msgData = await msgRes.json();
    assert.equal(msgData.success, true);
    assert.equal(msgData.message.content, "Can you provide expedited delivery to Delhi by Tuesday?");

    // Owner replies to chat
    const ownerMsgRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        content: "Yes, we can arrange insured air express dispatch.",
      }),
    });
    assert.equal(ownerMsgRes.status, 200);

    // Sync polling returns both messages
    const syncRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/sync`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerToken}` },
    });
    assert.equal(syncRes.status, 200);
    const syncData = await syncRes.json();
    assert.ok(syncData.messages.length >= 3); // initial order message + 2 chat messages
  });

  it("5. Owner proposes a price revision and Customer reviews/accepts it", async () => {
    // Security check: Customer cannot propose revision -> 403
    const custRevisionRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/revisions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        changesSummary: "Customer attempting discount",
        newTotal: 30000000,
      }),
    });
    assert.equal(custRevisionRes.status, 403);

    // Owner proposes valid revision with ₹2,000 special dealer discount
    const revisedTotalPaise = 32799700; // ₹3,27,997 (was ₹3,29,997)
    const proposeRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/revisions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        changesSummary: "Applied ₹2,000 bulk volume loyalty concession",
        newTotal: revisedTotalPaise,
      }),
    });
    assert.equal(proposeRes.status, 200);
    const proposeData = await proposeRes.json();
    assert.equal(proposeData.success, true);
    assert.equal(proposeData.revision.status, "PENDING");
    assert.equal(proposeData.order.status, "AWAITING_CUSTOMER_APPROVAL");

    const revisionId = proposeData.revision.id;

    // Customer accepts the revised terms
    const acceptRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/revisions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        revisionId,
        action: "ACCEPT",
      }),
    });
    assert.equal(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.success, true);
    assert.equal(acceptData.revision.status, "ACCEPTED");
    assert.equal(acceptData.order.totalAmount, revisedTotalPaise);
    assert.equal(acceptData.order.status, "UNDER_REVIEW");
  });

  it("6. Owner confirms order -> Live inventory is reserved atomically", async () => {
    const variantBefore = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    const reservedBefore = variantBefore!.reservedStock;

    // Customer cannot confirm order -> 403
    const custConfirmRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    assert.equal(custConfirmRes.status, 403);

    // Owner confirms order
    const ownerConfirmRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    assert.equal(ownerConfirmRes.status, 200);

    const variantAfter = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    // Order was for 3 units -> reserved stock must increase by exactly 3
    assert.equal(variantAfter!.reservedStock, reservedBefore + 3);

    // Verify inventory movement record was created
    const movement = await prisma.inventoryMovement.findFirst({
      where: { referenceOrderId: createdOrderId, reason: "RESERVATION" },
    });
    assert.ok(movement, "Reservation movement record must exist");
    assert.equal(movement.changeQty, 3);
  });

  it("7. Order cancellation releases reserved inventory consistently", async () => {
    const variantBefore = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    const reservedBefore = variantBefore!.reservedStock;

    // Owner rejects/cancels the confirmed order
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    assert.equal(cancelRes.status, 200);

    const variantAfter = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    // Reserved stock must be released back (decreased by 3)
    assert.equal(variantAfter!.reservedStock, reservedBefore - 3);

    // Verify release movement record
    const releaseMovement = await prisma.inventoryMovement.findFirst({
      where: { referenceOrderId: createdOrderId, reason: "ORDER_CANCELLED_RELEASE" },
    });
    assert.ok(releaseMovement, "Cancellation release movement record must exist");
  });

  it("8. Order fulfillment (DELIVERED) updates on-hand stock and releases reservation", async () => {
    // Create a new order to test fulfillment
    const newOrderRes = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ variantId: testVariant.id, quantity: 3 }],
        addressSnapshot: {
          fullName: "Rajesh Sharma",
          mobileNumber: "+91 98234 56789",
          houseOrShop: "Shop No. 14",
          street: "Main Market Road",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110092",
        },
      }),
    });
    const newOrderData = await newOrderRes.json();
    fulfillmentOrderId = newOrderData.order.id;

    // Confirm order (reserves 3 units)
    await fetch(`${BASE_URL}/api/orders/${fulfillmentOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    const vPreFulfill = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    const onHandPre = vPreFulfill!.onHandStock;
    const reservedPre = vPreFulfill!.reservedStock;

    // Owner marks DELIVERED
    const deliverRes = await fetch(`${BASE_URL}/api/orders/${fulfillmentOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "DELIVERED" }),
    });
    assert.equal(deliverRes.status, 200);

    const vPostFulfill = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    // onHandStock must decrease by 3 units, and reservedStock must decrease by 3 units
    assert.equal(vPostFulfill!.onHandStock, onHandPre - 3);
    assert.equal(vPostFulfill!.reservedStock, reservedPre - 3);
  });

  it("9. Restock notification delivery when inventory transitions from 0 to positive", async () => {
    // Create a variant with 0 stock
    const testRestockSku = `RESTOCK-TEST-${Date.now()}`;
    const restockVariant = await prisma.productVariant.create({
      data: {
        productId: testVariant.productId,
        sku: testRestockSku,
        ramGb: 8,
        storageGb: 128,
        colorName: "Phantom Black",
        colorHex: "#000000",
        baseWholesalePrice: 4999900,
        minOrderQty: 2,
        onHandStock: 0,
        reservedStock: 0,
        isAvailable: true,
      },
    });

    // Customer subscribes to restock notifications
    const subRes = await fetch(`${BASE_URL}/api/notifications/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: restockVariant.id,
        email: "retailer.alert@gmail.com",
      }),
    });
    assert.equal(subRes.status, 200);

    // Owner restocks 15 units
    const adjustRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        variantId: restockVariant.id,
        changeQty: 15,
        reason: "Supplier Fresh Batch Restock",
      }),
    });
    assert.equal(adjustRes.status, 200);

    // Verify subscription status updated to NOTIFIED
    const sub = await prisma.notificationSubscription.findFirst({
      where: { variantId: restockVariant.id, email: "retailer.alert@gmail.com" },
    });
    assert.equal(sub?.status, "NOTIFIED");
    assert.ok(sub?.notifiedAt);

    // Verify notification delivery record created
    const delivery = await prisma.notificationDelivery.findFirst({
      where: { recipient: "retailer.alert@gmail.com", type: "RESTOCK" },
    });
    assert.ok(delivery, "Restock notification delivery must be generated");
    assert.equal(delivery.status, "SENT");
    assert.match(delivery.body, new RegExp(testRestockSku));

    // Clean up test variant
    await prisma.notificationDelivery.deleteMany({ where: { recipient: "retailer.alert@gmail.com" } });
    await prisma.notificationSubscription.deleteMany({ where: { variantId: restockVariant.id } });
    await prisma.inventoryMovement.deleteMany({ where: { variantId: restockVariant.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: restockVariant.id } });
    await prisma.productVariant.delete({ where: { id: restockVariant.id } });
  });

  after(async () => {
    const orderIds = [createdOrderId, fulfillmentOrderId].filter(Boolean);
    for (const oid of orderIds) {
      await prisma.inventoryMovement.deleteMany({ where: { referenceOrderId: oid } }).catch(() => {});
      await prisma.message.deleteMany({ where: { conversation: { orderId: oid } } }).catch(() => {});
      await prisma.conversation.deleteMany({ where: { orderId: oid } }).catch(() => {});
      await prisma.orderRevision.deleteMany({ where: { orderId: oid } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId: oid } }).catch(() => {});
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }

    // Restore store availability to FOLLOW_SCHEDULE
    await prisma.storeSchedule.updateMany({
      where: { id: "default" },
      data: { scheduleMode: "FOLLOW_SCHEDULE", acceptOrders: true },
    }).catch(() => {});
  });
});
