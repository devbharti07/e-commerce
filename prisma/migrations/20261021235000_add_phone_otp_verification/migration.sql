-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OtpVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "email" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resendAfter" TIMESTAMP(3) NOT NULL,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" TIMESTAMP(3),
    "verificationToken" TEXT,
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OtpVerification_verificationToken_key" ON "OtpVerification"("verificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OtpVerification_phone_isConsumed_idx" ON "OtpVerification"("phone", "isConsumed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OtpVerification_verificationToken_idx" ON "OtpVerification"("verificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OtpVerification_createdAt_idx" ON "OtpVerification"("createdAt");
