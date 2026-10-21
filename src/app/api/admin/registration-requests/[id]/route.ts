import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const owner = await requireOwner();
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(
        { error: "Registration request ID is required" },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { action, reason } = body;
    const normalizedAction = (action || "").toUpperCase().trim();

    const applicant = await prisma.user.findUnique({
      where: { id },
    });

    if (!applicant) {
      return NextResponse.json(
        { error: "Registration request / user not found" },
        { status: 404 }
      );
    }

    if (applicant.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot modify status of administrator account" },
        { status: 400 }
      );
    }

    // 1. APPROVE ACTION
    if (normalizedAction === "APPROVE") {
      // Idempotency: If already approved, return success
      if (applicant.approvalStatus === "APPROVED" && applicant.isVerified && !applicant.isSuspended) {
        return NextResponse.json({
          success: true,
          message: `Account for ${applicant.name} (${applicant.email}) is already approved.`,
          user: applicant,
        });
      }

      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            isVerified: true,
            isSuspended: false,
            approvedAt: new Date(),
            rejectionReason: null,
          },
        });

        // Mark any pending registration notifications for this applicant as handled
        await tx.notificationDelivery.updateMany({
          where: {
            type: "NEW_REGISTRATION",
            body: { contains: applicant.email },
            status: "PENDING",
          },
          data: { status: "SENT" },
        });

        // Record persistent confirmation notification
        await tx.notificationDelivery.create({
          data: {
            type: "REGISTRATION_APPROVED",
            recipient: "ADMIN",
            title: `Dealer Approved: ${applicant.name}`,
            body: `Wholesale portal access for ${applicant.name} (${applicant.email}) has been approved by ${owner.email}.`,
            status: "SENT",
          },
        });

        // Record persistent audit log
        await tx.auditLog.create({
          data: {
            userId: owner.userId,
            action: "REGISTRATION_APPROVED",
            entity: "User",
            entityId: applicant.id,
            detailsJson: JSON.stringify({
              applicantEmail: applicant.email,
              applicantName: applicant.name,
              approvedBy: owner.email,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        return user;
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${applicant.name} (${applicant.email}) has been approved.`,
        user: updatedUser,
      });
    }

    // 2. REJECT ACTION
    if (normalizedAction === "REJECT") {
      const rejectReason = reason?.trim() || "Registration did not meet wholesale dealer verification requirements.";

      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },
          data: {
            approvalStatus: "REJECTED",
            isVerified: false,
            rejectedAt: new Date(),
            rejectionReason: rejectReason,
          },
        });

        // Mark pending notifications as handled
        await tx.notificationDelivery.updateMany({
          where: {
            type: "NEW_REGISTRATION",
            body: { contains: applicant.email },
            status: "PENDING",
          },
          data: { status: "SENT" },
        });

        await tx.auditLog.create({
          data: {
            userId: owner.userId,
            action: "REGISTRATION_REJECTED",
            entity: "User",
            entityId: applicant.id,
            detailsJson: JSON.stringify({
              applicantEmail: applicant.email,
              applicantName: applicant.name,
              rejectedBy: owner.email,
              reason: rejectReason,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        return user;
      });

      return NextResponse.json({
        success: true,
        message: `Account request for ${applicant.name} has been rejected.`,
        user: updatedUser,
      });
    }

    // 3. SUSPEND ACTION
    if (normalizedAction === "SUSPEND") {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },
          data: {
            approvalStatus: "SUSPENDED",
            isSuspended: true,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: owner.userId,
            action: "USER_SUSPENDED",
            entity: "User",
            entityId: applicant.id,
            detailsJson: JSON.stringify({
              applicantEmail: applicant.email,
              suspendedBy: owner.email,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        return user;
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${applicant.name} has been suspended.`,
        user: updatedUser,
      });
    }

    // 4. REACTIVATE ACTION
    if (normalizedAction === "REACTIVATE") {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            isVerified: true,
            isSuspended: false,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: owner.userId,
            action: "USER_REACTIVATED",
            entity: "User",
            entityId: applicant.id,
            detailsJson: JSON.stringify({
              applicantEmail: applicant.email,
              reactivatedBy: owner.email,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        return user;
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${applicant.name} has been reactivated.`,
        user: updatedUser,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions: APPROVE, REJECT, SUSPEND, REACTIVATE" },
      { status: 400 }
    );
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Update registration request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update registration request" },
      { status: 500 }
    );
  }
}
