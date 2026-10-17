import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderDetailClient } from "@/components/order-detail-client";

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=/orders/${id}`);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      revisions: {
        orderBy: { revisionNumber: "asc" },
      },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: { name: true, role: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Security guard: Customers may only view their own orders; Owner can view any order
  if (user.role !== "OWNER" && order.customerId !== user.userId) {
    redirect("/orders");
  }

  return (
    <OrderDetailClient
      order={{
        ...order,
        createdAt: order.createdAt.toISOString(),
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          businessName: order.customer.businessName,
        },
        revisions: order.revisions.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        conversation: order.conversation
          ? {
              id: order.conversation.id,
              messages: order.conversation.messages.map((m) => ({
                id: m.id,
                senderId: m.senderId,
                senderRole: m.senderRole,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                sender: { name: m.sender.name },
              })),
            }
          : null,
      }}
      currentUserRole={user.role}
      currentUserId={user.userId}
    />
  );
}
