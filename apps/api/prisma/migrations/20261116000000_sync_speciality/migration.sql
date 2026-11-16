-- Registration stored speciality only on users, while coaching/profile pages read user_profiles.
-- Backfill the profile copy (and the reverse for rows edited via settings).
UPDATE "user_profiles" p
SET "speciality" = u."speciality"
FROM "users" u
WHERE p."userId" = u."id"
  AND u."speciality" IS NOT NULL
  AND (p."speciality" IS NULL OR p."speciality" = '');

UPDATE "users" u
SET "speciality" = p."speciality"
FROM "user_profiles" p
WHERE p."userId" = u."id"
  AND p."speciality" IS NOT NULL
  AND (u."speciality" IS NULL OR u."speciality" = '');
