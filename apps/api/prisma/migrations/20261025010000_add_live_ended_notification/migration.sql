-- Live session notifications.
--
-- The values were added to schema.prisma with `prisma db push` at some point,
-- but no migration ever applied them to databases created from migrations.
-- IF NOT EXISTS makes this safe on databases where db push already added them.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LIVE_STARTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LIVE_ENDED';
