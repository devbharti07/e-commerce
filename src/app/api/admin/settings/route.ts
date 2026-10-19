import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

const SettingsUpdateSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

export async function GET() {
  try {
    await requireOwner();
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap, raw: settings });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const parsed = SettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const { settings } = parsed.data;

    // Disallow arbitrary or dangerous keys
    const allowedKeys = [
      "BUSINESS_NAME",
      "CONTACT_PHONE",
      "CONTACT_EMAIL",
      "STORE_ADDRESS",
      "WHOLESALE_TERMS",
      "MIN_ORDER_VALUE",
      "DELIVERY_INFO",
      "ORDERING_INSTRUCTIONS",
      "ANNOUNCEMENT_BANNER",
      "ANNOUNCEMENT_ACTIVE",
      "SEO_TITLE",
      "SEO_DESCRIPTION",
      "LOW_STOCK_THRESHOLD_DEFAULT",
      "MAINTENANCE_MODE",
    ];

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(settings)) {
        if (!allowedKeys.includes(key)) continue;

        await tx.siteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: {
            key,
            value: String(value),
            isPublic: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: owner.userId,
          action: "WEBSITE_SETTINGS_UPDATED",
          entity: "SiteSetting",
          entityId: "BULK_UPDATE",
          detailsJson: JSON.stringify(settings),
        },
      });
    });

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("Settings save error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 400 });
  }
}
