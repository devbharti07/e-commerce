import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleAuthError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        revisions: {
          orderBy: { revisionNumber: "desc" },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: {
                sender: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (user.role !== "OWNER" && order.customerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      status: order.status,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      revisions: order.revisions.map((r) => ({
        id: r.id,
        revisionNumber: r.revisionNumber,
        proposedByRole: r.proposedByRole,
        changesSummary: r.changesSummary,
        previousTotal: r.previousTotal,
        newTotal: r.newTotal,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      messages:
        order.conversation?.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          sender: { name: m.sender.name },
        })) || [],
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
