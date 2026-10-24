import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      approvalStatus: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
          conversations: true,
          messages: true,
          auditLogs: true,
          subscriptions: true,
        },
      },
    },
  });

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
          revisions: true,
        },
      },
    },
  });

  const orderItemsCount = await prisma.orderItem.count();
  const orderRevisionsCount = await prisma.orderRevision.count();
  const conversationsCount = await prisma.conversation.count();
  const messagesCount = await prisma.message.count();
  const notificationsCount = await prisma.notificationDelivery.count();
  const subscriptionsCount = await prisma.notificationSubscription.count();
  const addressesCount = await prisma.address.count();
  const auditLogsCount = await prisma.auditLog.count();

  const productsCount = await prisma.product.count();
  const variantsCount = await prisma.productVariant.count();
  const brandsCount = await prisma.brand.count();
  const categoriesCount = await prisma.category.count();
  const pricingTiersCount = await prisma.pricingTier.count();
  const inventoryMovementsCount = await prisma.inventoryMovement.count();
  const imagesCount = await prisma.productImage.count();
  const specsCount = await prisma.productSpecification.count();
  const siteSettingsCount = await prisma.siteSetting.count();
  const storeScheduleCount = await prisma.storeSchedule.count();

  const orderItems = await prisma.orderItem.findMany();
  const inventoryMovements = await prisma.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("\n=== ORDER ITEMS ===");
  console.log(JSON.stringify(orderItems, null, 2));

  console.log("\n=== INVENTORY MOVEMENTS ===");
  console.log(JSON.stringify(inventoryMovements, null, 2));

  // Check inventory reservedStock
  const reservedVariants = await prisma.productVariant.findMany({
    where: { reservedStock: { gt: 0 } },
    select: {
      id: true,
      sku: true,
      onHandStock: true,
      reservedStock: true,
    },
  });

  console.log("=== USERS IN DATABASE ===");
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== ORDERS IN DATABASE ===");
  console.log(JSON.stringify(orders, null, 2));

  console.log("\n=== VARIANTS WITH RESERVED STOCK ===");
  console.log(JSON.stringify(reservedVariants, null, 2));

  console.log("\n=== TOTAL RECORD COUNTS BY TABLE ===");
  console.log(
    JSON.stringify(
      {
        User: users.length,
        Address: addressesCount,
        Order: orders.length,
        OrderItem: orderItemsCount,
        OrderRevision: orderRevisionsCount,
        Conversation: conversationsCount,
        Message: messagesCount,
        NotificationSubscription: subscriptionsCount,
        NotificationDelivery: notificationsCount,
        AuditLog: auditLogsCount,
        Product: productsCount,
        ProductVariant: variantsCount,
        Brand: brandsCount,
        Category: categoriesCount,
        PricingTier: pricingTiersCount,
        InventoryMovement: inventoryMovementsCount,
        ProductImage: imagesCount,
        ProductSpecification: specsCount,
        SiteSetting: siteSettingsCount,
        StoreSchedule: storeScheduleCount,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error("Inspection error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
