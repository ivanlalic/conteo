-- ============================================
-- CRITICAL SECURITY FIX
-- Enable RLS on custom_events and site_shares tables
-- Previously these tables were publicly accessible!
-- ============================================

-- ============================================
-- 1. FIX: custom_events table
-- ============================================

ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view events from their own sites
CREATE POLICY "Users can view custom events of their sites"
  ON custom_events FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Allow anonymous inserts (for tracking script)
-- API key validation happens in the API endpoint
CREATE POLICY "Allow anonymous custom event inserts"
  ON custom_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 2. FIX: site_shares table
-- ============================================

ALTER TABLE site_shares ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view shares of their own sites
CREATE POLICY "Users can view shares of their sites"
  ON site_shares FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can create shares for their own sites
CREATE POLICY "Users can create shares for their sites"
  ON site_shares FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can update shares of their own sites
CREATE POLICY "Users can update shares of their sites"
  ON site_shares FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can delete shares of their own sites
CREATE POLICY "Users can delete shares of their sites"
  ON site_shares FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Public can view public shares (for share page)
-- This allows the public share page to load without auth
CREATE POLICY "Anyone can view public shares"
  ON site_shares FOR SELECT
  USING (is_public = true);

-- ============================================
-- 3. Verify RLS is enabled
-- ============================================

DO $$
BEGIN
  -- Check custom_events
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'custom_events') THEN
    RAISE EXCEPTION 'RLS was not enabled on custom_events!';
  END IF;

  -- Check site_shares
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'site_shares') THEN
    RAISE EXCEPTION 'RLS was not enabled on site_shares!';
  END IF;

  RAISE NOTICE 'RLS successfully enabled on custom_events and site_shares tables';
END $$;
