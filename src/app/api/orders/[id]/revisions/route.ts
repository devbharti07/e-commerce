import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOwner, handleAuthError } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

const ProposeRevisionSchema = z.object({
  changesSummary: z.string().min(3, "Summary of changes is required"),
  newTotal: z.number().int().positive("Revised total must be a positive integer in paise"),
});

const ReviewRevisionSchema = z.object({
  revisionId: z.string().min(1),
  action: z.enum(["ACCEPT", "REJECT"]),
});

// POST: Dealer / Owner proposes an order revision
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id: orderId } = await params;
    const body = await req.json();

    const result = ProposeRevisionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid revision payload" },
        { status: 400 }
      );
    }

    const { changesSummary, newTotal } = result.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { revisions: true, conversation: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "DELIVERED" || order.status === "CANCELLED" || order.status === "REJECTED") {
      return NextResponse.json(
        { error: `Cannot propose a revision on an order with status ${order.status}` },
        { status: 400 }
      );
    }

    const nextRevisionNum = order.revisions.length + 1;

    const [createdRevision, updatedOrder] = await prisma.$transaction(async (tx) => {
      const revision = await tx.orderRevision.create({
        data: {
          orderId: order.id,
          revisionNumber: nextRevisionNum,
          proposedByRole: "OWNER",
          proposedByUserId: owner.userId,
          changesSummary,
          previousTotal: order.totalAmount,
          newTotal,
          status: "PENDING",
        },
      });

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "AWAITING_CUSTOMER_APPROVAL",
        },
      });

      // Post notification message in chat
      if (order.conversation) {
        await tx.message.create({
          data: {
            conversationId: order.conversation.id,
            senderId: owner.userId,
            senderRole: "OWNER",
            content: `[Order Revision #${nextRevisionNum} Proposed]: ${changesSummary}. Revised Total: ${formatCurrency(newTotal)} (was ${formatCurrency(order.totalAmount)}). Please review and approve or decline.`,
          },
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "ORDER_REVISION_PROPOSED",
          entity: "OrderRevision",
          entityId: revision.id,
          detailsJson: JSON.stringify({
            orderNumber: order.orderNumber,
            revisionNumber: nextRevisionNum,
            previousTotal: order.totalAmount,
            newTotal,
            changesSummary,
          }),
        },
      });

      return [revision, updated];
    });

    return NextResponse.json({
      success: true,
      revision: createdRevision,
      order: updatedOrder,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Propose revision error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to propose revision" },
      { status: 400 }
    );
  }
}

// PATCH: Customer accepts or rejects an order revision
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: orderId } = await params;
    const body = await req.json();

    const result = ReviewRevisionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid review action" },
        { status: 400 }
      );
    }

    const { revisionId, action } = result.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        revisions: true,
        conversation: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // IDOR protection: only the customer who owns this order (or owner) can review revisions
    if (user.role === "CUSTOMER" && order.customerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const revision = order.revisions.find((r) => r.id === revisionId);
    if (!revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    if (revision.status !== "PENDING") {
      return NextResponse.json(
        { error: `This revision has already been ${revision.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const [updatedRevision, updatedOrder] = await prisma.$transaction(async (tx) => {
      const revStatus = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";

      const updatedRev = await tx.orderRevision.update({
        where: { id: revision.id },
        data: {
          status: revStatus,
          reviewedAt: new Date(),
        },
      });

      const updatedOrd = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "UNDER_REVIEW",
          totalAmount: action === "ACCEPT" ? revision.newTotal : order.totalAmount,
          subtotal: action === "ACCEPT" ? revision.newTotal : order.subtotal,
        },
      });

      if (order.conversation) {
        await tx.message.create({
          data: {
            conversationId: order.conversation.id,
            senderId: user.userId,
            senderRole: user.role,
            content:
              action === "ACCEPT"
                ? `[Revision #${revision.revisionNumber} Accepted]: Customer approved the revised terms. Order total updated to ${formatCurrency(revision.newTotal)}.`
                : `[Revision #${revision.revisionNumber} Declined]: Customer declined the proposed revised terms.`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: action === "ACCEPT" ? "ORDER_REVISION_ACCEPTED" : "ORDER_REVISION_REJECTED",
          entity: "OrderRevision",
          entityId: revision.id,
          detailsJson: JSON.stringify({
            orderNumber: order.orderNumber,
            revisionNumber: revision.revisionNumber,
            action,
            finalTotal: updatedOrd.totalAmount,
          }),
        },
      });

      return [updatedRev, updatedOrd];
    });

    return NextResponse.json({
      success: true,
      revision: updatedRevision,
      order: updatedOrder,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Review revision error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process revision decision" },
      { status: 400 }
    );
  }
}
