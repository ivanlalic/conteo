-- Migration: Trend chart with dynamic granularity
-- Adds get_trend_chart() function that supports hour/day/week/month grouping

CREATE OR REPLACE FUNCTION get_trend_chart(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  granularity TEXT DEFAULT 'day',
  tz_offset_minutes INT DEFAULT 0
)
RETURNS TABLE (
  bucket TIMESTAMPTZ,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
BEGIN
  -- Validate granularity parameter
  IF granularity NOT IN ('hour', 'day', 'week', 'month') THEN
    RAISE EXCEPTION 'Invalid granularity: %. Must be hour, day, week, or month.', granularity;
  END IF;

  RETURN QUERY
  SELECT
    date_trunc(granularity, p.timestamp + (tz_offset_minutes || ' minutes')::INTERVAL) AS bucket,
    COUNT(*)::BIGINT AS pageviews,
    COUNT(DISTINCT p.visitor_id)::BIGINT AS unique_visitors
  FROM pageviews p
  WHERE p.site_id = site_uuid
    AND p.timestamp >= start_date
    AND p.timestamp <= end_date
  GROUP BY date_trunc(granularity, p.timestamp + (tz_offset_minutes || ' minutes')::INTERVAL)
  ORDER BY bucket;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_trend_chart(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_trend_chart(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INT) TO authenticated;
