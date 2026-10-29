-- Bring every deployed `consulting_sessions` table in line with the Prisma
-- schema. Every statement is idempotent so this is safe to run on production
-- even if some or all of the columns already exist.

ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "sessionName" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "topic" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "meetingType" TEXT DEFAULT 'daily';
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "meetingLink" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "meetingLinkExpiresAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID';
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'SAR';
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "proposedAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "proposedBy" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "consultantApproved" BOOLEAN DEFAULT false;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "userApproved" BOOLEAN DEFAULT true;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "dailyRoomName" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "dailyRoomUrl" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "actualDuration" INTEGER;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "completedBy" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "rescheduledFrom" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "originalScheduledAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Columns requested by the book/sessions UI. Kept nullable so legacy rows and
-- older clients that do not send them continue to work.
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "rescheduledBy" TEXT;

-- New bookings default to the approval flow.
ALTER TABLE "consulting_sessions" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';

-- Keep paid legacy rows consistent: a completed session was necessarily paid.
UPDATE "consulting_sessions"
SET "paymentStatus" = 'PAID'
WHERE "status" = 'COMPLETED' AND ("paymentStatus" IS NULL OR "paymentStatus" = 'UNPAID');

CREATE INDEX IF NOT EXISTS "consulting_sessions_dailyRoomName_idx" ON "consulting_sessions"("dailyRoomName");
CREATE INDEX IF NOT EXISTS "consulting_sessions_status_idx" ON "consulting_sessions"("status");
CREATE INDEX IF NOT EXISTS "consulting_sessions_consultantId_status_idx" ON "consulting_sessions"("consultantId", "status");
