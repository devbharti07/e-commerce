import { createSessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function main() {
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) throw new Error("No owner found");

  const token = await createSessionToken({
    userId: owner.id,
    email: owner.email,
    role: "OWNER",
    name: owner.name,
  });

  const order = await prisma.order.findFirst({
    where: { orderNumber: "JM-2026-0001" },
    include: { items: true },
  });
  if (!order) throw new Error("Order JM-2026-0001 not found");

  console.log("Current order:", {
    id: order.id,
    status: order.status,
    items: order.items.map((i) => ({ sku: i.sku, qty: i.quantity, variantId: i.variantId })),
  });

  // Check the variant
  for (const item of order.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });
    console.log("Variant in DB:", {
      id: variant?.id,
      sku: variant?.sku,
      onHandStock: variant?.onHandStock,
      reservedStock: variant?.reservedStock,
      available: (variant?.onHandStock ?? 0) - (variant?.reservedStock ?? 0),
    });
  }

  // Attempt PATCH CONFIRMED via HTTP
  console.log("\n--- Testing HTTP PATCH CONFIRMED ---");
  const confirmRes = await fetch(`http://localhost:3000/api/orders/${order.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${AUTH_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  console.log("Confirm response status:", confirmRes.status);
  const confirmData = await confirmRes.json();
  console.log("Confirm response body:", confirmData);

  // Check DB status
  const orderAfterConfirm = await prisma.order.findUnique({ where: { id: order.id } });
  console.log("Order status in DB after confirm attempt:", orderAfterConfirm?.status);

  // If confirmed, try PATCH REJECTED
  console.log("\n--- Testing HTTP PATCH REJECTED ---");
  const rejectRes = await fetch(`http://localhost:3000/api/orders/${order.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${AUTH_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify({ status: "REJECTED" }),
  });
  console.log("Reject response status:", rejectRes.status);
  const rejectData = await rejectRes.json();
  console.log("Reject response body:", rejectData);

  // Reset order back to REQUESTED for clean testing
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "REQUESTED", confirmedAt: null, cancelledAt: null },
  });
  console.log("Reset order status back to REQUESTED.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Error in test script:", err);
  process.exit(1);
});
