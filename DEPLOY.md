# Deploy Conteo.online to Vercel

## Quick Deploy (5 minutes)

### Step 1: Push to GitHub

Make sure your code is pushed to GitHub:
```bash
git push origin claude/nextjs-setup-011CUroqCHjXGPK844mq9uDr
```

Or merge to main first:
```bash
git checkout main
git merge claude/nextjs-setup-011CUroqCHjXGPK844mq9uDr
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repo `ivanlalic/conteo`
4. Vercel will auto-detect Next.js settings ✅

### Step 3: Add Environment Variables

Before deploying, add these env vars in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
```

(Get these from Supabase → Settings → API)

### Step 4: Deploy!

Click "Deploy" and wait ~2 minutes.

You'll get a URL like: `https://conteo-xyz.vercel.app`

### Step 5: Update Shopify Script

Replace in your Shopify theme.liquid:

```html
<!-- OLD (doesn't work) -->
<script src="https://conteo.online/tracker.js"
        data-api-key="de18cc34-70fd-4ab0-9923-c7e6b4bd320c" defer></script>

<!-- NEW (use your Vercel URL) -->
<script src="https://conteo-xyz.vercel.app/tracker.js"
        data-api-key="de18cc34-70fd-4ab0-9923-c7e6b4bd320c" defer></script>
```

### Step 6: Test!

1. Visit your Shopify site
2. Open browser console (F12)
3. You should see: `[Conteo] Analytics initialized`
4. Check your dashboard → should see pageviews!

---

## Troubleshooting

### Check if tracking works:

Open your Shopify site and run in browser console:
```javascript
console.log('Testing Conteo tracking...')
```

Then check Network tab for requests to `/api/track`

### Check Supabase directly:

In Supabase SQL Editor:
```sql
SELECT * FROM pageviews
WHERE site_id = (SELECT id FROM sites WHERE api_key = 'de18cc34-70fd-4ab0-9923-c7e6b4bd320c')
ORDER BY timestamp DESC
LIMIT 10;
```

---

## Alternative: Custom Domain

After deploying, you can add `conteo.online` as a custom domain in Vercel:

1. Vercel Dashboard → Project → Settings → Domains
2. Add `conteo.online`
3. Update DNS records (Vercel will show you what to add)

Then your script can use `https://conteo.online/tracker.js` ✅
