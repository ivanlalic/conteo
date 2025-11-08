-- Verify site configuration for conteo.online self-tracking
-- Run this in Supabase SQL Editor to check if the domain is correctly set

SELECT
  id,
  domain,
  api_key,
  cod_tracking_enabled,
  created_at
FROM sites
WHERE api_key = '15237fb4-68f1-4fe9-85fd-c63f1715c42c';

-- If the domain is NOT 'conteo.online', update it with:
-- UPDATE sites
-- SET domain = 'conteo.online'
-- WHERE api_key = '15237fb4-68f1-4fe9-85fd-c63f1715c42c';
