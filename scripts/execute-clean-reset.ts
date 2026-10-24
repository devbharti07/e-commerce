import { prisma } from "../src/lib/prisma";

// Protected Admin Accounts (Verified by role === "OWNER" and known accounts)
const PROTECTED_ADMIN_IDS = [
  "cmve3tv790000vlpo2l2mbyos", // admin@gmail.com
  "cmvcojv880000vlu0hdb1lf9c", // owner@jagdambamobile.com
];

export async function executeCleanup(dryRun: boolean = true) {
  console.log(`\n======================================================`);
  console.log(`DATABASE CLEANUP: ${dryRun ? "DRY-RUN (No changes applied)" : "EXECUTION MODE (Applying Transaction)"}`);
  console.log(`======================================================\n`);

  // 1. Verify and protect admin accounts
  const ownerUsers = await prisma.user.findMany({
    where: { role: "OWNER" },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });

  console.log(`Found ${ownerUsers.length} OWNER accounts:`);
  for (const owner of ownerUsers) {
    if (!PROTECTED_ADMIN_IDS.includes(owner.id)) {
      throw new Error(`Unexpected owner account found: ${owner.email} (${owner.id}). Halting for safety.`);
    }
    console.log(`  [PROTECTED] ID: ${owner.id} | Email: ${owner.email} | Name: ${owner.name} | Role: ${owner.role}`);
  }

  // 2. Identify customer/test accounts to remove
  const customerUsers = await prisma.user.findMany({
    where: { role: { not: "OWNER" } },
    select: { id: true, email: true, name: true, role: true },
  });

  const customerUserIds = customerUsers.map((u) => u.id);
  console.log(`\nFound ${customerUsers.length} customer/test accounts to remove:`);
  for (const cust of customerUsers) {
    console.log(`  [TO DELETE] ID: ${cust.id} | Email: ${cust.email} | Name: ${cust.name}`);
  }

  // 3. Count records to be deleted
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();
  const orderRevisionCount = await prisma.orderRevision.count();
  const conversationCount = await prisma.conversation.count();
  const messageCount = await prisma.message.count();
  const notificationDeliveryCount = await prisma.notificationDelivery.count();
  const notificationSubscriptionCount = await prisma.notificationSubscription.count({
    where: { customerId: { in: customerUserIds } },
  });
  const addressCount = await prisma.address.count({
    where: { userId: { in: customerUserIds } },
  });
  const customerAuditLogCount = await prisma.auditLog.count({
    where: { userId: { in: customerUserIds } },
  });

  // Count catalog records that will be preserved
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const brandCount = await prisma.brand.count();
  const categoryCount = await prisma.category.count();
  const pricingTierCount = await prisma.pricingTier.count();
  const siteSettingCount = await prisma.siteSetting.count();
  const storeScheduleCount = await prisma.storeSchedule.count();

  // Inventory reservation status
  const variantsWithReservation = await prisma.productVariant.findMany({
    where: { reservedStock: { gt: 0 } },
    select: { id: true, sku: true, onHandStock: true, reservedStock: true },
  });

  console.log("\n--- PROPOSED DELETION COUNTS ---");
  console.log(`  Customer Accounts (User):        ${customerUsers.length}`);
  console.log(`  Customer Delivery Addresses:     ${addressCount}`);
  console.log(`  Orders:                          ${orderCount}`);
  console.log(`  Order Items:                     ${orderItemCount}`);
  console.log(`  Order Revisions:                 ${orderRevisionCount}`);
  console.log(`  Conversations:                   ${conversationCount}`);
  console.log(`  Messages:                        ${messageCount}`);
  console.log(`  Notification Deliveries:         ${notificationDeliveryCount}`);
  console.log(`  Notification Subscriptions:      ${notificationSubscriptionCount}`);
  console.log(`  Customer-specific Audit Logs:    ${customerAuditLogCount}`);

  console.log("\n--- PRESERVED SYSTEM & BUSINESS DATA ---");
  console.log(`  Admin/Owner Accounts:            ${ownerUsers.length}`);
  console.log(`  Products in Catalog:             ${productCount}`);
  console.log(`  Product Variants:                ${variantCount}`);
  console.log(`  Brands:                          ${brandCount}`);
  console.log(`  Categories:                      ${categoryCount}`);
  console.log(`  Pricing Tiers:                   ${pricingTierCount}`);
  console.log(`  Site Settings:                   ${siteSettingCount}`);
  console.log(`  Store Schedule:                  ${storeScheduleCount}`);

  console.log("\n--- INVENTORY RESERVATION RECONCILIATION ---");
  console.log(`  Variants with obsolete reservations to be cleared (set to 0): ${variantsWithReservation.length}`);
  for (const v of variantsWithReservation) {
    console.log(`    SKU: ${v.sku} | OnHand: ${v.onHandStock} (Preserved) | Reserved: ${v.reservedStock} -> 0`);
  }

  if (dryRun) {
    console.log(`\n[DRY RUN COMPLETE] No records were modified or deleted.`);
    return { dryRun: true };
  }

  // 4. Perform atomic transactional cleanup
  console.log("\nBeginning atomic PostgreSQL transaction...");
  const result = await prisma.$transaction(async (tx) => {
    // A. Delete customer messages and conversations
    const delMessages = await tx.message.deleteMany({});
    const delConversations = await tx.conversation.deleteMany({});

    // B. Delete order items, revisions, and orders
    const delOrderItems = await tx.orderItem.deleteMany({});
    const delOrderRevisions = await tx.orderRevision.deleteMany({});
    const delOrders = await tx.order.deleteMany({});

    // C. Nullify referenceOrderId in InventoryMovement to avoid orphan references
    await tx.inventoryMovement.updateMany({
      where: { referenceOrderId: { not: null } },
      data: { referenceOrderId: null },
    });

    // D. Reconcile obsolete inventory reservations (set reservedStock = 0, preserve onHandStock)
    const resetReservations = await tx.productVariant.updateMany({
      where: { reservedStock: { gt: 0 } },
      data: { reservedStock: 0 },
    });

    // E. Delete notification deliveries and customer notification subscriptions
    const delNotificationDeliveries = await tx.notificationDelivery.deleteMany({});
    const delSubscriptions = await tx.notificationSubscription.deleteMany({
      where: { customerId: { in: customerUserIds } },
    });

    // F. Delete customer addresses
    const delAddresses = await tx.address.deleteMany({
      where: { userId: { in: customerUserIds } },
    });

    // G. Delete customer-specific audit logs
    const delAuditLogs = await tx.auditLog.deleteMany({
      where: { userId: { in: customerUserIds } },
    });

    // H. Delete customer user accounts
    const delUsers = await tx.user.deleteMany({
      where: { id: { in: customerUserIds } },
    });

    // --- POST-TRANSACTION INTEGRITY ASSERTIONS ---
    const remainingOwners = await tx.user.findMany({ where: { role: "OWNER" } });
    if (remainingOwners.length !== 2) {
      throw new Error(`Integrity check failed: Expected 2 owners, found ${remainingOwners.length}`);
    }

    const postProductCount = await tx.product.count();
    const postVariantCount = await tx.productVariant.count();
    if (postProductCount !== productCount || postVariantCount !== variantCount) {
      throw new Error(`Integrity check failed: Catalog counts changed unexpectedly.`);
    }

    const postOrderCount = await tx.order.count();
    if (postOrderCount !== 0) {
      throw new Error(`Integrity check failed: Order count is ${postOrderCount}, expected 0.`);
    }

    const postReservedCount = await tx.productVariant.count({ where: { reservedStock: { gt: 0 } } });
    if (postReservedCount !== 0) {
      throw new Error(`Integrity check failed: Reserved stock not 0.`);
    }

    return {
      deletedUsers: delUsers.count,
      deletedAddresses: delAddresses.count,
      deletedOrders: delOrders.count,
      deletedOrderItems: delOrderItems.count,
      deletedOrderRevisions: delOrderRevisions.count,
      deletedConversations: delConversations.count,
      deletedMessages: delMessages.count,
      deletedNotificationDeliveries: delNotificationDeliveries.count,
      deletedSubscriptions: delSubscriptions.count,
      deletedAuditLogs: delAuditLogs.count,
      reconciledReservations: resetReservations.count,
    };
  });

  console.log("\n======================================================");
  console.log("TRANSACTION COMMITTED SUCCESSFULLY");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================================\n");

  return { dryRun: false, ...result };
}

if (require.main === module) {
  const isExecute = process.argv.includes("--execute");
  executeCleanup(!isExecute)
    .catch((err) => {
      console.error("Cleanup error:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
