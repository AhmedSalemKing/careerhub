-- AlterTable
ALTER TABLE "career_assessments" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '7 days');
