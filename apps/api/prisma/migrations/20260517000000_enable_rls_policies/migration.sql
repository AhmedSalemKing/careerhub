-- Enable Row Level Security (RLS) on all public tables and add policies.
--
-- Context: this project's API accesses Postgres exclusively through Prisma using
-- a direct (owner/service) connection, which bypasses RLS. No frontend uses the
-- Supabase client, so `anon` and `authenticated` PostgREST access is not part of
-- any working flow. These policies therefore harden direct database exposure
-- without changing API/Prisma behaviour:
--   * every table gets RLS enabled and a default-deny posture for anon/auth
--   * `service_role` is explicitly granted full access on every table
--   * authenticated users may read public catalog tables
--   * authenticated users may read/write rows they own (user_id = auth.uid())
--
-- NOTE: `users.id` in this schema is a cuid TEXT, not a Supabase auth UUID, so
-- `auth.uid()::text` will only match when Supabase Auth is adopted. The policies
-- are written to be safe (no functional impact) until then.

-- ============================================================================
-- 1. Enable RLS on every existing table in the public schema
-- ============================================================================
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- 2. service_role: full access on every table
--    (service_role already bypasses RLS, but policies are added explicitly so
--     the grant is visible and survives future role/config changes)
-- ============================================================================
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t.tablename
        AND policyname = 'service_role_all_' || t.tablename
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
        'service_role_all_' || t.tablename,
        t.tablename
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 3. Public catalog tables: authenticated users may read
-- ============================================================================
DO $$
DECLARE
  tbl text;
  public_tables text[] := ARRAY[
    'courses',
    'Course',
    'CourseBundle',
    'BundleCourse',
    'categories',
    'career_paths',
    'coaches',
    'coaching_slots',
    'sections',
    'course_modules',
    'lessons',
    'video_content',
    'quiz_tests',
    'quiz_test_questions',
    'quiz_test_choices',
    'ratings',
    'coach_reviews',
    'site_settings',
    'site_setting'
  ];
BEGIN
  FOREACH tbl IN ARRAY public_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
        AND policyname = 'authenticated_read_' || tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true);',
        'authenticated_read_' || tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 4. User-owned tables: authenticated users may read/write only their own rows
--    Ownership column is `user_id`; compared as text since ids are cuids.
-- ============================================================================
DO $$
DECLARE
  tbl text;
  owned_tables text[] := ARRAY[
    'user_profiles',
    'sessions',
    'password_reset_tokens',
    'career_assessments',
    'assessment_sessions',
    'quiz_test_attempts',
    'enrollments',
    'lesson_progress',
    'certificates',
    'coaching_sessions',
    'coaching_credits',
    'payments',
    'notifications',
    'uploaded_files',
    'device_tokens',
    'analytics_events',
    'file_shares',
    'Subscription',
    'user_career_paths',
    'consulting_sessions',
    'conversations',
    'ai_messages',
    'user_activities',
    'carts',
    'cart_items',
    'wallet_transactions'
  ];
  owner_col text;
BEGIN
  FOREACH tbl IN ARRAY owned_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      CONTINUE;
    END IF;

    -- Resolve the ownership column generically.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) THEN
      owner_col := 'user_id';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'userId'
    ) THEN
      owner_col := 'userId';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'studentId'
    ) THEN
      owner_col := 'studentId';
    ELSE
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
        AND policyname = 'owner_select_' || tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%I = auth.uid()::text);',
        'owner_select_' || tbl, tbl, owner_col
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%I = auth.uid()::text);',
        'owner_insert_' || tbl, tbl, owner_col
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%I = auth.uid()::text) WITH CHECK (%I = auth.uid()::text);',
        'owner_update_' || tbl, tbl, owner_col, owner_col
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%I = auth.uid()::text);',
        'owner_delete_' || tbl, tbl, owner_col
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 5. chat_messages: participants (sender or receiver) may read their messages
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages'
      AND policyname = 'participant_select_chat_messages'
  ) THEN
    CREATE POLICY participant_select_chat_messages ON public.chat_messages
      FOR SELECT TO authenticated
      USING ("senderId" = auth.uid()::text OR "receiverId" = auth.uid()::text);

    CREATE POLICY participant_insert_chat_messages ON public.chat_messages
      FOR INSERT TO authenticated
      WITH CHECK ("senderId" = auth.uid()::text);
  END IF;
END $$;

-- ============================================================================
-- 6. courses (instructor-owned writes) and Course (Prisma default name)
--    Authenticated instructors may manage only the courses they own.
--    (course name has no @@map, so the table is "Course")
-- ============================================================================
DO $$
DECLARE
  tbl text;
  course_tables text[] := ARRAY['Course', 'courses'];
BEGIN
  FOREACH tbl IN ARRAY course_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'instructorId'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
        AND policyname = 'instructor_manage_' || tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ("instructorId" = auth.uid()::text) WITH CHECK ("instructorId" = auth.uid()::text);',
        'instructor_manage_' || tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 7. Admin/audit/log tables: no anon/authenticated access at all.
--    Only service_role policies (created in step 2) apply, which is exactly
--    the default-deny posture required. RLS stays enabled with no client policy.
--    (admin_logs, audit_logs, security_logs, assessment_questions)
-- ============================================================================
