-- CreateTable
CREATE TABLE IF NOT EXISTS "StoreSchedule" (
    "id" TEXT NOT NULL,
    "acceptOrders" BOOLEAN NOT NULL DEFAULT true,
    "scheduleMode" TEXT NOT NULL DEFAULT 'FOLLOW_SCHEDULE',
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '23:00',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "closureMessage" TEXT NOT NULL DEFAULT 'Our ordering service is currently unavailable. Please check back during our service hours.',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "StoreSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoreSchedule_scheduleMode_idx" ON "StoreSchedule"("scheduleMode");
