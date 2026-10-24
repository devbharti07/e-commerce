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
      isVerified: true,
      isSuspended: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
          conversations: true,
          messages: true,
          auditLogs: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`=== TOTAL USERS IN DATABASE: ${users.length} ===`);
  users.forEach((u, i) => {
    console.log(
      `[${i + 1}] ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Phone: ${u.phone} | Role: ${u.role} | Status: ${u.approvalStatus} | Orders: ${u._count.orders} | Addr: ${u._count.addresses}`
    );
  });

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      customer: { select: { email: true, name: true } },
      status: true,
      totalAmount: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n=== TOTAL ORDERS IN DATABASE: ${orders.length} ===`);
  orders.forEach((o, i) => {
    console.log(
      `[${i + 1}] ID: ${o.id} | #${o.orderNumber} | Customer: ${o.customer?.email} | Status: ${o.status} | Total: ₹${(o.totalAmount / 100).toFixed(2)} | Items: ${o._count.items}`
    );
  });

  const [
    productsCount,
    variantsCount,
    pricingTiersCount,
    specificationsCount,
    productImagesCount,
    inventoryMovementsCount,
    ordersCount,
    orderItemsCount,
    orderRevisionsCount,
    conversationsCount,
    messagesCount,
    auditLogsCount,
    notificationsCount,
    notificationSubsCount,
    addressesCount,
    brandsCount,
    categoriesCount,
    siteSettingsCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.pricingTier.count(),
    prisma.productSpecification.count(),
    prisma.productImage.count(),
    prisma.inventoryMovement.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.orderRevision.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.auditLog.count(),
    prisma.notificationDelivery.count(),
    prisma.notificationSubscription.count(),
    prisma.address.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.siteSetting.count(),
  ]);

  console.log("\n=== COMPLETE TABLE INVENTORY COUNTS ===");
  console.log(
    JSON.stringify(
      {
        productsCount,
        variantsCount,
        pricingTiersCount,
        specificationsCount,
        productImagesCount,
        inventoryMovementsCount,
        ordersCount,
        orderItemsCount,
        orderRevisionsCount,
        conversationsCount,
        messagesCount,
        auditLogsCount,
        notificationsCount,
        notificationSubsCount,
        addressesCount,
        brandsCount,
        categoriesCount,
        siteSettingsCount,
      },
      null,
      2
    )
  );

  // Check the admin/owner accounts explicitly
  const adminAccounts = await prisma.user.findMany({
    where: { role: "OWNER" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  const { verifyPassword } = await import("../src/lib/auth");

  console.log("\n=== PROTECTED ADMINISTRATOR / OWNER ACCOUNTS ===");
  for (const a of adminAccounts) {
    let authValid = false;
    if (a.email === "admin@gmail.com") {
      authValid = await verifyPassword("admin@1234", a.passwordHash);
    } else if (a.email === "owner@jagdambamobile.com") {
      authValid = await verifyPassword("Owner@Jagdamba2026", a.passwordHash);
    }
    console.log({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      isVerified: a.isVerified,
      createdAt: a.createdAt,
      hashLength: a.passwordHash.length,
      hashPrefix: a.passwordHash.slice(0, 10),
      authValid,
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
