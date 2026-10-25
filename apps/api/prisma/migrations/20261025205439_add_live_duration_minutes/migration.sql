-- AlterTable: store actual live session duration in minutes
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER NOT NULL DEFAULT 0;
