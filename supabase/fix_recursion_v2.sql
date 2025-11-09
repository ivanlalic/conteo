-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES V2
-- Use public schema instead of auth schema
-- ============================================

-- ============================================
-- 1. CREATE HELPER FUNCTION IN PUBLIC SCHEMA
-- ============================================
CREATE OR REPLACE FUNCTION public.user_site_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.sites WHERE user_id = user_uuid;
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.user_site_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_site_ids(UUID) TO anon;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================

-- Sites
DROP POLICY IF EXISTS "Users can view their own sites" ON sites;
DROP POLICY IF EXISTS "Users can insert their own sites" ON sites;
DROP POLICY IF EXISTS "Users can update their own sites" ON sites;
DROP POLICY IF EXISTS "Users can delete their own sites" ON sites;

-- Pageviews
DROP POLICY IF EXISTS "Users can view pageviews of their sites" ON pageviews;
DROP POLICY IF EXISTS "Allow anonymous pageview inserts" ON pageviews;

-- COD Conversions
DROP POLICY IF EXISTS "Users can view COD conversions of their sites" ON cod_conversions;
DROP POLICY IF EXISTS "Allow anonymous COD conversion inserts" ON cod_conversions;
DROP POLICY IF EXISTS "Allow anonymous COD conversion updates" ON cod_conversions;

-- Custom Events
DROP POLICY IF EXISTS "Users can view custom events of their sites" ON custom_events;
DROP POLICY IF EXISTS "Allow anonymous custom event inserts" ON custom_events;

-- Site Shares
DROP POLICY IF EXISTS "Users can view shares of their sites" ON site_shares;
DROP POLICY IF EXISTS "Users can create shares for their sites" ON site_shares;
DROP POLICY IF EXISTS "Users can update shares of their sites" ON site_shares;
DROP POLICY IF EXISTS "Users can delete shares of their sites" ON site_shares;
DROP POLICY IF EXISTS "Anyone can view public shares" ON site_shares;

-- ============================================
-- 3. RECREATE SITES POLICIES (NO RECURSION)
-- ============================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sites"
  ON sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sites"
  ON sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites"
  ON sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites"
  ON sites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. RECREATE PAGEVIEWS POLICIES (USING HELPER)
-- ============================================
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pageviews of their sites"
  ON pageviews FOR SELECT
  USING (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Allow anonymous pageview inserts"
  ON pageviews FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. RECREATE COD CONVERSION POLICIES (USING HELPER)
-- ============================================
ALTER TABLE cod_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view COD conversions of their sites"
  ON cod_conversions FOR SELECT
  USING (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Allow anonymous COD conversion inserts"
  ON cod_conversions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous COD conversion updates"
  ON cod_conversions FOR UPDATE
  USING (true);

-- ============================================
-- 6. RECREATE CUSTOM EVENTS POLICIES (USING HELPER)
-- ============================================
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom events of their sites"
  ON custom_events FOR SELECT
  USING (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Allow anonymous custom event inserts"
  ON custom_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 7. RECREATE SITE SHARES POLICIES (USING HELPER)
-- ============================================
ALTER TABLE site_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares of their sites"
  ON site_shares FOR SELECT
  USING (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Users can create shares for their sites"
  ON site_shares FOR INSERT
  WITH CHECK (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Users can update shares of their sites"
  ON site_shares FOR UPDATE
  USING (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Users can delete shares of their sites"
  ON site_shares FOR DELETE
  USING (site_id IN (SELECT public.user_site_ids(auth.uid())));

CREATE POLICY "Anyone can view public shares"
  ON site_shares FOR SELECT
  USING (is_public = true);

-- ============================================
-- 8. VERIFICATION
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
  func_exists BOOLEAN;
BEGIN
  -- Check if helper function was created
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'user_site_ids'
  ) INTO func_exists;

  IF NOT func_exists THEN
    RAISE EXCEPTION 'Helper function public.user_site_ids was not created!';
  END IF;
  RAISE NOTICE 'Helper function public.user_site_ids exists ✓';

  -- Verify sites policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'sites';
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Sites table missing policies! Found: %', policy_count;
  END IF;
  RAISE NOTICE 'Sites policies: % ✓', policy_count;

  -- Verify pageviews policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'pageviews';
  IF policy_count < 2 THEN
    RAISE EXCEPTION 'Pageviews table missing policies! Found: %', policy_count;
  END IF;
  RAISE NOTICE 'Pageviews policies: % ✓', policy_count;

  -- Verify custom_events policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'custom_events';
  IF policy_count < 2 THEN
    RAISE EXCEPTION 'Custom events table missing policies! Found: %', policy_count;
  END IF;
  RAISE NOTICE 'Custom events policies: % ✓', policy_count;

  -- Verify site_shares policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'site_shares';
  IF policy_count < 5 THEN
    RAISE EXCEPTION 'Site shares table missing policies! Found: %', policy_count;
  END IF;
  RAISE NOTICE 'Site shares policies: % ✓', policy_count;

  RAISE NOTICE '✅ All RLS policies fixed successfully! No more infinite recursion.';
END $$;
