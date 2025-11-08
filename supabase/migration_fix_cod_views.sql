-- Fix COD conversions function to count actual product page views
-- This migration improves the get_cod_conversions function to show real pageview counts
-- grouped by traffic source instead of just counting COD events

CREATE OR REPLACE FUNCTION get_cod_conversions(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  product_name TEXT,
  source TEXT,
  views BIGINT,
  forms BIGINT,
  purchases BIGINT,
  revenue NUMERIC
) AS $$
  WITH product_views AS (
    -- Get pageviews for product pages by traffic source
    SELECT
      p.path as product_page,
      CASE
        WHEN LOWER(p.referrer) LIKE '%facebook.com%' OR LOWER(p.referrer) LIKE '%fb.com%' THEN 'Facebook'
        WHEN LOWER(p.referrer) LIKE '%tiktok.com%' THEN 'TikTok'
        WHEN LOWER(p.referrer) LIKE '%instagram.com%' THEN 'Instagram'
        WHEN LOWER(p.referrer) LIKE '%google.%' THEN 'Google'
        WHEN LOWER(p.referrer) LIKE '%twitter.com%' OR LOWER(p.referrer) LIKE '%t.co%' THEN 'Twitter'
        WHEN p.referrer IS NULL OR p.referrer = '' THEN 'Direct'
        ELSE 'Other'
      END as source,
      COUNT(*) as view_count
    FROM pageviews p
    WHERE p.site_id = site_uuid
      AND p.path LIKE '/products/%'
      AND p.timestamp >= start_date
      AND p.timestamp <= end_date
    GROUP BY p.path, source
  ),
  cod_stats AS (
    -- Get COD conversion stats
    SELECT
      product_page,
      COALESCE(product_name, 'Unknown') as product_name,
      COALESCE(source, 'Direct') as source,
      COUNT(*) FILTER (WHERE opened_form = true) as forms,
      COUNT(*) FILTER (WHERE purchased = true) as purchases,
      SUM(value) FILTER (WHERE purchased = true) as revenue
    FROM cod_conversions
    WHERE site_id = site_uuid
      AND created_at >= start_date
      AND created_at <= end_date
    GROUP BY product_page, product_name, source
  )
  SELECT
    COALESCE(c.product_name, 'Unknown') as product_name,
    COALESCE(c.source, pv.source, 'Direct') as source,
    COALESCE(pv.view_count, 0)::BIGINT as views,
    COALESCE(c.forms, 0)::BIGINT as forms,
    COALESCE(c.purchases, 0)::BIGINT as purchases,
    COALESCE(c.revenue, 0) as revenue
  FROM cod_stats c
  FULL OUTER JOIN product_views pv
    ON c.product_page = pv.product_page
    AND c.source = pv.source
  WHERE c.product_name IS NOT NULL OR pv.view_count > 0
  ORDER BY revenue DESC NULLS LAST, purchases DESC, views DESC;
$$ LANGUAGE SQL STABLE;
