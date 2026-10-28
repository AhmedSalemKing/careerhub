-- Add dailyRoomName to consulting_sessions
-- Stores the Daily.co room name so meeting.ended webhooks can find the session.
ALTER TABLE "consulting_sessions" ADD COLUMN "dailyRoomName" TEXT;
