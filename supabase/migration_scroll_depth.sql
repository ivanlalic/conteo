-- ============================================
-- SCROLL DEPTH TRACKING
-- Tracks scroll milestones (25%, 50%, 75%, 100%) per pageview
-- ============================================

CREATE TABLE IF NOT EXISTS scroll_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  path TEXT,
  scroll_depth SMALLINT NOT NULL CHECK (scroll_depth IN (25, 50, 75, 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queries by site + date range
CREATE INDEX idx_scroll_events_site_created
  ON scroll_events (site_id, created_at DESC);

-- Index for queries by site + specific page
CREATE INDEX idx_scroll_events_site_path
  ON scroll_events (site_id, path, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE scroll_events ENABLE ROW LEVEL SECURITY;

-- Users can view scroll events for their own sites
CREATE POLICY "Users can view scroll events of their sites"
  ON scroll_events FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous inserts (API key validated server-side)
CREATE POLICY "Allow anonymous scroll event inserts"
  ON scroll_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ANALYTICS FUNCTION: Scroll depth summary per page
-- ============================================

CREATE OR REPLACE FUNCTION get_scroll_depth_summary(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(
  path TEXT,
  total_visitors BIGINT,
  pct_25 NUMERIC,
  pct_50 NUMERIC,
  pct_75 NUMERIC,
  pct_100 NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH page_visitors AS (
    -- Total unique visitors per page (denominator)
    SELECT p.path, COUNT(DISTINCT p.visitor_id) AS total_v
    FROM pageviews p
    WHERE p.site_id = site_uuid
      AND p."timestamp" >= start_date
      AND p."timestamp" <= end_date
    GROUP BY p.path
  ),
  scroll_counts AS (
    -- Unique visitors that reached each milestone per page
    SELECT
      se.path,
      COUNT(DISTINCT CASE WHEN se.scroll_depth >= 25 THEN se.visitor_id END) AS r25,
      COUNT(DISTINCT CASE WHEN se.scroll_depth >= 50 THEN se.visitor_id END) AS r50,
      COUNT(DISTINCT CASE WHEN se.scroll_depth >= 75 THEN se.visitor_id END) AS r75,
      COUNT(DISTINCT CASE WHEN se.scroll_depth = 100 THEN se.visitor_id END) AS r100
    FROM scroll_events se
    WHERE se.site_id = site_uuid
      AND se.created_at >= start_date
      AND se.created_at <= end_date
    GROUP BY se.path
  )
  SELECT
    pv.path,
    pv.total_v AS total_visitors,
    CASE WHEN pv.total_v > 0
      THEN ROUND(COALESCE(sc.r25, 0)::NUMERIC / pv.total_v * 100, 1) ELSE 0
    END AS pct_25,
    CASE WHEN pv.total_v > 0
      THEN ROUND(COALESCE(sc.r50, 0)::NUMERIC / pv.total_v * 100, 1) ELSE 0
    END AS pct_50,
    CASE WHEN pv.total_v > 0
      THEN ROUND(COALESCE(sc.r75, 0)::NUMERIC / pv.total_v * 100, 1) ELSE 0
    END AS pct_75,
    CASE WHEN pv.total_v > 0
      THEN ROUND(COALESCE(sc.r100, 0)::NUMERIC / pv.total_v * 100, 1) ELSE 0
    END AS pct_100
  FROM page_visitors pv
  LEFT JOIN scroll_counts sc ON pv.path = sc.path
  ORDER BY pv.total_v DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to anon role (for dashboard queries)
GRANT EXECUTE ON FUNCTION get_scroll_depth_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
