import { prisma } from "@/lib/prisma";

export type ScheduleMode = "FOLLOW_SCHEDULE" | "FORCE_OPEN" | "FORCE_CLOSED";
export type StoreStatus = "OPEN" | "CLOSED";

export interface StoreAvailabilityConfig {
  id?: string;
  acceptOrders: boolean;
  scheduleMode: ScheduleMode;
  openTime: string; // "HH:mm" in 24h format
  closeTime: string; // "HH:mm" in 24h format
  timeZone: string; // IANA timezone, default "Asia/Kolkata"
  closureMessage: string;
  version: number;
  updatedAt?: Date | string;
  updatedBy?: string | null;
}

export interface StoreAvailabilityResult {
  isOpen: boolean;
  status: StoreStatus;
  reason: string;
  scheduleMode: ScheduleMode;
  acceptOrders: boolean;
  openTime: string;
  closeTime: string;
  timeZone: string;
  closureMessage: string;
  currentServerTimeIso: string;
  currentTimeInZone: string;
  nextOpenTime: string | null;
  version: number;
}

export const DEFAULT_STORE_AVAILABILITY_CONFIG: StoreAvailabilityConfig = {
  acceptOrders: true,
  scheduleMode: "FOLLOW_SCHEDULE",
  openTime: "09:00",
  closeTime: "23:00",
  timeZone: "Asia/Kolkata",
  closureMessage:
    "Our ordering service is currently unavailable. Please check back during our service hours.",
  version: 1,
};

/**
 * Extracts date and time components in the specified IANA time zone using standard Intl API.
 */
export function getTimePartsInZone(date: Date, timeZone: string = "Asia/Kolkata") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const hour = parseInt(get("hour"), 10) % 24;
    const minute = parseInt(get("minute"), 10);
    const second = parseInt(get("second"), 10);
    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return {
      hour,
      minute,
      second,
      timeString,
      year: get("year"),
      month: get("month"),
      day: get("day"),
      weekday: get("weekday"),
    };
  } catch {
    // Fallback if timezone string is invalid
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return { hour, minute, second, timeString, year: "2026", month: "01", day: "01", weekday: "Mon" };
  }
}

/**
 * Formats a 24h time string ("09:00") into a readable 12h string ("09:00 AM IST").
 */
