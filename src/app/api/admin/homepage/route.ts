import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const UpdateHomepageSchema = z.object({
  announcementBanner: z.string().optional(),
  announcementActive: z.boolean().optional(),
  deliveryInfo: z.string().optional(),
  orderingInstructions: z.string().optional(),
  productOrder: z
    .array(
      z.object({
        productId: z.string(),
        isFeatured: z.boolean(),
        displayOrder: z.number().int(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    await requireOwner();

    const [products, settings] = await Promise.all([
      prisma.product.findMany({
        where: { isArchived: false },
        include: { brand: true },
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
      }),
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              "ANNOUNCEMENT_BANNER",
              "ANNOUNCEMENT_ACTIVE",
              "DELIVERY_INFO",
              "ORDERING_INSTRUCTIONS",
            ],
          },
        },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      products,
      settings: settingsMap,
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch homepage config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const parsed = UpdateHomepageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid homepage update data" }, { status: 400 });
    }

    const {
      announcementBanner,
      announcementActive,
      deliveryInfo,
      orderingInstructions,
      productOrder,
    } = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (announcementBanner !== undefined) {
        await tx.siteSetting.upsert({
          where: { key: "ANNOUNCEMENT_BANNER" },
          update: { value: announcementBanner },
          create: { key: "ANNOUNCEMENT_BANNER", value: announcementBanner, isPublic: true },
        });
      }

      if (announcementActive !== undefined) {
        await tx.siteSetting.upsert({
          where: { key: "ANNOUNCEMENT_ACTIVE" },
          update: { value: announcementActive ? "true" : "false" },
          create: {
            key: "ANNOUNCEMENT_ACTIVE",
            value: announcementActive ? "true" : "false",
            isPublic: true,
          },
        });
      }

      if (deliveryInfo !== undefined) {
        await tx.siteSetting.upsert({
          where: { key: "DELIVERY_INFO" },
          update: { value: deliveryInfo },
          create: { key: "DELIVERY_INFO", value: deliveryInfo, isPublic: true },
        });
      }

      if (orderingInstructions !== undefined) {
        await tx.siteSetting.upsert({
          where: { key: "ORDERING_INSTRUCTIONS" },
          update: { value: orderingInstructions },
          create: { key: "ORDERING_INSTRUCTIONS", value: orderingInstructions, isPublic: true },
        });
      }

      if (productOrder && productOrder.length > 0) {
        for (const item of productOrder) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              isFeatured: item.isFeatured,
              displayOrder: item.displayOrder,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "HOMEPAGE_CONFIG_UPDATED",
          entity: "Homepage",
          entityId: "HOMEPAGE",
          detailsJson: JSON.stringify(body),
        },
      });
    });

    return NextResponse.json({ success: true, message: "Homepage configuration updated!" });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: error.message || "Failed to update homepage" }, { status: 400 });
  }
}
