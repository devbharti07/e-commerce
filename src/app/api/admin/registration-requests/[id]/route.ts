import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id } = await params;
    const body = await req.json();
    const { action, reason } = body;

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

    let updatedUser;

    if (action === "APPROVE") {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          rejectionReason: null,
          isSuspended: false,
        },
      });

      // Mark any pending registration notifications for this applicant as SENT/read
      await prisma.notificationDelivery.updateMany({
        where: {
          type: "NEW_REGISTRATION",
          body: { contains: applicant.email },
          status: "PENDING",
        },
        data: { status: "SENT" },
      });

      // Log the administrative action in persistent audit logs
      await prisma.auditLog.create({
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

      return NextResponse.json({
        success: true,
        message: `Account for ${applicant.name} (${applicant.email}) has been approved.`,
        user: updatedUser,
      });
    }

    if (action === "REJECT") {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          approvalStatus: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: reason?.trim() || "Registration did not meet wholesale dealer verification requirements.",
        },
      });

      // Mark notification as handled
      await prisma.notificationDelivery.updateMany({
        where: {
          type: "NEW_REGISTRATION",
          body: { contains: applicant.email },
          status: "PENDING",
        },
        data: { status: "SENT" },
      });

      await prisma.auditLog.create({
        data: {
          userId: owner.userId,
          action: "REGISTRATION_REJECTED",
          entity: "User",
          entityId: applicant.id,
          detailsJson: JSON.stringify({
            applicantEmail: applicant.email,
            applicantName: applicant.name,
            rejectedBy: owner.email,
            reason: reason?.trim() || "Unspecified",
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account request for ${applicant.name} has been rejected.`,
        user: updatedUser,
      });
    }

    if (action === "SUSPEND") {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          approvalStatus: "SUSPENDED",
          isSuspended: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: owner.userId,
          action: "USER_SUSPENDED",
          entity: "User",
          entityId: applicant.id,
          detailsJson: JSON.stringify({
            applicantEmail: applicant.email,
            suspendedBy: owner.email,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${applicant.name} has been suspended.`,
        user: updatedUser,
      });
    }

    if (action === "REACTIVATE") {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          approvalStatus: "APPROVED",
          isSuspended: false,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: owner.userId,
          action: "USER_REACTIVATED",
          entity: "User",
          entityId: applicant.id,
          detailsJson: JSON.stringify({
            applicantEmail: applicant.email,
            reactivatedBy: owner.email,
          }),
        },
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
      { error: "Failed to update registration request" },
      { status: 500 }
    );
  }
}
