# Debug Tracking Issues

## Your Current Setup

```html
<script src="https://conteo.online/tracker.js"
        data-api-key="de18cc34-70fd-4ab0-9923-c7e6b4bd320c" defer></script>
```

**Problem**: `conteo.online` is not deployed yet! 🚨

---

## Quick Fix Steps

### 1. Verify API Key is Valid

In Supabase SQL Editor, run:
```sql
SELECT id, domain, api_key
FROM sites
WHERE api_key = 'de18cc34-70fd-4ab0-9923-c7e6b4bd320c';
```

**Expected**: Should return 1 row with your site
**If empty**: The API key doesn't exist! Create a site in `/sites`

### 2. Deploy to Vercel

See `DEPLOY.md` for step-by-step instructions.

You'll get a URL like: `https://conteo-abc123.vercel.app`

### 3. Update Shopify Script

Replace `conteo.online` with your Vercel URL:

```html
<script src="https://YOUR-APP.vercel.app/tracker.js"
        data-api-key="de18cc34-70fd-4ab0-9923-c7e6b4bd320c" defer></script>
```

---

## Testing Locally (Alternative)

If you want to test before deploying:

### Option A: Use ngrok (easiest)

1. Install ngrok: https://ngrok.com/download
2. Run your Next.js app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update Shopify script to use ngrok URL

```html
<script src="https://abc123.ngrok.io/tracker.js"
        data-api-key="de18cc34-70fd-4ab0-9923-c7e6b4bd320c" defer></script>
```

### Option B: Test with a local HTML file

Create `test.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Conteo Tracking</title>
  <script src="http://localhost:3000/tracker.js"
          data-api-key="de18cc34-70fd-4ab0-9923-c7e6b4bd320c" defer></script>
</head>
<body>
  <h1>Test Page</h1>
  <p>Check console for tracking messages</p>
  <script>
    console.log('Page loaded, tracking should initialize...')
  </script>
</body>
</html>
```

Open in browser (with `npm run dev` running).

---

## Verify Tracking Works

### 1. Browser Console

Open your Shopify site and check console (F12):

✅ **Success**:
```
[Conteo] Analytics initialized
```

❌ **Failed to load**:
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```
→ Domain not deployed

❌ **CORS error**:
```
Access to fetch at '...' has been blocked by CORS policy
```
→ Check middleware.ts CORS settings

### 2. Network Tab

Check for POST request to `/api/track`:

- **Status 200**: ✅ Working!
- **Status 401**: ❌ Invalid API key
- **Status 404**: ❌ API endpoint not found
- **Failed**: ❌ Domain not accessible

### 3. Check Database

In Supabase SQL Editor:
```sql
-- See all pageviews
SELECT * FROM pageviews
ORDER BY timestamp DESC
LIMIT 10;

-- See pageviews for your site
SELECT
  pv.path,
  pv.referrer,
  pv.timestamp,
  s.domain
FROM pageviews pv
JOIN sites s ON s.id = pv.site_id
WHERE s.api_key = 'de18cc34-70fd-4ab0-9923-c7e6b4bd320c'
ORDER BY pv.timestamp DESC;
```

---

## Common Issues

### Issue 1: No pageviews in dashboard

**Causes**:
- Wrong API key
- App not deployed
- CORS blocking requests
- Script not loading

**Fix**: Follow steps above to verify each

### Issue 2: "Invalid API key" error

**Cause**: API key doesn't exist in database

**Fix**:
1. Go to `/sites` in your app
2. Create a new site
3. Copy the correct API key
4. Update Shopify script

### Issue 3: Script not loading

**Cause**: Domain doesn't exist

**Fix**: Deploy to Vercel first!

---

## Need Help?

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify API key in Supabase
4. Make sure app is deployed and accessible

**MOST COMMON ISSUE**: App not deployed yet! Deploy to Vercel first.
