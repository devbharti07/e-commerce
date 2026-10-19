import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireOwner();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const conversations = await prisma.conversation.findMany({
      where: query
        ? {
            OR: [
              { order: { orderNumber: { contains: query, mode: "insensitive" } } },
              { customer: { name: { contains: query, mode: "insensitive" } } },
              { customer: { businessName: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {},
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, phone: true },
        },
        order: {
          select: { id: true, orderNumber: true, status: true, totalAmount: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderRole: "CUSTOMER",
            isRead: false,
          },
        });

        const lastMsg = c.messages[0];

        return {
          id: c.id,
          orderId: c.orderId,
          orderNumber: c.order.orderNumber,
          orderStatus: c.order.status,
          orderTotal: c.order.totalAmount,
          customerName: c.customer.name,
          businessName: c.customer.businessName,
          customerPhone: c.customer.phone,
          unreadCount,
          lastMessage: lastMsg ? lastMsg.content : null,
          lastMessageAt: lastMsg ? lastMsg.createdAt.toISOString() : c.updatedAt.toISOString(),
          lastMessageSender: lastMsg ? lastMsg.senderRole : null,
        };
      })
    );

    return NextResponse.json({ success: true, conversations: formatted });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
