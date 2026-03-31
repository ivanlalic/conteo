-- Dashboard Polish Migration
-- 1. Fix get_referrer_sources: show actual domain instead of "Other"
-- 2. Fix get_avg_session_duration: add 30-min session window
-- 3. Add get_os_breakdown: OS breakdown similar to browser breakdown

-- ============================================================
-- 1. UPDATED get_referrer_sources
--    Instead of "Other" bucket, extract the clean domain from the referrer URL
-- ============================================================
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
        WHEN referrer IS NULL OR referrer = '' OR referrer = 'Direct' THEN 'Direct'

        -- Google (all properties)
        WHEN referrer ILIKE '%google.%' OR referrer ILIKE '%googleapis.com%' THEN 'Google'

        -- Social Media
        WHEN referrer ILIKE '%facebook.com%' OR referrer ILIKE '%fb.com%' OR referrer ILIKE '%l.facebook.com%' THEN 'Facebook'
        WHEN referrer ILIKE '%twitter.com%' OR referrer ILIKE '%t.co%' OR referrer ILIKE '%x.com%' THEN 'Twitter / X'
        WHEN referrer ILIKE '%instagram.com%' OR referrer ILIKE '%l.instagram.com%' THEN 'Instagram'
        WHEN referrer ILIKE '%linkedin.com%' OR referrer ILIKE '%lnkd.in%' THEN 'LinkedIn'
        WHEN referrer ILIKE '%tiktok.com%' THEN 'TikTok'
        WHEN referrer ILIKE '%reddit.com%' OR referrer ILIKE '%old.reddit.com%' THEN 'Reddit'
        WHEN referrer ILIKE '%pinterest.com%' OR referrer ILIKE '%pin.it%' THEN 'Pinterest'
        WHEN referrer ILIKE '%youtube.com%' OR referrer ILIKE '%youtu.be%' THEN 'YouTube'

        -- Search Engines
        WHEN referrer ILIKE '%bing.com%' THEN 'Bing'
        WHEN referrer ILIKE '%yahoo.com%' THEN 'Yahoo'
        WHEN referrer ILIKE '%duckduckgo.com%' THEN 'DuckDuckGo'
        WHEN referrer ILIKE '%baidu.com%' THEN 'Baidu'
        WHEN referrer ILIKE '%yandex.%' THEN 'Yandex'

        -- Product Hunt
        WHEN referrer ILIKE '%producthunt.com%' THEN 'Product Hunt'

        -- Hacker News
        WHEN referrer ILIKE '%news.ycombinator.com%' OR referrer ILIKE '%ycombinator.com%' THEN 'Hacker News'

        -- GitHub
        WHEN referrer ILIKE '%github.com%' THEN 'GitHub'

        -- Extract clean domain for everything else (strip protocol, www., and path)
        ELSE
          regexp_replace(
            regexp_replace(
              regexp_replace(referrer, '^https?://', ''),
              '^www\.', ''
            ),
            '[/?#].*$', ''
          )
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


-- ============================================================
-- 2. FIXED get_avg_session_duration
--    Uses a 30-minute inactivity window to define sessions properly,
--    so a visitor returning days later isn't counted as a single session.
-- ============================================================
CREATE OR REPLACE FUNCTION get_avg_session_duration(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  avg_duration_all NUMERIC,
  avg_duration_multi_page NUMERIC
) AS $$
  WITH ordered_pageviews AS (
    SELECT
      visitor_id,
      "timestamp",
      LAG("timestamp") OVER (PARTITION BY visitor_id ORDER BY "timestamp") AS prev_timestamp
    FROM pageviews
    WHERE site_id = site_uuid
      AND "timestamp" >= start_date
      AND "timestamp" <= end_date
  ),
  session_starts AS (
    SELECT
      visitor_id,
      "timestamp",
      -- A new session starts when gap > 30 minutes or it's the first pageview
      CASE
        WHEN prev_timestamp IS NULL
          OR EXTRACT(EPOCH FROM ("timestamp" - prev_timestamp)) > 1800
        THEN 1
        ELSE 0
      END AS is_new_session
    FROM ordered_pageviews
  ),
  with_session_id AS (
    SELECT
      visitor_id,
      "timestamp",
      SUM(is_new_session) OVER (PARTITION BY visitor_id ORDER BY "timestamp") AS session_num
    FROM session_starts
  ),
  session_stats AS (
    SELECT
      visitor_id,
      session_num,
      EXTRACT(EPOCH FROM (MAX("timestamp") - MIN("timestamp"))) AS duration_seconds,
      COUNT(*) AS page_count
    FROM with_session_id
    GROUP BY visitor_id, session_num
  )
  SELECT
    COALESCE(AVG(duration_seconds), 0) AS avg_duration_all,
    COALESCE(AVG(duration_seconds) FILTER (WHERE page_count > 1), 0) AS avg_duration_multi_page
  FROM session_stats;
$$ LANGUAGE SQL STABLE;


-- ============================================================
-- 3. NEW get_os_breakdown
--    Returns OS breakdown (Windows, macOS, iOS, Android, Linux, etc.)
-- ============================================================
CREATE OR REPLACE FUNCTION get_os_breakdown(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  os TEXT,
  pageviews BIGINT,
  unique_visitors BIGINT
) AS $$
  SELECT
    COALESCE(NULLIF(os, ''), 'Unknown') AS os,
    COUNT(*) AS pageviews,
    COUNT(DISTINCT visitor_id) AS unique_visitors
  FROM pageviews
  WHERE site_id = site_uuid
    AND "timestamp" >= start_date
    AND "timestamp" <= end_date
  GROUP BY os
  ORDER BY pageviews DESC;
$$ LANGUAGE SQL STABLE;
