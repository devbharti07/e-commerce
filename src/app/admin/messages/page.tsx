import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminMessagesClient } from "@/components/admin-messages-client";
import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "Messages & Chat | Jagdamba Mobile Admin",
};

export default async function AdminMessagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/login?redirect=/admin/messages");
  }

  const conversations = await prisma.conversation.findMany({
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Retailer Communications Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time order negotiations, invoice clarifications, and dealer messaging
          </p>
        </div>
      </div>

      <AdminMessagesClient initialConversations={formatted} />
    </div>
  );
}
