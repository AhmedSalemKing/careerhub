-- Safe additive migration: add career AI fields to conversations table
-- Physical table: "conversations" (@@map in Prisma schema)
-- All columns are nullable or have defaults — no existing rows affected

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "report" JSONB;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "reportGeneratedAt" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "interviewStage" TEXT DEFAULT 'ORIENTATION';
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "evidenceLog" JSONB DEFAULT '[]';

-- Index for context-based lookups (career-interview sessions)
-- Follows existing naming convention: <table>_<column>_idx
CREATE INDEX IF NOT EXISTS "conversations_context_idx" ON "conversations"("context");
