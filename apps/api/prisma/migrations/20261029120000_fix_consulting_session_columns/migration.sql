-- Add missing columns to consulting_sessions to match the Prisma schema
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "dailyRoomUrl" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "originalScheduledAt" TIMESTAMP(3);
ALTER TABLE "consulting_sessions" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add an index for looking up sessions by Daily.co room name
CREATE INDEX IF NOT EXISTS "consulting_sessions_dailyRoomName_idx" ON "consulting_sessions"("dailyRoomName");

-- Ensure existing rows with legacy status values remain readable;
-- the application will transition them to the new status strings as needed.
