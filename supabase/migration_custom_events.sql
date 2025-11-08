-- Migration: Add custom events tracking
-- Allows users to track custom events like button clicks, form submissions, etc.

-- Create custom_events table
CREATE TABLE IF NOT EXISTS custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  path TEXT,
  referrer TEXT,
  source TEXT,
  device TEXT,
  browser TEXT,
  country TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_custom_events_site_time ON custom_events(site_id, timestamp DESC);
CREATE INDEX idx_custom_events_name ON custom_events(site_id, event_name);
CREATE INDEX idx_custom_events_visitor ON custom_events(visitor_id);

-- Function to get custom events summary
CREATE OR REPLACE FUNCTION get_custom_events_summary(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  event_name TEXT,
  total_events BIGINT,
  unique_visitors BIGINT,
  conversion_rate NUMERIC
) AS $$
  WITH site_visitors AS (
    -- Get total unique visitors in period
    SELECT COUNT(DISTINCT visitor_id) as total
    FROM pageviews
    WHERE site_id = site_uuid
      AND timestamp >= start_date
      AND timestamp <= end_date
  )
  SELECT
    e.event_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT e.visitor_id) as unique_visitors,
    ROUND((COUNT(DISTINCT e.visitor_id)::NUMERIC / NULLIF((SELECT total FROM site_visitors), 0)) * 100, 1) as conversion_rate
  FROM custom_events e
  WHERE e.site_id = site_uuid
    AND e.timestamp >= start_date
    AND e.timestamp <= end_date
  GROUP BY e.event_name
  ORDER BY total_events DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get event breakdown by source
CREATE OR REPLACE FUNCTION get_event_breakdown_by_source(
  site_uuid UUID,
  event_name_filter TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  source TEXT,
  event_count BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(source, 'Direct') as source,
    COUNT(*) as event_count,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM custom_events
  WHERE site_id = site_uuid
    AND event_name = event_name_filter
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY source
  ORDER BY event_count DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get event breakdown by page
CREATE OR REPLACE FUNCTION get_event_breakdown_by_page(
  site_uuid UUID,
  event_name_filter TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  page_limit INT DEFAULT 10
)
RETURNS TABLE (
  path TEXT,
  event_count BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    path,
    COUNT(*) as event_count,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM custom_events
  WHERE site_id = site_uuid
    AND event_name = event_name_filter
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY path
  ORDER BY event_count DESC
  LIMIT page_limit;
$$ LANGUAGE SQL STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_custom_events_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_event_breakdown_by_source(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_event_breakdown_by_page(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
