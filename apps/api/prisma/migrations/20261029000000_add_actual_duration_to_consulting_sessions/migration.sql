-- Add actualDuration to consulting_sessions
-- Stores the real call duration in minutes set by the consultant when completing a session.
-- Falls back to `duration` (scheduled slot) when null.
ALTER TABLE "consulting_sessions" ADD COLUMN "actualDuration" INTEGER;
