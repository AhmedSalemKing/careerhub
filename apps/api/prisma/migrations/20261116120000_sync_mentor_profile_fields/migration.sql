-- Registration stored bio and years of experience only on users, while mentor listings read user_profiles.
-- Backfill the profile copy (and the reverse for rows edited via settings).
UPDATE "user_profiles" p SET "bio" = u."bio" FROM "users" u WHERE p."userId" = u."id" AND u."bio" IS NOT NULL AND (p."bio" IS NULL OR p."bio" = '');
UPDATE "user_profiles" p SET "yearsExperience" = u."experience" FROM "users" u WHERE p."userId" = u."id" AND u."experience" IS NOT NULL AND p."yearsExperience" IS NULL;
UPDATE "users" u SET "bio" = p."bio" FROM "user_profiles" p WHERE p."userId" = u."id" AND p."bio" IS NOT NULL AND p."bio" <> '' AND (u."bio" IS NULL OR u."bio" = '');
UPDATE "users" u SET "experience" = p."yearsExperience" FROM "user_profiles" p WHERE p."userId" = u."id" AND p."yearsExperience" IS NOT NULL AND u."experience" IS NULL;
