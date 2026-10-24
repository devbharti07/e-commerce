import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getStoreAvailability } from "@/lib/store-availability";

const OrderRequestSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Order must contain at least one item"),
  addressSnapshot: z.object({
    fullName: z.string().min(1),
    mobileNumber: z.string().min(10),
    houseOrShop: z.string().min(1),
    street: z.string().min(1),
    locality: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pinCode: z.string().min(4),
    country: z.string().default("India"),
    instructions: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  customerNotes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    // Critical Requirement: Server-side Store Availability & Schedule Check
    const availability = await getStoreAvailability();
    if (!availability.isOpen) {
      return NextResponse.json(
        {
          error: availability.closureMessage,
          code: "ORDERING_UNAVAILABLE",
          availability: {
            isOpen: false,
            status: availability.status,
            reason: availability.reason,
            scheduleMode: availability.scheduleMode,
            nextOpenTime: availability.nextOpenTime,
            openTime: availability.openTime,
            closeTime: availability.closeTime,
            timeZone: availability.timeZone,
          },
        },
        { status: 503 }
      );
    }

    // Rate limiting (max 15 order creation requests per minute per IP)
    const clientIp = getClientIp(req);
    const orderLimit = checkRateLimit(`order:ip:${clientIp}`, 15, 60 * 1000);
    if (!orderLimit.allowed) {
      return NextResponse.json(
        { error: "Too many order requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": orderLimit.retryAfterSeconds.toString() } }
      );
    }

    const body = await req.json();

    const result = OrderRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid order payload" },
        { status: 400 }
      );
    }

    const { items, addressSnapshot, customerNotes } = result.data;

    // Execute atomic transaction for validating prices, checking stock, reserving inventory, and creating order
    const createdOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const reqItem of items) {
        // Fetch variant fresh from database
        const variant = await tx.productVariant.findUnique({
          where: { id: reqItem.variantId },
          include: {
            product: true,
            pricingTiers: { orderBy: { minQty: "asc" } },
          },
        });

        if (!variant || !variant.isAvailable) {
          throw new Error(`Smartphone variant is no longer available.`);
        }

        const availableStock = variant.onHandStock - variant.reservedStock;
        if (reqItem.quantity > availableStock) {
          throw new Error(
            `Insufficient live stock for ${variant.product.name} (${variant.ramGb}GB/${variant.storageGb}GB). Available: ${availableStock}, Requested: ${reqItem.quantity}`
          );
        }

        if (reqItem.quantity < variant.minOrderQty) {
          throw new Error(
            `Minimum order quantity for ${variant.product.name} is ${variant.minOrderQty} units.`
          );
        }

        // Calculate unit price from tiers (Server-side ground truth)
        let unitPrice = variant.baseWholesalePrice;
        if (variant.pricingTiers && variant.pricingTiers.length > 0) {
          const sortedTiers = [...variant.pricingTiers].sort((a, b) => b.minQty - a.minQty);
          for (const tier of sortedTiers) {
            if (reqItem.quantity >= tier.minQty) {
              unitPrice = tier.unitPrice;
              break;
            }
          }
        }

        const lineTotal = unitPrice * reqItem.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          variantId: variant.id,
          productName: variant.product.name,
          variantName: `${variant.ramGb}GB RAM / ${variant.storageGb}GB - ${variant.colorName}`,
          sku: variant.sku,
          ramGb: variant.ramGb,
          storageGb: variant.storageGb,
          colorName: variant.colorName,
          quantity: reqItem.quantity,
          unitPrice,
          lineTotal,
        });
      }

      // Generate human-readable order number, e.g. "JM-2026-0042"
      const orderCount = await tx.order.count();
      const orderNumber = `JM-2026-${String(orderCount + 1).padStart(4, "0")}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: user.userId,
          status: "REQUESTED",
          subtotal,
          taxAmount: 0,
          deliveryFee: 0,
          totalAmount: subtotal,
          customerNotes: customerNotes || null,
          shippingAddressSnapshot: JSON.stringify(addressSnapshot),
          items: {
            create: orderItemsData,
          },
        },
      });

      // Create persistent Conversation for customer and dealer
      await tx.conversation.create({
        data: {
          orderId: newOrder.id,
          customerId: user.userId,
          messages: {
            create: [
              {
                senderId: user.userId,
                senderRole: "CUSTOMER",
                content: `Order request #${orderNumber} submitted for ${items.reduce(
                  (sum, i) => sum + i.quantity,
                  0
                )} units. Total: ₹${(subtotal / 100).toLocaleString("en-IN")}.${
                  customerNotes ? ` Note: ${customerNotes}` : ""
                }`,
              },
            ],
          },
        },
      });

      // Create initial audit log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "ORDER_REQUEST_SUBMITTED",
          entity: "Order",
          entityId: newOrder.id,
          detailsJson: JSON.stringify({
            orderNumber,
            totalAmount: subtotal,
            itemCount: items.length,
          }),
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        status: createdOrder.status,
        totalAmount: createdOrder.totalAmount,
      },
    });
  } catch (error: any) {
    console.error("Order request API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit wholesale order request" },
      { status: 400 }
    );
  }
}
