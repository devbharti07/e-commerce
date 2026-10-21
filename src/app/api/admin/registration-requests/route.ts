import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireOwner();

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || "ALL";

    const whereClause: any = {
      role: "CUSTOMER",
    };

    if (statusFilter !== "ALL") {
      whereClause.approvalStatus = statusFilter;
    }

    const [requests, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessName: true,
          gstNumber: true,
          role: true,
          approvalStatus: true,
          rejectionReason: true,
          isVerified: true,
          isSuspended: true,
          approvedAt: true,
          rejectedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "APPROVED" } }),
      prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "REJECTED" } }),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Fetch registration requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration requests" },
      { status: 500 }
    );
  }
}
