-- ============================================
-- BEHAVIOR EVENTS TABLE
-- UX behavior metrics: rage clicks, dead clicks,
-- excessive scrolling, quick backs
-- ============================================

CREATE TABLE behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('rage_click', 'dead_click', 'excessive_scroll', 'quick_back')),
  page_url TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_type TEXT
);

-- Indexes for dashboard queries
CREATE INDEX idx_behavior_events_site_type ON behavior_events(site_id, event_type, created_at DESC);
CREATE INDEX idx_behavior_events_session ON behavior_events(session_id);

-- RLS
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;

-- Users can view behavior events for their own sites
CREATE POLICY "Users can view behavior events of their sites"
  ON behavior_events FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous inserts (API key validated server-side)
CREATE POLICY "Allow anonymous behavior event inserts"
  ON behavior_events FOR INSERT
  WITH CHECK (true);

-- Grant execute on functions to anon role (for public dashboards)
-- ============================================
-- ANALYTICS FUNCTIONS
-- ============================================

-- Get behavior summary: rate + session count for all 4 metrics
CREATE OR REPLACE FUNCTION get_behavior_summary(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  event_type TEXT,
  rate NUMERIC,
  affected_sessions BIGINT
) AS $$
  WITH total_sessions AS (
    SELECT COUNT(DISTINCT visitor_id) as total
    FROM pageviews
    WHERE site_id = site_uuid
      AND "timestamp" >= start_date
      AND "timestamp" <= end_date
  ),
  behavior_counts AS (
    SELECT
      be.event_type,
      COUNT(DISTINCT be.session_id) as affected
    FROM behavior_events be
    WHERE be.site_id = site_uuid
      AND be.created_at >= start_date
      AND be.created_at <= end_date
    GROUP BY be.event_type
  )
  SELECT
    t.event_type,
    CASE WHEN ts.total > 0
      THEN ROUND(t.affected * 100.0 / ts.total, 2)
      ELSE 0
    END as rate,
    t.affected as affected_sessions
  FROM behavior_counts t
  CROSS JOIN total_sessions ts

  UNION ALL

  -- Include event types with zero counts
  SELECT
    missing.event_type,
    0 as rate,
    0 as affected_sessions
  FROM (
    SELECT unnest(ARRAY['rage_click', 'dead_click', 'excessive_scroll', 'quick_back']) as event_type
  ) missing
  WHERE missing.event_type NOT IN (
    SELECT be.event_type
    FROM behavior_events be
    WHERE be.site_id = site_uuid
      AND be.created_at >= start_date
      AND be.created_at <= end_date
    GROUP BY be.event_type
  );
$$ LANGUAGE SQL STABLE;

-- Get behavior details: top elements/pages for a specific metric
CREATE OR REPLACE FUNCTION get_behavior_details(
  site_uuid UUID,
  p_event_type TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  detail_limit INT DEFAULT 10
)
RETURNS TABLE (
  page_url TEXT,
  element_info TEXT,
  element_tag TEXT,
  occurrences BIGINT,
  unique_sessions BIGINT
) AS $$
  SELECT
    be.page_url,
    COALESCE(be.event_data->>'element_text', be.event_data->>'element_selector', be.event_data->>'page_to', '') as element_info,
    COALESCE(be.event_data->>'element_tag', '') as element_tag,
    COUNT(*) as occurrences,
    COUNT(DISTINCT be.session_id) as unique_sessions
  FROM behavior_events be
  WHERE be.site_id = site_uuid
    AND be.event_type = p_event_type
    AND be.created_at >= start_date
    AND be.created_at <= end_date
  GROUP BY be.page_url, element_info, element_tag
  ORDER BY occurrences DESC
  LIMIT detail_limit;
$$ LANGUAGE SQL STABLE;

-- Grant to anon role for public dashboards
GRANT EXECUTE ON FUNCTION get_behavior_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_behavior_details(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
