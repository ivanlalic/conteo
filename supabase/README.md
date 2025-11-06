# Supabase Setup for Conteo.online

## Quick Start

### 1. Apply the Schema

Go to your Supabase project dashboard:
1. Open the SQL Editor
2. Copy the contents of `schema.sql`
3. Run it

Or use the Supabase CLI:
```bash
supabase db push
```

### 2. Get Your Credentials

You'll need these for `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for API endpoint)

## Database Structure

### Tables

**sites**
- Stores user's websites to track
- Each site gets a unique `api_key` for tracking script
- RLS ensures users only see their own sites

**pageviews**
- Core analytics data
- Optimized indexes for fast dashboard queries
- `visitor_id` is a hash for privacy-friendly tracking

### Helper Functions

The schema includes optimized SQL functions for common analytics queries:

- `get_live_users(site_id)` - Count of unique visitors in last 5 minutes
- `get_unique_visitors(site_id, start_date, end_date)` - Unique visitor count for period
- `get_top_pages(site_id, start_date, end_date, limit)` - Most viewed pages
- `get_top_referrers(site_id, start_date, end_date, limit)` - Traffic sources
- `get_pageviews_chart(site_id, start_date, end_date)` - Daily pageview data for charts

## Example Queries

### Dashboard Stats (Today)
```sql
-- Total pageviews today
SELECT COUNT(*) FROM pageviews
WHERE site_id = 'your-site-id'
  AND timestamp >= CURRENT_DATE;

-- Unique visitors today
SELECT get_unique_visitors(
  'your-site-id',
  CURRENT_DATE,
  NOW()
);

-- Live users (last 5 min)
SELECT get_live_users('your-site-id');
```

### Top Pages (Last 7 Days)
```sql
SELECT * FROM get_top_pages(
  'your-site-id',
  NOW() - INTERVAL '7 days',
  NOW(),
  10
);
```

### Referrers (Last 30 Days)
```sql
SELECT * FROM get_top_referrers(
  'your-site-id',
  NOW() - INTERVAL '30 days',
  NOW(),
  10
);
```

### Chart Data (Last 7 Days)
```sql
SELECT * FROM get_pageviews_chart(
  'your-site-id',
  NOW() - INTERVAL '7 days',
  NOW()
);
```

## Security Notes

- **RLS is enabled** - Users can only see their own data
- **API Key** - The `sites.api_key` is safe to expose in client-side tracking script
- **Anonymous inserts** - Pageviews can be inserted without auth (validated via API key in endpoint)

## Performance Considerations

This schema is optimized for:
- Fast dashboard queries (indexes on site_id + timestamp)
- Quick "live users" lookup (timestamp index)
- Efficient top pages/referrers (compound indexes)

For production with high traffic:
- Consider table partitioning by month
- Archive old data after 90 days
- Use Supabase Realtime for live user count
- Add rate limiting at application level

## Next Steps

After applying schema:
1. Create tracking script (`public/tracker.js`)
2. Build API endpoint (`/api/track`)
3. Create dashboard pages
4. Add auth flow
