import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createSessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const BASE_URL = "http://localhost:3000";

describe("Admin Order Accept & Decline Workflows (End-to-End Verification)", () => {
  let ownerToken: string;
  let customerToken: string;
  let ownerUserId: string;
  let customerUserId: string;
  let testVariantId: string;
  let testVariantSku: string;
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

    // 3. Find test variant
    const variant = await prisma.productVariant.findFirst({
      where: { isAvailable: true, onHandStock: { gte: 10 } },
      include: { product: true },
    });
    if (!variant) throw new Error("No available product variant with stock found");
    testVariantId = variant.id;
    testVariantSku = variant.sku;

    // 4. Ensure store availability allows ordering during test execution
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
        closureMessage: "Our ordering service is currently unavailable.",
        version: 1,
      },
    });
  });

  after(async () => {
    // Clean up temporary test orders
    for (const orderId of createdTestOrderIds) {
      await prisma.inventoryMovement.deleteMany({ where: { referenceOrderId: orderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.message.deleteMany({ where: { conversation: { orderId } } }).catch(() => {});
      await prisma.conversation.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.orderRevision.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { entityId: orderId } }).catch(() => {});
      await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
    }

    // Restore store availability to FOLLOW_SCHEDULE
    await prisma.storeSchedule.updateMany({
      where: { id: "default" },
      data: { scheduleMode: "FOLLOW_SCHEDULE", acceptOrders: true },
    }).catch(() => {});
  });

  it("1. Unauthenticated request to accept or decline order returns 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/non-existent-id/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    assert.equal(res.status, 401, "Unauthenticated request must return 401 Unauthorized");
  });

  it("2. Non-admin (CUSTOMER role) attempting to accept order returns 403 Forbidden", async () => {
    // Create a temporary order for customer
    const orderCount = await prisma.order.count();
    const tempOrder = await prisma.order.create({
      data: {
        orderNumber: `JM-TEST-${String(orderCount + 1).padStart(4, "0")}`,
        customerId: customerUserId,
        status: "REQUESTED",
        subtotal: 5000000,
        totalAmount: 5000000,
        shippingAddressSnapshot: JSON.stringify({
          fullName: "Rajesh Sharma",
          mobileNumber: "9823456789",
          city: "New Delhi",
        }),
      },
    });
    createdTestOrderIds.push(tempOrder.id);

    const res = await fetch(`${BASE_URL}/api/orders/${tempOrder.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 403, "Customer cannot accept an order");
  });

  it("3. Non-admin (CUSTOMER role) attempting to decline order returns 403 Forbidden", async () => {
    const tempOrderId = createdTestOrderIds[0];
    const res = await fetch(`${BASE_URL}/api/orders/${tempOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
      body: JSON.stringify({ status: "REJECTED" }),
    });

    assert.equal(res.status, 403, "Customer cannot decline / reject an order");
  });

  it("4. Invalid order IDs return 404 Not Found", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/non-existent-order-id-123/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 404, "Invalid order ID must return 404 Not Found");
  });

  it("5. Authorized administrator successfully accepts a valid order (CONFIRMED)", async () => {
    // Create an order with an item
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    const reservedBefore = variantBefore.reservedStock;

    const orderCount = await prisma.order.count();
    const orderToAccept = await prisma.order.create({
      data: {
        orderNumber: `JM-TEST-${String(orderCount + 1).padStart(4, "0")}`,
        customerId: customerUserId,
        status: "REQUESTED",
        subtotal: 10000000,
        totalAmount: 10000000,
        shippingAddressSnapshot: JSON.stringify({
          fullName: "Rajesh Sharma",
          mobileNumber: "9823456789",
          city: "New Delhi",
        }),
        items: {
          create: [
            {
              variantId: testVariantId,
              productName: "Test Smartphone",
              variantName: "12GB/256GB",
              sku: testVariantSku,
              ramGb: 12,
              storageGb: 256,
              colorName: "Black",
              quantity: 2,
              unitPrice: 5000000,
              lineTotal: 10000000,
            },
          ],
        },
      },
    });
    createdTestOrderIds.push(orderToAccept.id);

    // Call PATCH status CONFIRMED
    const res = await fetch(`${BASE_URL}/api/orders/${orderToAccept.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 200, "Accept order must return 200 OK");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order.status, "CONFIRMED");
    assert.ok(data.order.confirmedAt, "confirmedAt timestamp must be recorded");

    // 6. Verify database persistence
    const orderInDb = await prisma.order.findUniqueOrThrow({
      where: { id: orderToAccept.id },
    });
    assert.equal(orderInDb.status, "CONFIRMED", "Order status must be CONFIRMED in DB");
    assert.ok(orderInDb.confirmedAt, "confirmedAt must be persisted in DB");

    // Verify inventory reservation
    const variantAfter = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    assert.equal(
      variantAfter.reservedStock,
      reservedBefore + 2,
      "Variant reservedStock must increment by order item quantity"
    );

    // Verify inventory movement record
    const movement = await prisma.inventoryMovement.findFirst({
      where: { referenceOrderId: orderToAccept.id, reason: "RESERVATION" },
    });
    assert.ok(movement, "InventoryMovement with reason RESERVATION must be recorded");
    assert.equal(movement.changeQty, 2);

    // Verify audit log record
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: orderToAccept.id, action: "ORDER_ACCEPTED" },
    });
    assert.ok(auditLog, "AuditLog with action ORDER_ACCEPTED must be recorded");
  });

  it("7. Repeated click on Accept handles idempotently without double-reserving inventory", async () => {
    const acceptedOrderId = createdTestOrderIds[createdTestOrderIds.length - 1];
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    const reservedBefore = variantBefore.reservedStock;

    // Second accept attempt
    const res = await fetch(`${BASE_URL}/api/orders/${acceptedOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 200, "Repeated accept must return 200 OK");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order.status, "CONFIRMED");

    // Reserved stock must NOT increment again
    const variantAfter = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    assert.equal(
      variantAfter.reservedStock,
      reservedBefore,
      "Reserved stock must not increment on duplicate accept"
    );
  });

  it("8. Invalid status transitions from terminal state are rejected (400 Bad Request)", async () => {
    // Create an order in CANCELLED status
    const orderCount = await prisma.order.count();
    const cancelledOrder = await prisma.order.create({
      data: {
        orderNumber: `JM-TEST-${String(orderCount + 1).padStart(4, "0")}`,
        customerId: customerUserId,
        status: "CANCELLED",
        subtotal: 5000000,
        totalAmount: 5000000,
        shippingAddressSnapshot: JSON.stringify({ fullName: "Rajesh", mobileNumber: "9823456789", city: "Delhi" }),
      },
    });
    createdTestOrderIds.push(cancelledOrder.id);

    // Attempting to move CANCELLED -> CONFIRMED must fail
    const res = await fetch(`${BASE_URL}/api/orders/${cancelledOrder.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 400, "Transitioning a CANCELLED order to CONFIRMED must return 400");
    const data = await res.json();
    assert.ok(data.error.includes("terminal status") || data.error.includes("Invalid transition"));
  });

  it("9. Authorized administrator successfully declines a valid order (REJECTED) with decline reason", async () => {
    // Create an order in REQUESTED status
    const orderCount = await prisma.order.count();
    const orderToDecline = await prisma.order.create({
      data: {
        orderNumber: `JM-TEST-${String(orderCount + 1).padStart(4, "0")}`,
        customerId: customerUserId,
        status: "REQUESTED",
        subtotal: 5000000,
        totalAmount: 5000000,
        shippingAddressSnapshot: JSON.stringify({ fullName: "Rajesh", mobileNumber: "9823456789", city: "Delhi" }),
      },
    });
    createdTestOrderIds.push(orderToDecline.id);

    const declineReasonText = "Color variant currently out of stock; distributor shipment delayed.";

    const res = await fetch(`${BASE_URL}/api/orders/${orderToDecline.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        status: "REJECTED",
        reason: declineReasonText,
      }),
    });

    assert.equal(res.status, 200, "Decline order must return 200 OK");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order.status, "REJECTED");
    assert.ok(data.order.cancelledAt, "cancelledAt timestamp must be recorded on decline");
    assert.equal(data.order.dealerNotes, declineReasonText, "Decline reason must be saved in dealerNotes");

    // 10. Verify DB persistence
    const orderInDb = await prisma.order.findUniqueOrThrow({
      where: { id: orderToDecline.id },
    });
    assert.equal(orderInDb.status, "REJECTED");
    assert.ok(orderInDb.cancelledAt);
    assert.equal(orderInDb.dealerNotes, declineReasonText);

    // Verify audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: orderToDecline.id, action: "ORDER_DECLINED" },
    });
    assert.ok(auditLog, "AuditLog with action ORDER_DECLINED must be recorded");

    // Verify notification delivery
    const notification = await prisma.notificationDelivery.findFirst({
      where: { type: "ORDER_STATUS", title: `Order #${orderToDecline.orderNumber} Declined` },
    });
    assert.ok(notification, "Notification delivery must be recorded for declined order");
  });

  it("11. Transitioning an already declined order to CONFIRMED is rejected (400 Bad Request)", async () => {
    const declinedOrderId = createdTestOrderIds[createdTestOrderIds.length - 1];

    const res = await fetch(`${BASE_URL}/api/orders/${declinedOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 400, "Cannot accept an already declined order");
    const data = await res.json();
    assert.ok(data.error.includes("terminal status") || data.error.includes("Invalid transition"));
  });

  it("12. Declining a previously confirmed order releases reserved stock back to available pool", async () => {
    // 1. Create and confirm an order with 3 units
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    const initialReserved = variantBefore.reservedStock;

    const orderCount = await prisma.order.count();
    const order = await prisma.order.create({
      data: {
        orderNumber: `JM-TEST-${String(orderCount + 1).padStart(4, "0")}`,
        customerId: customerUserId,
        status: "REQUESTED",
        subtotal: 15000000,
        totalAmount: 15000000,
        shippingAddressSnapshot: JSON.stringify({ fullName: "Rajesh", mobileNumber: "9823456789", city: "Delhi" }),
        items: {
          create: [
            {
              variantId: testVariantId,
              productName: "Test Smartphone",
              variantName: "12GB/256GB",
              sku: testVariantSku,
              ramGb: 12,
              storageGb: 256,
              colorName: "Black",
              quantity: 3,
              unitPrice: 5000000,
              lineTotal: 15000000,
            },
          ],
        },
      },
    });
    createdTestOrderIds.push(order.id);

    // Confirm it
    await fetch(`${BASE_URL}/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    const variantAfterConfirm = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    assert.equal(variantAfterConfirm.reservedStock, initialReserved + 3);

    // Now decline it
    const declineRes = await fetch(`${BASE_URL}/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
      body: JSON.stringify({ status: "REJECTED", reason: "Dealer cancelled allocation" }),
    });
    assert.equal(declineRes.status, 200);

    const variantAfterDecline = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    assert.equal(
      variantAfterDecline.reservedStock,
      initialReserved,
      "Reserved stock must be released back to initial level after declining confirmed order"
    );

    // Check inventory movement record
    const releaseMovement = await prisma.inventoryMovement.findFirst({
      where: { referenceOrderId: order.id, reason: "ORDER_CANCELLED_RELEASE" },
    });
    assert.ok(releaseMovement, "ORDER_CANCELLED_RELEASE inventory movement must be recorded");
    assert.equal(releaseMovement.changeQty, -3);
  });

  it("13. Order request with quantity exceeding available stock cannot be confirmed (fails safely)", async () => {
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: testVariantId },
    });
    const available = variant.onHandStock - variant.reservedStock;

    // Create an order requesting way more than available
    const orderCount = await prisma.order.count();
    const excessiveOrder = await prisma.order.create({
      data: {
        orderNumber: `JM-TEST-${String(orderCount + 1).padStart(4, "0")}`,
        customerId: customerUserId,
        status: "REQUESTED",
        subtotal: 500000000,
        totalAmount: 500000000,
        shippingAddressSnapshot: JSON.stringify({ fullName: "Rajesh", mobileNumber: "9823456789", city: "Delhi" }),
        items: {
          create: [
            {
              variantId: testVariantId,
              productName: "Test Smartphone",
              variantName: "12GB/256GB",
              sku: testVariantSku,
              ramGb: 12,
              storageGb: 256,
              colorName: "Black",
              quantity: available + 100, // Exceeds available stock
              unitPrice: 5000000,
              lineTotal: 500000000,
            },
          ],
        },
      },
    });
    createdTestOrderIds.push(excessiveOrder.id);

    const res = await fetch(`${BASE_URL}/api/orders/${excessiveOrder.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    assert.equal(res.status, 400, "Attempting to confirm order exceeding stock must return 400 Bad Request");
    const data = await res.json();
    assert.ok(data.error.includes("Insufficient available stock"));

    // Ensure order remained in REQUESTED status in DB
    const orderInDb = await prisma.order.findUniqueOrThrow({ where: { id: excessiveOrder.id } });
    assert.equal(orderInDb.status, "REQUESTED", "Order must remain in REQUESTED status on failure");
  });

  it("14. Malformed request payload returns 400 Bad Request", async () => {
    const tempOrderId = createdTestOrderIds[0];
    const res = await fetch(`${BASE_URL}/api/orders/${tempOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
      body: JSON.stringify({ status: "INVALID_STATUS_VALUE" }),
    });

    assert.equal(res.status, 400, "Invalid status enum must return 400 Bad Request");
  });

  it("15. Seed order #JM-2026-0001, accounts, and catalog remain completely intact", async () => {
    const seedOrder = await prisma.order.findUnique({
      where: { orderNumber: "JM-2026-0001" },
    });
    assert.ok(seedOrder, "Seed order #JM-2026-0001 must exist");

    const seedCustomer = await prisma.user.findUnique({
      where: { email: "rajesh.mobile@gmail.com" },
    });
    assert.ok(seedCustomer, "Customer account must exist");

    const ownerUser = await prisma.user.findUnique({
      where: { email: "owner@jagdambamobile.com" },
    });
    assert.ok(ownerUser, "Owner account must exist");

    const productCount = await prisma.product.count();
    assert.equal(productCount, 22, "All 22 products must remain intact");
  });
});
