# SEO/GEO Diagnosis & Action Plan — conteo.online

**Date:** 2026-04-13  
**Branch:** `claude/seo-geo-agent-setup-aCHRE`  
**Agent:** SEO/GEO Autonomous Agent

---

## Current State

| Feature | Status |
|---------|--------|
| robots.txt | ✅ wildcard `*` allow, protected internal routes |
| sitemap.xml | ✅ 8 URLs + blog posts dynamically included |
| llms.txt | ❌ Does NOT exist |
| Metadata (title, OG, Twitter) | ✅ Full coverage on all marketing pages |
| JSON-LD Structured Data | ✅ 8 schema types (WebSite, Org, SoftwareApp, FAQ, Article, HowTo, BreadcrumbList, AboutPage) |
| Blog content | ⚠️ Only 2 posts (low authority signal) |
| AI-bot explicit rules | ❌ No explicit GPTBot/ClaudeBot rules |
| Organization sameAs | ❌ No entity linking to GitHub/ProductHunt/Twitter |

---

## Why AI Engines (Perplexity, ChatGPT) Won't Recommend conteo.online Today

1. **No `llms.txt`** — The emerging standard for AI crawler context. Perplexity and GPT crawlers have no curated, authoritative summary of what the product does, who it's for, and how to cite it. They infer from noisy HTML instead of structured facts.

2. **No explicit AI-bot permissions in robots.txt** — The wildcard `*` technically allows GPTBot, ClaudeBot-Web, PerplexityBot, etc., but being explicit signals intent and future-proofs against any policy changes.

3. **Organization schema has no `sameAs` links** — AI knowledge graphs (like those powering Perplexity) cross-reference entities via `sameAs` to verify legitimacy. Without links to GitHub, ProductHunt, Twitter/X, Conteo is an isolated entity with weak graph authority.

4. **Only 2 blog posts** — AI recommenders favor topical authority. Two articles don't establish Conteo as a credible source on analytics, privacy, GDPR, or cookie-free tracking topics.

5. **Sitemap `lastModified: new Date()` on static pages** — Every deploy marks ALL pages as "modified today", degrading crawl budget efficiency. Crawlers re-process unchanged pages instead of prioritizing new content.

6. **No `Product` schema on pricing page** — When users ask ChatGPT "what free analytics tools exist?", structured product/offer data gets extracted directly. Currently pricing is only in FAQ text.

7. **No entity linking to external authority sources** — No GitHub, no ProductHunt, no community page linked from structured data. AI systems build trust through external validation.

---

## Top 10 Fixes — Ordered by Impact / Effort

### ✅ Fix 1 — CREATE `/llms.txt` [CRITICAL GEO — 30min]
- **File:** `public/llms.txt` (NEW)
- **Change:** Standardized AI context file with product summary, use cases, target audience, pricing, differentiators, and key facts
- **Impact:** Direct signal to Perplexity/GPT crawlers. Single highest-leverage GEO action available.
- **Status:** Implemented in this PR

---

### ✅ Fix 2 — Explicit AI bot rules in `robots.ts` [QUICK WIN — 10min]
- **File:** `app/robots.ts`
- **Change:** Add explicit `allow: "/"` rules for `GPTBot`, `ClaudeBot-Web`, `PerplexityBot`, `GoogleBot-Extended`, `OAI-SearchBot`
- **Impact:** Clear intent signal to AI crawlers; prevents accidental blocking by future policy changes
- **Status:** Implemented in this PR

---

### ✅ Fix 3 — Enrich Organization schema with `sameAs` [HIGH IMPACT — 20min]
- **File:** `components/structured-data.tsx` → `WebsiteStructuredData()`
- **Change:** Add `sameAs` array with GitHub + Twitter/X + ProductHunt profiles; add `foundingDate`, `description`, `availableLanguage`, `areaServed`
- **Impact:** AI knowledge graphs use `sameAs` to cross-reference and validate entities
- **Status:** Implemented in this PR

