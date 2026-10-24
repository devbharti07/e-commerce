-- AlterTable: Make phone optional in OtpVerification to support Email OTP
ALTER TABLE "OtpVerification" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OtpVerification_email_isConsumed_idx" ON "OtpVerification"("email", "isConsumed");
