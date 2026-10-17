import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SubscribeSchema = z.object({
  variantId: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = SubscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid email or variant" }, { status: 400 });
    }

    const { variantId, email, phone } = result.data;

    // Check if active subscription already exists
    const existing = await prisma.notificationSubscription.findFirst({
      where: {
        variantId,
        email: email.toLowerCase(),
        status: "ACTIVE",
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    await prisma.notificationSubscription.create({
      data: {
        variantId,
        email: email.toLowerCase(),
        phone: phone || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to record restock subscription" },
      { status: 500 }
    );
  }
}
