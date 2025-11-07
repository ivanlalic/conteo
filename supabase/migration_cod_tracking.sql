-- Migration: Add COD (Cash on Delivery) Conversion Tracking
-- Date: 2025-11-07
-- Description: Adds COD tracking functionality including pixel event interception for Facebook & TikTok

-- ============================================
-- 1. Add cod_tracking_enabled to sites table
-- ============================================

ALTER TABLE sites ADD COLUMN IF NOT EXISTS cod_tracking_enabled BOOLEAN DEFAULT false;

-- ============================================
-- 2. Create cod_conversions table
-- ============================================

CREATE TABLE IF NOT EXISTS cod_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,

  -- Product info (from pixel events)
  product_id TEXT,
  product_name TEXT,
  product_page TEXT, -- /products/xxx

  -- Conversion funnel
  viewed_product BOOLEAN DEFAULT false,
  opened_form BOOLEAN DEFAULT false, -- InitiateCheckout
  purchased BOOLEAN DEFAULT false,   -- Purchase

  -- Purchase details
  value NUMERIC,
  currency TEXT,

  -- Attribution
  source TEXT, -- Facebook, Google, TikTok, Direct

  -- Timestamps
  product_view_at TIMESTAMPTZ,
  form_opened_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint to prevent duplicate visitor records per site
  UNIQUE(visitor_id, site_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cod_conversions_site_id ON cod_conversions(site_id);
CREATE INDEX IF NOT EXISTS idx_cod_conversions_created_at ON cod_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_cod_conversions_source ON cod_conversions(source);

-- ============================================
-- 3. Enable RLS on cod_conversions
-- ============================================

ALTER TABLE cod_conversions ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view COD conversions of their sites" ON cod_conversions;
DROP POLICY IF EXISTS "Allow anonymous COD conversion inserts" ON cod_conversions;
DROP POLICY IF EXISTS "Allow anonymous COD conversion updates" ON cod_conversions;

-- Policy: Users can view their own sites' COD conversions
CREATE POLICY "Users can view COD conversions of their sites"
  ON cod_conversions FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow anonymous inserts (from tracker.js)
CREATE POLICY "Allow anonymous COD conversion inserts"
  ON cod_conversions FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anonymous updates (for updating funnel progression)
CREATE POLICY "Allow anonymous COD conversion updates"
  ON cod_conversions FOR UPDATE
  USING (true);

-- ============================================
-- 4. Create analytics function
-- ============================================

CREATE OR REPLACE FUNCTION get_cod_conversions(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  product_name TEXT,
  source TEXT,
  views BIGINT,
  forms BIGINT,
  purchases BIGINT,
  revenue NUMERIC
) AS $$
  SELECT
    COALESCE(product_name, 'Unknown') as product_name,
    COALESCE(source, 'Direct') as source,
    COUNT(*) FILTER (WHERE viewed_product = true) as views,
    COUNT(*) FILTER (WHERE opened_form = true) as forms,
    COUNT(*) FILTER (WHERE purchased = true) as purchases,
    SUM(value) FILTER (WHERE purchased = true) as revenue
  FROM cod_conversions
  WHERE site_id = site_uuid
    AND created_at >= start_date
    AND created_at <= end_date
  GROUP BY product_name, source
  ORDER BY revenue DESC NULLS LAST, purchases DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 5. Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION get_cod_conversions(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_cod_conversions(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ============================================
-- Migration Complete
-- ============================================

-- To apply this migration:
-- 1. Copy this file content
-- 2. Go to your Supabase project dashboard
-- 3. Navigate to SQL Editor
-- 4. Paste and run this SQL
-- 5. Verify tables and policies were created successfully
