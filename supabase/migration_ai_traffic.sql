-- Migration: AI Traffic Detection
-- Adds AI source detection columns to pageviews and updates referrer grouping

-- ─── 1. Add columns to pageviews ────────────────────────────────────────────

ALTER TABLE pageviews
  ADD COLUMN IF NOT EXISTS ai_source VARCHAR(32) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_type VARCHAR(8) DEFAULT NULL;

-- Partial indexes for efficient AI traffic queries
CREATE INDEX IF NOT EXISTS idx_pageviews_ai_source
  ON pageviews (site_id, ai_source, "timestamp" DESC)
  WHERE ai_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pageviews_ai_type
  ON pageviews (site_id, ai_type, "timestamp" DESC)
  WHERE ai_type IS NOT NULL;

-- ─── 2. Update get_referrer_sources to recognize AI sources ─────────────────

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

        -- AI Sources
        WHEN referrer ILIKE '%chatgpt.com%' OR referrer ILIKE '%chat.openai.com%' THEN 'ChatGPT'
        WHEN referrer ILIKE '%claude.ai%' THEN 'Claude'
        WHEN referrer ILIKE '%perplexity.ai%' THEN 'Perplexity'
        WHEN referrer ILIKE '%gemini.google.com%' THEN 'Gemini'
        WHEN referrer ILIKE '%copilot.microsoft.com%' THEN 'Copilot'
        WHEN referrer ILIKE '%chat.deepseek.com%' THEN 'DeepSeek'
        WHEN referrer ILIKE '%poe.com%' THEN 'Poe'
        WHEN referrer ILIKE '%you.com%' THEN 'You.com'
        WHEN referrer ILIKE '%kagi.com%' THEN 'Kagi'
        WHEN referrer ILIKE '%phind.com%' THEN 'Phind'

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

-- ─── 3. AI traffic summary function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_ai_traffic_summary(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(
  ai_source VARCHAR(32),
  ai_type VARCHAR(8),
  visitors BIGINT,
  pageviews BIGINT,
  percentage NUMERIC(5,1)
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  -- Total human visitors for the site in this period
  SELECT COUNT(DISTINCT pe.visitor_id) INTO v_total
  FROM pageviews pe
  WHERE pe.site_id = site_uuid
    AND pe."timestamp" BETWEEN start_date AND end_date
    AND (pe.ai_type IS NULL OR pe.ai_type = 'human');

  RETURN QUERY
  SELECT
    pe.ai_source,
    pe.ai_type,
    COUNT(DISTINCT pe.visitor_id)::BIGINT AS visitors,
    COUNT(*)::BIGINT AS pageviews,
    CASE WHEN v_total > 0
      THEN ROUND(COUNT(DISTINCT pe.visitor_id)::NUMERIC / v_total * 100, 1)
      ELSE 0
    END::NUMERIC(5,1) AS percentage
  FROM pageviews pe
  WHERE pe.site_id = site_uuid
    AND pe.ai_source IS NOT NULL
    AND pe."timestamp" BETWEEN start_date AND end_date
  GROUP BY pe.ai_source, pe.ai_type
  ORDER BY visitors DESC;
END;
$$ LANGUAGE plpgsql STABLE;
