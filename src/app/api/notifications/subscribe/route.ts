import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SubscribeSchema = z.object({
  variantId: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`restock:ip:${clientIp}`, 10, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many subscription requests. Please try again later." },
        { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
      );
    }

    const body = await req.json();
    const result = SubscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid email or variant" }, { status: 400 });
    }

    const { variantId, email, phone } = result.data;

    // Verify variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

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
