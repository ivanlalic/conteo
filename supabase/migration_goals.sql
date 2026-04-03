-- Migration: Add goals system for tracking conversions
-- Supports two goal types:
--   pageview: track when someone visits a specific page (no code needed)
--   custom_event: track when conteo.track() fires a specific event

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Goal type
  goal_type VARCHAR(16) NOT NULL CHECK (goal_type IN ('pageview', 'custom_event')),

  -- For pageview goals
  page_path VARCHAR(512),
  match_type VARCHAR(16) DEFAULT 'exact'
    CHECK (match_type IN ('exact', 'contains', 'starts_with')),

  -- For custom event goals
  event_name VARCHAR(64),

  -- Display
  display_name VARCHAR(128) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validation: pageview goal needs page_path, event goal needs event_name
  CONSTRAINT goal_has_target CHECK (
    (goal_type = 'pageview' AND page_path IS NOT NULL) OR
    (goal_type = 'custom_event' AND event_name IS NOT NULL)
  )
);

-- Index for loading goals by site
CREATE INDEX IF NOT EXISTS idx_goals_site ON goals (site_id);

-- RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners manage their goals"
  ON goals FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()))
  WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Function: calculate goal conversions for a site within a date range
-- Uses pageviews.path (relative paths like /pricing) and custom_events.event_name
CREATE OR REPLACE FUNCTION get_goals_with_conversions(
  p_site_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE(
  goal_id UUID,
  goal_type VARCHAR(16),
  display_name VARCHAR(128),
  page_path VARCHAR(512),
  match_type VARCHAR(16),
  event_name VARCHAR(64),
  total_conversions BIGINT,
  unique_visitors BIGINT,
  conversion_rate DECIMAL(5,2)
) AS $$
DECLARE
  v_total_visitors BIGINT;
BEGIN
  -- Total unique visitors for the site in the period (denominator for CR%)
  SELECT COUNT(DISTINCT pv.visitor_id) INTO v_total_visitors
  FROM pageviews pv
  WHERE pv.site_id = p_site_id
    AND pv.timestamp BETWEEN p_start_date AND p_end_date;

  RETURN QUERY
  SELECT
    g.id AS goal_id,
    g.goal_type,
    g.display_name,
    g.page_path,
    g.match_type,
    g.event_name,
    COALESCE(pv_conv.total, 0)::BIGINT + COALESCE(ev_conv.total, 0)::BIGINT AS total_conversions,
    COALESCE(pv_conv.visitors, 0)::BIGINT + COALESCE(ev_conv.visitors, 0)::BIGINT AS unique_visitors,
    CASE
      WHEN v_total_visitors > 0
      THEN ROUND(
        (COALESCE(pv_conv.visitors, 0) + COALESCE(ev_conv.visitors, 0))::DECIMAL
        / v_total_visitors * 100, 2)
      ELSE 0
    END::DECIMAL(5,2) AS conversion_rate
  FROM goals g
  -- Pageview goal conversions
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS total,
      COUNT(DISTINCT pv.visitor_id)::BIGINT AS visitors
    FROM pageviews pv
    WHERE pv.site_id = p_site_id
      AND pv.timestamp BETWEEN p_start_date AND p_end_date
      AND g.goal_type = 'pageview'
      AND (
        (g.match_type = 'exact' AND pv.path = g.page_path) OR
        (g.match_type = 'contains' AND pv.path LIKE '%' || g.page_path || '%') OR
        (g.match_type = 'starts_with' AND pv.path LIKE g.page_path || '%')
      )
  ) pv_conv ON g.goal_type = 'pageview'
  -- Custom event goal conversions
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS total,
      COUNT(DISTINCT ce.visitor_id)::BIGINT AS visitors
    FROM custom_events ce
    WHERE ce.site_id = p_site_id
      AND ce.timestamp BETWEEN p_start_date AND p_end_date
      AND g.goal_type = 'custom_event'
      AND ce.event_name = g.event_name
  ) ev_conv ON g.goal_type = 'custom_event'
  WHERE g.site_id = p_site_id
  ORDER BY (COALESCE(pv_conv.total, 0) + COALESCE(ev_conv.total, 0)) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute to anon role (matches existing pattern)
GRANT EXECUTE ON FUNCTION get_goals_with_conversions(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_goals_with_conversions(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
