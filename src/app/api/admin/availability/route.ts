import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, handleAuthError } from "@/lib/auth";
import {
  getStoreAvailability,
  updateStoreAvailabilitySettings,
  DEFAULT_STORE_AVAILABILITY_CONFIG,
  StoreAvailabilityConfig,
} from "@/lib/store-availability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const AvailabilityUpdateSchema = z.object({
  acceptOrders: z.boolean(),
  scheduleMode: z.enum(["FOLLOW_SCHEDULE", "FORCE_OPEN", "FORCE_CLOSED"]),
  openTime: z.string().regex(TimeRegex, "Opening time must be in HH:mm 24-hour format (e.g. 09:00)"),
  closeTime: z.string().regex(TimeRegex, "Closing time must be in HH:mm 24-hour format (e.g. 23:00)"),
  timeZone: z.string().default("Asia/Kolkata"),
  closureMessage: z
    .string()
    .trim()
    .min(5, "Closure message must be at least 5 characters")
    .max(300, "Closure message cannot exceed 300 characters"),
  expectedVersion: z.number().int().optional(),
});

export async function GET() {
  try {
    await requireOwner();

    let schedule = await prisma.storeSchedule.findUnique({
      where: { id: "default" },
    });

    if (!schedule) {
      schedule = await prisma.storeSchedule.create({
        data: {
          id: "default",
          acceptOrders: DEFAULT_STORE_AVAILABILITY_CONFIG.acceptOrders,
          scheduleMode: DEFAULT_STORE_AVAILABILITY_CONFIG.scheduleMode,
          openTime: DEFAULT_STORE_AVAILABILITY_CONFIG.openTime,
          closeTime: DEFAULT_STORE_AVAILABILITY_CONFIG.closeTime,
          timeZone: DEFAULT_STORE_AVAILABILITY_CONFIG.timeZone,
          closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
          version: 1,
        },
      });
    }

    const availability = await getStoreAvailability();

    const config: StoreAvailabilityConfig = {
      id: schedule.id,
      acceptOrders: schedule.acceptOrders,
      scheduleMode: schedule.scheduleMode as any,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      timeZone: schedule.timeZone,
      closureMessage: schedule.closureMessage,
      version: schedule.version,
      updatedAt: schedule.updatedAt,
      updatedBy: schedule.updatedBy,
    };

    return NextResponse.json({
      success: true,
      config,
      availability,
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("[GET /api/admin/availability] Error:", error);
    return NextResponse.json({ error: "Failed to load store availability configuration" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const body = await req.json();

    const parsed = AvailabilityUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid availability parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await updateStoreAvailabilitySettings(parsed.data, owner.userId);

    return NextResponse.json({
      success: true,
      message: "Store availability settings saved successfully",
      config: result.config,
      availability: result.availability,
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;

    if (error.message?.includes("CONCURRENCY_CONFLICT")) {
      return NextResponse.json(
        {
          error: "Settings were updated by another administrator. Please refresh and try again.",
          code: "CONCURRENCY_CONFLICT",
        },
        { status: 409 }
      );
    }

    console.error("[POST /api/admin/availability] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update store availability settings" },
      { status: 400 }
    );
  }
}
