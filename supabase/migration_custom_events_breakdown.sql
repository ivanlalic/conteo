-- Migration: Add custom events breakdown functions
-- Created: 2025-11-09
-- Purpose: Add functions to get detailed breakdowns of custom events by device and properties

-- Function to get event breakdown by device
CREATE OR REPLACE FUNCTION get_event_breakdown_by_device(
  site_uuid UUID,
  event_name_filter TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  device TEXT,
  event_count BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(device, 'Unknown') as device,
    COUNT(*) as event_count,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM custom_events
  WHERE site_id = site_uuid
    AND event_name = event_name_filter
    AND timestamp >= start_date
    AND timestamp <= end_date
  GROUP BY device
  ORDER BY event_count DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get event breakdown by properties
CREATE OR REPLACE FUNCTION get_event_breakdown_by_properties(
  site_uuid UUID,
  event_name_filter TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  property_key TEXT,
  property_value TEXT,
  event_count BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    key as property_key,
    value::TEXT as property_value,
    COUNT(*) as event_count,
    COUNT(DISTINCT visitor_id) as unique_visitors
  FROM custom_events,
       LATERAL jsonb_each_text(properties) AS props(key, value)
  WHERE site_id = site_uuid
    AND event_name = event_name_filter
    AND timestamp >= start_date
    AND timestamp <= end_date
    AND properties IS NOT NULL
    AND properties != '{}'::jsonb
  GROUP BY key, value
  ORDER BY event_count DESC;
$$ LANGUAGE SQL STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_event_breakdown_by_device(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION get_event_breakdown_by_properties(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
