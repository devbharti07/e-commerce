import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        businessName: true,
        gstNumber: true,
        isVerified: true,
        isSuspended: true,
        approvalStatus: true,
      },
    });

    if (!user || (user.role === "CUSTOMER" && (user.approvalStatus !== "APPROVED" || user.isSuspended))) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        businessName: user.businessName,
        gstNumber: user.gstNumber,
        isVerified: user.isVerified,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
