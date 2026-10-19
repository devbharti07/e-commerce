import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, handleAuthError } from "@/lib/auth";

const MessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: orderId } = await params;
    const body = await req.json();

    const result = MessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { conversation: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Role check: Only customer owner of order or admin owner can post
    if (user.role !== "OWNER" && order.customerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let conversation = order.conversation;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
        },
      });
    }

    const created = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.userId,
        senderRole: user.role,
        content: result.data.content,
      },
      include: {
        sender: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: created.id,
        senderId: created.senderId,
        senderRole: created.senderRole,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        sender: { name: created.sender.name },
      },
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
