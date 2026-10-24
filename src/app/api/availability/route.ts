import { NextResponse } from "next/server";
import { getStoreAvailability } from "@/lib/store-availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const availability = await getStoreAvailability();

    // Safe public response without internal administrator secrets or actor identifiers
    return NextResponse.json(
      {
        success: true,
        isOpen: availability.isOpen,
        status: availability.status,
        reason: availability.reason,
        scheduleMode: availability.scheduleMode,
        acceptOrders: availability.acceptOrders,
        openTime: availability.openTime,
        closeTime: availability.closeTime,
        timeZone: availability.timeZone,
        closureMessage: availability.closureMessage,
        nextOpenTime: availability.nextOpenTime,
        currentServerTimeIso: availability.currentServerTimeIso,
        currentTimeInZone: availability.currentTimeInZone,
        version: availability.version,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/availability] Error:", error);
    // Return fail-closed public response on failure
    return NextResponse.json(
      {
        success: false,
        isOpen: false,
        status: "CLOSED",
        reason: "Ordering temporarily unavailable",
        closureMessage: "Our ordering service is currently unavailable. Please check back during our service hours.",
        nextOpenTime: null,
      },
      { status: 503 }
    );
  }
}
