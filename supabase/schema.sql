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

-- Function to get average session duration in seconds
CREATE OR REPLACE FUNCTION get_avg_session_duration(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS NUMERIC AS $$
  WITH session_durations AS (
    SELECT
      visitor_id,
      EXTRACT(EPOCH FROM (MAX("timestamp") - MIN("timestamp"))) as duration_seconds
    FROM pageviews
    WHERE site_id = site_uuid
      AND "timestamp" >= start_date
      AND "timestamp" <= end_date
    GROUP BY visitor_id
    HAVING COUNT(*) > 1  -- Only sessions with more than 1 page
  )
  SELECT
    COALESCE(AVG(duration_seconds), 0)
  FROM session_durations;
$$ LANGUAGE SQL STABLE;

-- Function to get recent activity feed (last N visits)
CREATE OR REPLACE FUNCTION get_recent_activity(
  site_uuid UUID,
  activity_limit INT DEFAULT 20
)
RETURNS TABLE (
  path TEXT,
  country TEXT,
  browser TEXT,
  device TEXT,
  visit_time TIMESTAMPTZ
) AS $$
  SELECT
    path,
    COALESCE(country, 'Unknown') as country,
    COALESCE(browser, 'Unknown') as browser,
    COALESCE(device, 'Unknown') as device,
    "timestamp" as visit_time
  FROM pageviews
  WHERE site_id = site_uuid
  ORDER BY "timestamp" DESC
  LIMIT activity_limit;
$$ LANGUAGE SQL STABLE;

-- Function to get referrer sources grouped by domain
CREATE OR REPLACE FUNCTION get_referrer_sources(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  source_limit INT DEFAULT 10
)
RETURNS TABLE (
  source TEXT,
  visits BIGINT,
  unique_visitors BIGINT
) AS $$
  WITH parsed_referrers AS (
    SELECT
      CASE
        -- Direct traffic
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'

        -- Google
        WHEN referrer ILIKE '%google.%' THEN 'Google'

        -- Social Media
        WHEN referrer ILIKE '%facebook.%' OR referrer ILIKE '%fb.%' THEN 'Facebook'
        WHEN referrer ILIKE '%twitter.%' OR referrer ILIKE '%t.co%' THEN 'Twitter'
        WHEN referrer ILIKE '%instagram.%' THEN 'Instagram'
        WHEN referrer ILIKE '%linkedin.%' THEN 'LinkedIn'
        WHEN referrer ILIKE '%tiktok.%' THEN 'TikTok'
        WHEN referrer ILIKE '%reddit.%' THEN 'Reddit'
        WHEN referrer ILIKE '%pinterest.%' THEN 'Pinterest'
        WHEN referrer ILIKE '%youtube.%' THEN 'YouTube'

        -- Search Engines
        WHEN referrer ILIKE '%bing.%' THEN 'Bing'
        WHEN referrer ILIKE '%yahoo.%' THEN 'Yahoo'
        WHEN referrer ILIKE '%duckduckgo.%' THEN 'DuckDuckGo'
        WHEN referrer ILIKE '%baidu.%' THEN 'Baidu'

        -- Other
        ELSE 'Other'
      END as source,
      visitor_id
    FROM pageviews
    WHERE site_id = site_uuid
      AND "timestamp" >= start_date
      AND "timestamp" <= end_date
  )
  SELECT
    source,
    COUNT(*) as visits,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM parsed_referrers
  GROUP BY source
  ORDER BY visits DESC
  LIMIT source_limit;
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

-- Function to get browser breakdown (Chrome, Safari, Firefox, etc)
CREATE OR REPLACE FUNCTION get_browser_breakdown(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  browser TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(browser, 'Unknown') as browser,
    COUNT(*) as pageviews,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY browser
  ORDER BY pageviews DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get top pages with device breakdown and bounce rate
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
  desktop_views BIGINT,
  bounce_rate NUMERIC
) AS $$
  WITH visitor_page_counts AS (
    SELECT
      visitor_id,
      COUNT(DISTINCT path) as pages_viewed
    FROM pageviews
    WHERE site_id = site_uuid
      AND "timestamp" >= start_date
      AND "timestamp" <= end_date
    GROUP BY visitor_id
  ),
  page_stats AS (
    SELECT
      p.path,
      COUNT(*) as pageviews,
      COUNT(DISTINCT p.visitor_id) as unique_visitors,
      COUNT(*) FILTER (WHERE p.device = 'Mobile') as mobile_views,
      COUNT(*) FILTER (WHERE p.device = 'Desktop') as desktop_views,
      COUNT(DISTINCT p.visitor_id) FILTER (WHERE vpc.pages_viewed = 1) as bounces
    FROM pageviews p
    LEFT JOIN visitor_page_counts vpc ON p.visitor_id = vpc.visitor_id
    WHERE p.site_id = site_uuid
      AND p."timestamp" >= start_date
      AND p."timestamp" <= end_date
    GROUP BY p.path
  )
  SELECT
    path,
    pageviews,
    unique_visitors,
    mobile_views,
    desktop_views,
    CASE
      WHEN unique_visitors > 0 THEN ROUND((bounces::NUMERIC / unique_visitors::NUMERIC) * 100, 1)
      ELSE 0
    END as bounce_rate
  FROM page_stats
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
-- GRANT EXECUTE PERMISSIONS FOR PUBLIC DASHBOARDS
-- Allow anonymous users to call analytics functions
-- ============================================
GRANT EXECUTE ON FUNCTION get_live_users(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_unique_visitors(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_top_pages(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_avg_session_duration(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_recent_activity(UUID, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_top_referrers(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_referrer_sources(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_pageviews_chart(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_device_breakdown(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_browser_breakdown(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_top_pages_with_devices(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_top_countries(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_cities_by_country(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_top_campaigns(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT) TO anon;

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
