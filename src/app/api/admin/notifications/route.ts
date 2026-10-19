import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireOwner();

    const [deliveries, subscriptions] = await Promise.all([
      prisma.notificationDelivery.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notificationSubscription.findMany({
        include: {
          variant: { include: { product: true } },
          customer: { select: { name: true, businessName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const unreadCount = deliveries.filter((d) => d.status === "PENDING").length;

    return NextResponse.json({
      success: true,
      deliveries,
      subscriptions,
      unreadCount,
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireOwner();
    const body = await req.json();

    if (body.action === "MARK_ALL_READ") {
      await prisma.notificationDelivery.updateMany({
        where: { status: "PENDING" },
        data: { status: "SENT" },
      });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await prisma.notificationDelivery.update({
        where: { id: body.id },
        data: { status: "SENT" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