export function formatTime12h(time24: string, timeZone: string = "Asia/Kolkata"): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const zoneAbbrev = timeZone === "Asia/Kolkata" ? "IST" : timeZone;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period} ${zoneAbbrev}`;
}

/**
 * Evaluates store availability purely based on configuration and given authoritative timestamp.
 */
export function evaluateStoreAvailability(
  config: StoreAvailabilityConfig,
  now: Date = new Date()
): StoreAvailabilityResult {
  const timeZone = config.timeZone || "Asia/Kolkata";
  const timeParts = getTimePartsInZone(now, timeZone);
  const currentMinutes = timeParts.hour * 60 + timeParts.minute;

  const [openH, openM] = config.openTime.split(":").map((v) => parseInt(v, 10));
  const [closeH, closeM] = config.closeTime.split(":").map((v) => parseInt(v, 10));
  const openMinutes = (isNaN(openH) ? 9 : openH) * 60 + (isNaN(openM) ? 0 : openM);
  const closeMinutes = (isNaN(closeH) ? 23 : closeH) * 60 + (isNaN(closeM) ? 0 : closeM);

  const formattedOpenTime = formatTime12h(config.openTime, timeZone);
  const formattedCloseTime = formatTime12h(config.closeTime, timeZone);

  // 1. Manual Master Toggle: Accept Orders = OFF -> Force Closed immediately
  if (!config.acceptOrders) {
    return {
      isOpen: false,
      status: "CLOSED",
      reason: "Manual ordering disabled by administrator",
      scheduleMode: config.scheduleMode,
      acceptOrders: false,
      openTime: config.openTime,
      closeTime: config.closeTime,
      timeZone,
      closureMessage: config.closureMessage,
      currentServerTimeIso: now.toISOString(),
      currentTimeInZone: timeParts.timeString,
      nextOpenTime: null, // Do not promise a reopening time when manual closure is active
      version: config.version,
    };
  }

  // 2. Manual Override: FORCE_OPEN (Accept orders regardless of schedule)
  if (config.scheduleMode === "FORCE_OPEN") {
    return {
      isOpen: true,
      status: "OPEN",
      reason: "Manual override active: Force Open (Ordering permitted 24/7)",
      scheduleMode: "FORCE_OPEN",
      acceptOrders: true,
      openTime: config.openTime,
      closeTime: config.closeTime,
      timeZone,
      closureMessage: config.closureMessage,
      currentServerTimeIso: now.toISOString(),
      currentTimeInZone: timeParts.timeString,
      nextOpenTime: null,
      version: config.version,
    };
  }

  // 3. Manual Override: FORCE_CLOSED (Reject orders regardless of schedule)
  if (config.scheduleMode === "FORCE_CLOSED") {
    return {
      isOpen: false,
      status: "CLOSED",
      reason: "Manual override active: Force Closed by administrator",
      scheduleMode: "FORCE_CLOSED",
      acceptOrders: true,
      openTime: config.openTime,
      closeTime: config.closeTime,
      timeZone,
      closureMessage: config.closureMessage,
      currentServerTimeIso: now.toISOString(),
      currentTimeInZone: timeParts.timeString,
      nextOpenTime: null, // Do not promise reopening when Force Closed is active
      version: config.version,
    };
  }

  // 4. Automatic Schedule: FOLLOW_SCHEDULE
  let isWithinHours = false;

  if (closeMinutes > openMinutes) {
    // Normal daytime schedule (e.g. 09:00 to 23:00)
    // Inclusive of openTime (09:00), exclusive of closeTime (23:00)
    isWithinHours = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else if (closeMinutes < openMinutes) {
    // Overnight schedule (e.g. 20:00 to 04:00)
    isWithinHours = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  } else {
    // Equal open and close time -> interpret as 24-hour service
    isWithinHours = true;
  }

  if (isWithinHours) {
    return {
      isOpen: true,
      status: "OPEN",
      reason: `Within scheduled service hours (${formattedOpenTime} to ${formattedCloseTime})`,
      scheduleMode: "FOLLOW_SCHEDULE",
      acceptOrders: true,
      openTime: config.openTime,
      closeTime: config.closeTime,
      timeZone,
      closureMessage: config.closureMessage,
      currentServerTimeIso: now.toISOString(),
      currentTimeInZone: timeParts.timeString,
      nextOpenTime: null,
      version: config.version,
    };
  }

  // Outside scheduled hours: Calculate reliable next opening time
  let nextOpenDescription: string | null = null;
  if (closeMinutes > openMinutes) {
    if (currentMinutes < openMinutes) {
      nextOpenDescription = `Today at ${formattedOpenTime}`;
    } else {
      nextOpenDescription = `Tomorrow at ${formattedOpenTime}`;
    }
  } else {
    // Overnight schedule closed window
    nextOpenDescription = `Today at ${formattedOpenTime}`;
  }

  return {
    isOpen: false,
    status: "CLOSED",
    reason: `Outside scheduled service hours (${formattedOpenTime} to ${formattedCloseTime})`,
    scheduleMode: "FOLLOW_SCHEDULE",
    acceptOrders: true,
    openTime: config.openTime,
    closeTime: config.closeTime,
    timeZone,
    closureMessage: config.closureMessage,
    currentServerTimeIso: now.toISOString(),
    currentTimeInZone: timeParts.timeString,
    nextOpenTime: nextOpenDescription,
    version: config.version,
  };
}

/**
 * Loads current StoreSchedule from PostgreSQL database, evaluating effective state at `now`.
 * Fails closed if an unrecoverable database or operational error occurs.
 */
export async function getStoreAvailability(now: Date = new Date()): Promise<StoreAvailabilityResult> {
  try {
    let schedule = await prisma.storeSchedule.findUnique({
      where: { id: "default" },
    });

    if (!schedule) {
      // Auto-initialize default schedule record
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

    const config: StoreAvailabilityConfig = {
      id: schedule.id,
      acceptOrders: schedule.acceptOrders,
      scheduleMode: schedule.scheduleMode as ScheduleMode,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      timeZone: schedule.timeZone,
      closureMessage: schedule.closureMessage,
      version: schedule.version,
      updatedAt: schedule.updatedAt,
      updatedBy: schedule.updatedBy,
    };

    return evaluateStoreAvailability(config, now);
  } catch (error) {
    console.error("[StoreAvailability] Database lookup failure. Failing closed for order safety:", error);
    // FAIL CLOSED: Never accidentally accept orders if settings cannot be loaded
    return {
      isOpen: false,
      status: "CLOSED",
      reason: "Store ordering service temporarily unavailable (Safety evaluation fallback)",
      scheduleMode: "FORCE_CLOSED",
      acceptOrders: false,
      openTime: DEFAULT_STORE_AVAILABILITY_CONFIG.openTime,
      closeTime: DEFAULT_STORE_AVAILABILITY_CONFIG.closeTime,
      timeZone: DEFAULT_STORE_AVAILABILITY_CONFIG.timeZone,
      closureMessage: DEFAULT_STORE_AVAILABILITY_CONFIG.closureMessage,
      currentServerTimeIso: now.toISOString(),
      currentTimeInZone: "00:00",
      nextOpenTime: null,
      version: 0,
    };
  }
}

/**
 * Updates store availability settings persistently inside a transaction with concurrency & audit logging.
 */
export async function updateStoreAvailabilitySettings(
  input: {
    acceptOrders: boolean;
    scheduleMode: ScheduleMode;
    openTime: string;
    closeTime: string;
    timeZone?: string;
    closureMessage: string;
    expectedVersion?: number;
  },
  adminUserId: string
): Promise<{ success: boolean; config: StoreAvailabilityConfig; availability: StoreAvailabilityResult }> {
  const timeZone = input.timeZone || "Asia/Kolkata";

  return prisma.$transaction(async (tx) => {
    const current = await tx.storeSchedule.findUnique({
      where: { id: "default" },
    });

    if (current && input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new Error("CONCURRENCY_CONFLICT: Settings were modified by another administrator. Please refresh.");
    }

    const nextVersion = (current?.version || 1) + 1;

    const updated = await tx.storeSchedule.upsert({
      where: { id: "default" },
      update: {
        acceptOrders: input.acceptOrders,
        scheduleMode: input.scheduleMode,
        openTime: input.openTime,
        closeTime: input.closeTime,
        timeZone,
        closureMessage: input.closureMessage,
        version: nextVersion,
        updatedBy: adminUserId,
      },
      create: {
        id: "default",
        acceptOrders: input.acceptOrders,
        scheduleMode: input.scheduleMode,
        openTime: input.openTime,
        closeTime: input.closeTime,
        timeZone,
        closureMessage: input.closureMessage,
        version: 1,
        updatedBy: adminUserId,
      },
    });

    // Record persistent AuditLog
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "STORE_AVAILABILITY_UPDATED",
        entity: "StoreSchedule",
        entityId: "default",
        detailsJson: JSON.stringify({
          previousMode: current?.scheduleMode,
          newMode: updated.scheduleMode,
          acceptOrders: updated.acceptOrders,
          openTime: updated.openTime,
          closeTime: updated.closeTime,
          timeZone: updated.timeZone,
          version: updated.version,
        }),
      },
    });

    const config: StoreAvailabilityConfig = {
      id: updated.id,
      acceptOrders: updated.acceptOrders,
      scheduleMode: updated.scheduleMode as ScheduleMode,
      openTime: updated.openTime,
      closeTime: updated.closeTime,
      timeZone: updated.timeZone,
      closureMessage: updated.closureMessage,
      version: updated.version,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    };

    const availability = evaluateStoreAvailability(config);

    return {
      success: true,
      config,
      availability,
    };
  });
}
