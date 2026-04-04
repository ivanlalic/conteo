-- ============================================
-- MIGRATION: ENFORCE PLAN LIMITS
-- Add function to get user plan with current usage
-- ============================================

-- Get user plan with current usage (for limit enforcement)
CREATE OR REPLACE FUNCTION get_user_plan_with_usage(user_uuid UUID)
RETURNS TABLE (
  plan_tier VARCHAR,
  sites_limit INT,
  events_limit_monthly INT,
  current_sites_count BIGINT,
  current_events_count BIGINT
) AS $$
  SELECT
    COALESCE(up.plan_tier, 'free') as plan_tier,
    COALESCE(up.sites_limit, 1) as sites_limit,
    COALESCE(up.events_limit_monthly, 10000) as events_limit_monthly,
    COALESCE((SELECT COUNT(*) FROM sites WHERE user_id = user_uuid), 0) as current_sites_count,
    COALESCE((
      SELECT COUNT(*)
      FROM pageviews p
      WHERE p.site_id IN (SELECT id FROM sites WHERE user_id = user_uuid)
        AND p.timestamp >= DATE_TRUNC('month', NOW())
        AND p.timestamp < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    ), 0) as current_events_count;
$$ LANGUAGE SQL STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_plan_with_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan_with_usage(UUID) TO anon;
