-- DropIndex
DROP INDEX IF EXISTS "user_career_paths_userId_key";

-- AlterTable: remove single unique, add composite unique
ALTER TABLE "user_career_paths" DROP CONSTRAINT IF EXISTS "user_career_paths_userId_key";
ALTER TABLE "user_career_paths" ADD CONSTRAINT "user_career_paths_userId_pathId_key" UNIQUE ("userId", "pathId");
