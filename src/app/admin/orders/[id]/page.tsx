import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminOrderDetailClient } from "@/components/admin-order-detail-client";

interface AdminOrderViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderViewPage({ params }: AdminOrderViewPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "OWNER") {
    redirect(`/login?redirect=/admin/orders/${id}`);
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

  return (
    <AdminOrderDetailClient
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
      currentUserId={user.userId}
    />
  );
}
