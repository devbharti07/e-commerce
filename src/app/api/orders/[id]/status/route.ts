import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const StatusUpdateSchema = z.object({
  status: z.enum([
    "REQUESTED",
    "UNDER_REVIEW",
    "DISCUSSION_PENDING",
    "CHANGES_REQUESTED",
    "AWAITING_CUSTOMER_APPROVAL",
    "CONFIRMED",
    "PROCESSING",
    "READY_FOR_DISPATCH",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REJECTED",
    "EXPIRED",
  ]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: orderId } = await params;
    const body = await req.json();

    const result = StatusUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const { status: targetStatus } = result.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Role Permission Guards
    if (user.role === "CUSTOMER") {
      // Customer can only cancel their own requested order
      if (order.customerId !== user.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (targetStatus !== "CANCELLED") {
        return NextResponse.json({ error: "Customers can only cancel requested orders" }, { status: 403 });
      }
      if (order.status !== "REQUESTED") {
        return NextResponse.json({ error: "Cannot cancel an order that is already processed" }, { status: 400 });
      }
    }

    // Process transition in atomic transaction to ensure accurate inventory reservation / release
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Case 1: Dealer CONFIRMED the order -> Reserve live stock
      if (targetStatus === "CONFIRMED" && order.status !== "CONFIRMED") {
        for (const item of order.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant) throw new Error(`Variant ${item.sku} not found`);

          const available = variant.onHandStock - variant.reservedStock;
          if (available < item.quantity) {
            throw new Error(`Cannot confirm order: Insufficient stock for ${item.productName}`);
          }

          // Atomically increment reserved stock
          const updatedVariant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              reservedStock: { increment: item.quantity },
            },
          });

          // Record inventory movement
          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              changeQty: item.quantity,
              reason: "RESERVATION",
              balanceOnHand: updatedVariant.onHandStock,
              balanceReserved: updatedVariant.reservedStock,
              referenceOrderId: order.id,
              performedById: user.userId,
            },
          });
        }
      }

      // Case 2: Order DELIVERED -> Deduct from onHandStock and release reservation
      if (targetStatus === "DELIVERED" && order.status !== "DELIVERED") {
        for (const item of order.items) {
          const updatedVariant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              onHandStock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              changeQty: -item.quantity,
              reason: "ORDER_CONFIRMED",
              balanceOnHand: updatedVariant.onHandStock,
              balanceReserved: updatedVariant.reservedStock,
              referenceOrderId: order.id,
              performedById: user.userId,
            },
          });
        }
      }

      // Case 3: Order was CONFIRMED/PROCESSING but now CANCELLED/REJECTED -> Release reserved stock
      if (
        (targetStatus === "CANCELLED" || targetStatus === "REJECTED") &&
        (order.status === "CONFIRMED" || order.status === "PROCESSING" || order.status === "READY_FOR_DISPATCH")
      ) {
        for (const item of order.items) {
          const updatedVariant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              reservedStock: { decrement: item.quantity },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              changeQty: -item.quantity,
              reason: "ORDER_CANCELLED_RELEASE",
              balanceOnHand: updatedVariant.onHandStock,
              balanceReserved: updatedVariant.reservedStock,
              referenceOrderId: order.id,
              performedById: user.userId,
            },
          });
        }
      }

      // Update Order Status
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
          confirmedAt: targetStatus === "CONFIRMED" ? new Date() : order.confirmedAt,
          cancelledAt: targetStatus === "CANCELLED" ? new Date() : order.cancelledAt,
        },
      });
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: error.message || "Status update failed" }, { status: 400 });
  }
}
