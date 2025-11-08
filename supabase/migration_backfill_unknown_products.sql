-- Backfill product information for "Unknown" COD conversion records
-- This script updates records with product_name = 'Unknown' by copying
-- product info from successful records of the same product_page

-- Update Unknown records by finding a known record from the same product page
UPDATE cod_conversions AS target
SET
  product_id = source.product_id,
  product_name = source.product_name
FROM (
  SELECT DISTINCT ON (product_page)
    product_page,
    product_id,
    product_name
  FROM cod_conversions
  WHERE product_name != 'Unknown'
    AND product_name IS NOT NULL
    AND product_id IS NOT NULL
    AND product_id != ''
    AND product_page IS NOT NULL
  ORDER BY product_page, created_at DESC
) AS source
WHERE target.product_page = source.product_page
  AND (target.product_name = 'Unknown' OR target.product_name IS NULL)
  AND target.product_page IS NOT NULL;

-- Show results
SELECT
  product_page,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE product_name = 'Unknown') as still_unknown,
  COUNT(*) FILTER (WHERE product_name != 'Unknown') as now_known
FROM cod_conversions
GROUP BY product_page
ORDER BY total_records DESC;
