import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, handleAuthError } from "@/lib/auth";

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
  reason: z.string().max(500).optional(),
  dealerNotes: z.string().max(500).optional(),
});

// Explicit valid transition state machine for administrators
const ALLOWED_ADMIN_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: [
    "UNDER_REVIEW",
    "DISCUSSION_PENDING",
    "CHANGES_REQUESTED",
    "AWAITING_CUSTOMER_APPROVAL",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
  ],
  UNDER_REVIEW: [
    "REQUESTED",
    "DISCUSSION_PENDING",
    "CHANGES_REQUESTED",
    "AWAITING_CUSTOMER_APPROVAL",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
  ],
  DISCUSSION_PENDING: [
    "UNDER_REVIEW",
    "AWAITING_CUSTOMER_APPROVAL",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
  ],
  CHANGES_REQUESTED: [
    "UNDER_REVIEW",
    "AWAITING_CUSTOMER_APPROVAL",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
  ],
  AWAITING_CUSTOMER_APPROVAL: [
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
    "UNDER_REVIEW",
  ],
  CONFIRMED: [
    "PROCESSING",
    "READY_FOR_DISPATCH",
    "SHIPPED",
    "DELIVERED",
    "REJECTED",
    "CANCELLED",
  ],
  PROCESSING: [
    "READY_FOR_DISPATCH",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ],
  READY_FOR_DISPATCH: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
  REJECTED: [],  // Terminal state
  EXPIRED: [],   // Terminal state
};

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
      return NextResponse.json(
        { error: "Invalid status or request payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { status: targetStatus, reason, dealerNotes } = result.data;
    const effectiveNotes = reason || dealerNotes;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true, conversation: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Role Permission Guards
    if (user.role === "CUSTOMER") {
      // Customer can only cancel their own requested order
      if (order.customerId !== user.userId) {
        return NextResponse.json({ error: "Forbidden: Not your order" }, { status: 403 });
      }
      if (targetStatus !== "CANCELLED") {
        return NextResponse.json(
          { error: "Forbidden: Customers can only cancel requested orders" },
          { status: 403 }
        );
      }
      if (order.status !== "REQUESTED") {
        return NextResponse.json(
          { error: "Cannot cancel an order that is already processed" },
          { status: 400 }
        );
      }
    } else if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required to manage orders" },
        { status: 403 }
      );
    }

    // Administrator transition guards
    if (user.role === "OWNER") {
      // Idempotent duplicate check: If already in target status, return success safely
      if (order.status === targetStatus) {
        return NextResponse.json({
          success: true,
          order,
          message: `Order is already in ${targetStatus} status.`,
        });
      }

      // Disallow transitions from terminal states
      const terminalStatuses = ["DELIVERED", "CANCELLED", "REJECTED", "EXPIRED"];
      if (terminalStatuses.includes(order.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition order: Order is already in terminal status ${order.status}.`,
          },
          { status: 400 }
        );
      }

      // Verify permitted transition path
      const allowedTargets = ALLOWED_ADMIN_TRANSITIONS[order.status] || [];
      if (!allowedTargets.includes(targetStatus)) {
        return NextResponse.json(
          {
            error: `Invalid transition: Cannot move order from ${order.status} to ${targetStatus}.`,
          },
          { status: 400 }
        );
      }
    }

    // Process transition in atomic transaction to ensure accurate inventory reservation / release
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction with concurrency safety
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!currentOrder) throw new Error("Order not found");

      // Idempotent duplicate safety inside transaction
      if (currentOrder.status === targetStatus) {
        return currentOrder;
      }

      // Case 1: Dealer CONFIRMED the order -> Reserve live stock
      if (targetStatus === "CONFIRMED" && currentOrder.status !== "CONFIRMED") {
        for (const item of currentOrder.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant) throw new Error(`Product variant for SKU ${item.sku} not found`);

          const available = variant.onHandStock - variant.reservedStock;
          if (available < item.quantity) {
            throw new Error(
              `Cannot confirm order: Insufficient available stock for ${item.productName} (${variant.ramGb}GB/${variant.storageGb}GB). Available: ${Math.max(0, available)}, Requested: ${item.quantity}.`
            );
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
              referenceOrderId: currentOrder.id,
              performedById: user.userId,
            },
          });
        }
      }

      // Case 2: Order DELIVERED -> Deduct from onHandStock and release reservation
      if (targetStatus === "DELIVERED" && currentOrder.status !== "DELIVERED") {
        for (const item of currentOrder.items) {
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
              referenceOrderId: currentOrder.id,
              performedById: user.userId,
            },
          });
        }
      }

      // Case 3: Order was CONFIRMED/PROCESSING but now CANCELLED/REJECTED -> Release reserved stock
      if (
        (targetStatus === "CANCELLED" || targetStatus === "REJECTED") &&
        (currentOrder.status === "CONFIRMED" ||
          currentOrder.status === "PROCESSING" ||
          currentOrder.status === "READY_FOR_DISPATCH")
      ) {
        for (const item of currentOrder.items) {
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
              referenceOrderId: currentOrder.id,
              performedById: user.userId,
            },
          });
        }
      }

      // Update Order Status and timestamps
      const saved = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
          confirmedAt: targetStatus === "CONFIRMED" ? new Date() : currentOrder.confirmedAt,
          cancelledAt:
            targetStatus === "CANCELLED" || targetStatus === "REJECTED"
              ? new Date()
              : currentOrder.cancelledAt,
          dealerNotes: effectiveNotes || currentOrder.dealerNotes,
        },
      });

      // Audit Logging
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action:
            targetStatus === "CONFIRMED"
              ? "ORDER_ACCEPTED"
              : targetStatus === "REJECTED"
              ? "ORDER_DECLINED"
              : `ORDER_STATUS_${targetStatus}`,
          entity: "Order",
          entityId: currentOrder.id,
          detailsJson: JSON.stringify({
            previousStatus: currentOrder.status,
            newStatus: targetStatus,
            orderNumber: currentOrder.orderNumber,
            reason: effectiveNotes || null,
          }),
        },
      });

      // Notification Delivery
      if (order.customerId) {
        await tx.notificationDelivery.create({
          data: {
            type: "ORDER_STATUS",
            recipient: order.customer.email || order.customer.phone,
            title:
              targetStatus === "CONFIRMED"
                ? `Order #${order.orderNumber} Confirmed`
                : targetStatus === "REJECTED"
                ? `Order #${order.orderNumber} Declined`
                : `Order #${order.orderNumber} Status Updated`,
            body:
              targetStatus === "CONFIRMED"
                ? `Your wholesale order #${order.orderNumber} has been confirmed. Stock is allocated and preparing for fulfillment.`
                : targetStatus === "REJECTED"
                ? `Your wholesale order #${order.orderNumber} was declined.${effectiveNotes ? ` Note: ${effectiveNotes}` : ""}`
                : `Your wholesale order #${order.orderNumber} is now ${targetStatus.replace(/_/g, " ")}.`,
            status: "SENT",
          },
        });
      }

      // Conversation notification message if thread exists
      if (order.conversation) {
        await tx.message.create({
          data: {
            conversationId: order.conversation.id,
            senderId: user.userId,
            senderRole: user.role === "OWNER" ? "OWNER" : "CUSTOMER",
            content:
              targetStatus === "CONFIRMED"
                ? `[System]: Order #${order.orderNumber} confirmed by Jagdamba Mobile. Live stock reserved.`
                : targetStatus === "REJECTED"
                ? `[System]: Order #${order.orderNumber} declined.${effectiveNotes ? ` Reason: ${effectiveNotes}` : ""}`
                : `[System]: Order #${order.orderNumber} status changed to ${targetStatus.replace(/_/g, " ")}.`,
          },
        });
      }

      return saved;
    });

    const successMessage =
      targetStatus === "CONFIRMED"
        ? "Order accepted and stock successfully allocated."
        : targetStatus === "REJECTED"
        ? "Order declined successfully."
        : `Order status updated to ${targetStatus.replace(/_/g, " ")}.`;

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: successMessage,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Order status update error:", error);
    return NextResponse.json(
      { error: error.message || "Status update failed" },
      { status: 400 }
    );
  }
}

