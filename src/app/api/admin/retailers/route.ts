import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireOwner();

    const retailers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        gstNumber: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = retailers.map((r) => {
      const totalSpent = r.orders
        .filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        businessName: r.businessName,
        gstNumber: r.gstNumber,
        isVerified: r.isVerified,
        isSuspended: r.isSuspended,
        createdAt: r.createdAt.toISOString(),
        ordersCount: r.orders.length,
        totalSpent,
      };
    });

    return NextResponse.json({ success: true, retailers: formatted });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch retailers" }, { status: 500 });
  }
}
