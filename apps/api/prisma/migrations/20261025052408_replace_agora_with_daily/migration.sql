-- AlterTable: make channelName optional and add Daily.co fields to LiveSession
ALTER TABLE "LiveSession" ALTER COLUMN "channelName" DROP NOT NULL;
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "isLive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "dailyRoomName" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "dailyRoomUrl" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "recordingUrl" TEXT;
