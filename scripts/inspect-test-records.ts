import { prisma } from "../src/lib/prisma";

async function run() {
  const testEmails = [
    "suspend.test.1792562182845@example.com",
    "suspend.test.1792582860263@example.com",
    "suspend.test.1792584910738@example.com",
    "retailer.reg.1792584941277@example.com",
    "dealer.pending.1792585007508@example.com",
    "suspend.test.1792588258993@example.com",
    "security.retailer.b@gmail.com",
    "security.pending.user@gmail.com",
  ];

  for (const email of testEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        addresses: true,
        orders: true,
        conversations: true,
        messages: true,
        subscriptions: true,
        auditLogs: true,
      },
    });
    console.log(email, {
      found: !!user,
      id: user?.id,
      orders: user?.orders.length,
      addresses: user?.addresses.length,
      auditLogs: user?.auditLogs.length,
      subscriptions: user?.subscriptions.length,
      conversations: user?.conversations.length,
      messages: user?.messages.length,
    });
  }

  // Also inspect any orders that do not belong to rajesh.mobile@gmail.com
  const allOrders = await prisma.order.findMany({
    include: {
      customer: { select: { email: true, name: true } },
    },
  });
  console.log("\nAll orders:", allOrders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerEmail: o.customer.email,
    customerName: o.customer.name,
    status: o.status,
    totalAmount: o.totalAmount
  })));

}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
