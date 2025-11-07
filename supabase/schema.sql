-- ============================================
-- CONTEO.ONLINE - Analytics Database Schema
-- Optimized for fast queries and MVP features
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SITES TABLE
-- Stores user's websites to track
-- ============================================
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  api_key UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_sites_api_key ON sites(api_key);

-- ============================================
-- SITE SHARES TABLE
-- For public dashboard sharing feature
-- ============================================
CREATE TABLE site_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX idx_site_shares_token ON site_shares(share_token);
CREATE INDEX idx_site_shares_site_id ON site_shares(site_id);

-- ============================================
-- PAGEVIEWS TABLE
-- Stores every page visit (the core data!)
-- ============================================
CREATE TABLE pageviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Visitor tracking
  visitor_id TEXT NOT NULL, -- Hash of IP + User Agent for unique visitors

  -- Page info
  path TEXT NOT NULL,
  referrer TEXT,

  -- Browser/Device info
  user_agent TEXT,
  browser TEXT,
  device TEXT,
  os TEXT,

  -- Location (optional for MVP, but good to have)
  country TEXT,
  city TEXT,
  region TEXT,

  -- UTM Parameters (for campaign tracking)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CRITICAL INDEXES FOR FAST ANALYTICS QUERIES
-- These make or break performance!
-- ============================================

-- For general site queries (most common)
CREATE INDEX idx_pageviews_site_timestamp ON pageviews(site_id, timestamp DESC);

-- For "live users" (last 5 minutes)
CREATE INDEX idx_pageviews_timestamp ON pageviews(timestamp DESC);

-- For "top pages" queries
CREATE INDEX idx_pageviews_site_path ON pageviews(site_id, path);

-- For "referrers" queries
CREATE INDEX idx_pageviews_site_referrer ON pageviews(site_id, referrer)
  WHERE referrer IS NOT NULL AND referrer != '';

-- For unique visitor counts
CREATE INDEX idx_pageviews_visitor ON pageviews(site_id, visitor_id, timestamp DESC);

-- For UTM campaign queries
CREATE INDEX idx_pageviews_utm_campaign ON pageviews(site_id, utm_campaign, timestamp DESC)
  WHERE utm_campaign IS NOT NULL AND utm_campaign != '';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own data
-- ============================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

-- Sites policies: users can only access their own sites
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

-- Pageviews policies: users can only view pageviews of their sites
CREATE POLICY "Users can view pageviews of their sites"
  ON pageviews FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Special policy: Allow anonymous inserts via API key (for tracking script)
-- We'll handle API key validation in the API endpoint
CREATE POLICY "Allow anonymous pageview inserts"
  ON pageviews FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS FOR ANALYTICS
-- ============================================

-- Function to get live users count (last 5 minutes)
CREATE OR REPLACE FUNCTION get_live_users(site_uuid UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(DISTINCT visitor_id)
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp > NOW() - INTERVAL '5 minutes';
$$ LANGUAGE SQL STABLE;

-- Function to get unique visitors for a time range
CREATE OR REPLACE FUNCTION get_unique_visitors(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS BIGINT AS $$
  SELECT COUNT(DISTINCT visitor_id)
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date;
$$ LANGUAGE SQL STABLE;

-- Function to get top pages
CREATE OR REPLACE FUNCTION get_top_pages(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  page_limit INT DEFAULT 10
)
RETURNS TABLE (
  path TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    path,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY path
  ORDER BY pageviews DESC
  LIMIT page_limit;
$$ LANGUAGE SQL STABLE;

-- Function to get top referrers
CREATE OR REPLACE FUNCTION get_top_referrers(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  referrer_limit INT DEFAULT 10
)
RETURNS TABLE (
  referrer TEXT,
  visits BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(referrer, 'Direct / None') as referrer,
    COUNT(*) as visits,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY referrer
  ORDER BY visits DESC
  LIMIT referrer_limit;
$$ LANGUAGE SQL STABLE;

-- Function to get pageviews over time (for charts)
-- Now supports timezone offset to display dates in user's local timezone
CREATE OR REPLACE FUNCTION get_pageviews_chart(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  tz_offset_minutes INT DEFAULT 0
)
RETURNS TABLE (
  date DATE,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    DATE(timestamp + (tz_offset_minutes || ' minutes')::INTERVAL) as date,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY DATE(timestamp + (tz_offset_minutes || ' minutes')::INTERVAL)
  ORDER BY date;
$$ LANGUAGE SQL STABLE;

-- Function to get device breakdown (Mobile vs Desktop)
CREATE OR REPLACE FUNCTION get_device_breakdown(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  device TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(device, 'Unknown') as device,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY device
  ORDER BY pageviews DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get top pages with device breakdown
CREATE OR REPLACE FUNCTION get_top_pages_with_devices(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  page_limit INT DEFAULT 10
)
RETURNS TABLE (
  path TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT,
  mobile_views BIGINT,
  desktop_views BIGINT
) AS $$
  SELECT
    path,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) FILTER (WHERE device = 'Mobile') as mobile_views,
    COUNT(*) FILTER (WHERE device = 'Desktop') as desktop_views
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY path
  ORDER BY pageviews DESC
  LIMIT page_limit;
$$ LANGUAGE SQL STABLE;

-- Function to get top countries
CREATE OR REPLACE FUNCTION get_top_countries(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  country_limit INT DEFAULT 10
)
RETURNS TABLE (
  country TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(country, 'Unknown') as country,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY country
  ORDER BY pageviews DESC
  LIMIT country_limit;
$$ LANGUAGE SQL STABLE;

-- Function to get cities by country
CREATE OR REPLACE FUNCTION get_cities_by_country(
  site_uuid UUID,
  country_code TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  city_limit INT DEFAULT 10
)
RETURNS TABLE (
  city TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(city, 'Unknown') as city,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND country = country_code
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY city
  ORDER BY pageviews DESC
  LIMIT city_limit;
$$ LANGUAGE SQL STABLE;

-- Function to get top campaigns (UTM tracking)
CREATE OR REPLACE FUNCTION get_top_campaigns(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  campaign_limit INT DEFAULT 10,
  campaign_offset INT DEFAULT 0
)
RETURNS TABLE (
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(utm_source, 'Unknown') as utm_source,
    COALESCE(utm_medium, 'Unknown') as utm_medium,
    COALESCE(utm_campaign, 'Unknown') as utm_campaign,
    COALESCE(utm_content, '') as utm_content,
    COALESCE(utm_term, '') as utm_term,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
    AND utm_campaign IS NOT NULL
    AND utm_campaign != ''
  GROUP BY utm_source, utm_medium, utm_campaign, utm_content, utm_term
  ORDER BY pageviews DESC
  LIMIT campaign_limit
  OFFSET campaign_offset;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA & NOTES
-- ============================================

-- Note: For production, consider:
-- 1. Partitioning pageviews table by month (for better performance)
-- 2. Archive old pageviews to cold storage after 90 days
-- 3. Add rate limiting at application level
-- 4. Use Supabase Edge Functions for the /api/track endpoint
-- 5. Consider materialized views for dashboard stats

COMMENT ON TABLE sites IS 'User websites to track analytics';
COMMENT ON TABLE pageviews IS 'Individual page visits - the core analytics data';
COMMENT ON COLUMN pageviews.visitor_id IS 'Hash of IP + User Agent for privacy-friendly unique visitor tracking';
COMMENT ON COLUMN sites.api_key IS 'Public API key used in tracking script - safe to expose';
