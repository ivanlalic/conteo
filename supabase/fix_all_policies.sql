-- ============================================
-- FIX ALL RLS POLICIES
-- Restore all Row Level Security policies to working state
-- ============================================

-- ============================================
-- 1. SITES TABLE
-- ============================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sites" ON sites;
DROP POLICY IF EXISTS "Users can insert their own sites" ON sites;
DROP POLICY IF EXISTS "Users can update their own sites" ON sites;
DROP POLICY IF EXISTS "Users can delete their own sites" ON sites;

-- Recreate policies
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
-- 2. PAGEVIEWS TABLE
-- ============================================
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view pageviews of their sites" ON pageviews;
DROP POLICY IF EXISTS "Allow anonymous pageview inserts" ON pageviews;

-- Recreate policies
CREATE POLICY "Users can view pageviews of their sites"
  ON pageviews FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous pageview inserts"
  ON pageviews FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 3. COD CONVERSIONS TABLE
-- ============================================
ALTER TABLE cod_conversions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view COD conversions of their sites" ON cod_conversions;
DROP POLICY IF EXISTS "Allow anonymous COD conversion inserts" ON cod_conversions;
DROP POLICY IF EXISTS "Allow anonymous COD conversion updates" ON cod_conversions;

-- Recreate policies
CREATE POLICY "Users can view COD conversions of their sites"
  ON cod_conversions FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous COD conversion inserts"
  ON cod_conversions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous COD conversion updates"
  ON cod_conversions FOR UPDATE
  USING (true);

-- ============================================
-- 4. CUSTOM EVENTS TABLE
-- ============================================
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view custom events of their sites" ON custom_events;
DROP POLICY IF EXISTS "Allow anonymous custom event inserts" ON custom_events;

-- Recreate policies
CREATE POLICY "Users can view custom events of their sites"
  ON custom_events FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous custom event inserts"
  ON custom_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. SITE SHARES TABLE
-- ============================================
ALTER TABLE site_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view shares of their sites" ON site_shares;
DROP POLICY IF EXISTS "Users can create shares for their sites" ON site_shares;
DROP POLICY IF EXISTS "Users can update shares of their sites" ON site_shares;
DROP POLICY IF EXISTS "Users can delete shares of their sites" ON site_shares;
DROP POLICY IF EXISTS "Anyone can view public shares" ON site_shares;

-- Recreate policies
CREATE POLICY "Users can view shares of their sites"
  ON site_shares FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their sites"
  ON site_shares FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shares of their sites"
  ON site_shares FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares of their sites"
  ON site_shares FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view public shares"
  ON site_shares FOR SELECT
  USING (is_public = true);

-- ============================================
-- 6. USER PLANS TABLE (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_plans'
  ) THEN
    ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own plan" ON user_plans;
    DROP POLICY IF EXISTS "Users can insert their own plan" ON user_plans;
    DROP POLICY IF EXISTS "Users can update their own plan" ON user_plans;

    -- Recreate policies
    EXECUTE 'CREATE POLICY "Users can view their own plan"
      ON user_plans FOR SELECT
      USING (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can insert their own plan"
      ON user_plans FOR INSERT
      WITH CHECK (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own plan"
      ON user_plans FOR UPDATE
      USING (auth.uid() = user_id)';

    RAISE NOTICE 'User plans policies restored';
  ELSE
    RAISE NOTICE 'User plans table does not exist, skipping';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count policies on sites
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'sites';
  RAISE NOTICE 'Sites policies: %', policy_count;

  -- Count policies on pageviews
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'pageviews';
  RAISE NOTICE 'Pageviews policies: %', policy_count;

  -- Count policies on custom_events
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'custom_events';
  RAISE NOTICE 'Custom events policies: %', policy_count;

  -- Count policies on site_shares
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'site_shares';
  RAISE NOTICE 'Site shares policies: %', policy_count;

  RAISE NOTICE 'All RLS policies have been restored!';
END $$;
