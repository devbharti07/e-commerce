import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();
    const { id: conversationId } = await params;

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderRole: "CUSTOMER",
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