---

### ✅ Fix 4 — Fix sitemap `lastModified` for static pages [CRAWL EFFICIENCY — 15min]
- **File:** `app/sitemap.ts`
- **Change:** Replace `new Date()` with hardcoded ISO dates for stable pages. Keep `new Date()` only for blog index (changes when new posts are added)
- **Impact:** Crawlers trust actual modification dates; no more wasted crawl budget re-indexing unchanged pages
- **Status:** Implemented in this PR

---

### ✅ Fix 5 — Add `Product` schema to pricing page [AI DISCOVERABILITY — 20min]
- **File:** `app/(marketing)/pricing/page.tsx`
- **Change:** Add new `PricingStructuredData` component with `Product` + `Offer` schema for Free, Pro, and Business tiers
- **Impact:** ChatGPT/Perplexity can parse pricing directly from structured data when asked "what free analytics tools exist?"
- **Status:** Implemented in this PR

---

### 🔲 Fix 6 — Add 3 blog posts for topical authority [HIGH LONG-TERM VALUE — 2–3h]
- **Files:** `lib/data/blog-posts.ts` + new pages under `app/(marketing)/blog/`
- **Suggested posts:**
  - `best-cookie-free-analytics-2026` — comparison targeting "cookie-free analytics" keyword cluster
  - `gdpr-analytics-without-consent-banner` — how-to targeting "analytics without consent" intents
  - `plausible-vs-fathom-vs-conteo` — comparison targeting competitor brand queries
- **Impact:** Topical authority, more indexable content, more pages for AI to cite as source
- **Status:** Backlog — implement next sprint

---

### 🔲 Fix 7 — Add `speakable` schema to homepage [VOICE/AI ANSWERS — 15min]
- **File:** `components/structured-data.tsx`
- **Change:** Add `speakable` property to a `WebPage` schema pointing at the hero headline and value prop text via CSS selectors
- **Impact:** Google SGE and voice assistants extract answer-ready text from `speakable` nodes
- **Status:** Backlog

---

### 🔲 Fix 8 — Add `aggregateRating` to SoftwareApplication schema [SOCIAL PROOF — 20min]
- **File:** `components/structured-data.tsx` → `SoftwareApplicationStructuredData()`
- **Change:** Add `aggregateRating` with rating value and review count once reviews exist (ProductHunt votes, G2, Capterra)
- **Impact:** AI recommenders weigh review signals when comparing alternatives; star ratings appear in search results
- **Status:** Backlog — needs review data first

---

### 🔲 Fix 9 — Add `twitter:site` to metadata [SOCIAL GRAPH — 5min]
- **File:** `app/layout.tsx` → metadata object
- **Change:** Add `twitter: { ..., site: "@conteo_app" }` (verify handle first)
- **Impact:** Twitter/X entity linking for social knowledge graph
- **Status:** Backlog — confirm Twitter/X handle first

---

### 🔲 Fix 10 — Add comparison pages for competitor alternatives [LONG-TERM SEO — 4–6h]
- **Files:** New pages under `app/(marketing)/vs/`
- **Suggested pages:** `/vs/plausible`, `/vs/fathom`, `/vs/umami`, `/vs/matomo`
- **Impact:** Captures competitor brand search traffic; AI recommenders use these when asked "X vs Y" queries
- **Status:** Backlog — Phase 6

---

## Verification Checklist

- [ ] `https://conteo.online/llms.txt` is accessible and readable
- [ ] `https://conteo.online/robots.txt` shows explicit GPTBot/PerplexityBot rules
- [ ] `https://conteo.online/sitemap.xml` shows static dates for non-blog pages
- [ ] Google Rich Results Test passes for pricing page (Product schema)
- [ ] Google Rich Results Test passes for homepage (FAQ + SoftwareApplication)
- [ ] No TypeScript errors: `npm run build`
