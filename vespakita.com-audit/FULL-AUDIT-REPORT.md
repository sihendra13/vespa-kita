# SEO Audit — vespakita.com

Date: 2026-08-03
Pages audited: `/` (ID), `/en/` (EN), `/60s-yogyakarta/`, `/vw-yogyakarta/` (4 pages, full site)
Business type detected: **Independent media / publisher** (Vespa community content, podcast, event coverage — with two client-facing sponsorship-proposal pages)

## Executive Summary

**SEO Health Score: 64 / 100** (Needs Improvement)

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 78 |
| Content Quality | 23% | 65 |
| On-Page SEO | 20% | 72 |
| Schema / Structured Data | 10% | 70 |
| Performance (CWV) | 10% | 45 |
| AI Search Readiness (GEO) | 10% | 25 |
| Images | 5% | 60 |

### Top 5 Critical / High Issues
1. **Cloudflare edge robots.txt blocks all major AI crawlers** (GPTBot, Google-Extended, ClaudeBot, Applebot-Extended, CCBot, Bytespider, meta-externalagent) — site cannot appear in ChatGPT/Perplexity/Google AI Overviews/Meta AI citations. This overrides the permissive local `robots.txt` and is configured at the Cloudflare account level, not in the repo.
2. **Hero videos are unoptimized and huge**: `60s-yogyakarta/vespa_kegiatanok.mp4` (19MB), `jsp_landscape.mp4` (5.8MB), `vw-yogyakarta/images/hero-bg.mp4` (1.2MB) — directly hurts LCP/CWV and mobile load time.
3. **`/vw-yogyakarta/` missing from sitemap.xml** (confirmed on live site too) despite being `robots: index, follow` and linked from the homepage — slower discovery/indexing.
4. Meta descriptions on `/` (≈192 chars) and `/en/` (≈202 chars) run past Google's ~155-160 char snippet limit — risk of truncation in search results.
5. Image lazy-loading is inconsistent: only 3/13 images lazy-loaded on `/` and `/en/`, 0/8 and 0/7 on the proposal pages.

### Top 5 Quick Wins
1. Add `/vw-yogyakarta/` to `sitemap.xml` (5-minute fix, matches existing `60s-yogyakarta` entry pattern).
2. Trim meta descriptions to ≤160 characters on `/` and `/en/`.
3. Add `loading="lazy"` to all below-the-fold `<img>` tags across all 4 pages.
4. Decide intentionally on the Cloudflare AI-crawler block: if GEO/AI citations matter, allow at least Google-Extended + GPTBot; if content-scraping protection is the priority, keep as-is but document the tradeoff.
5. Compress/transcode the two large hero videos (19MB → target <3MB via H.264 re-encode + poster image + `preload="none"`).

---

## 1. Technical SEO (Score: 78/100)

**What works:**
- `robots.txt` + `sitemap.xml` present and cross-linked, both locally and as served live.
- Canonical URLs correct and self-referencing on all 4 pages.
- `hreflang` (id / en / x-default) correctly reciprocal between `/` and `/en/`.
- HTTPS via Cloudflare, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin` present.
- `meta robots: index, follow` consistent across all pages (intentional, all meant to be public).

**Findings:**
| Title | Severity | Description | Recommendation |
|---|---|---|---|
| Cloudflare-managed robots.txt blocks AI crawlers | High | Live `robots.txt` has a Cloudflare-injected block: `Disallow: /` for GPTBot, Google-Extended, ClaudeBot, Applebot-Extended, CCBot, Bytespider, meta-externalagent, CloudflareBrowserRenderingCrawler, Amazonbot. `Content-Signal: ai-train=no`. This is NOT in the local repo's `robots.txt` — it's injected at the Cloudflare edge (likely the "Block AI Bots" / Content Signals toggle in the Cloudflare dashboard). | Confirm this is intentional. If the goal is AI Overviews/ChatGPT/Perplexity visibility (GEO), this setting actively defeats it — the crawlers can't even read the page. If the goal is protecting original content from AI training, this is working as intended. |
| `/vw-yogyakarta/` missing from sitemap.xml | High | Confirmed on both local file and live `https://www.vespakita.com/sitemap.xml` — only `/`, `/en/`, `/60s-yogyakarta/` are listed. | Add a `<url>` entry for `/vw-yogyakarta/` matching the `60s-yogyakarta` pattern. |
| No HSTS / CSP headers | Medium | Live response has `x-content-type-options` and `referrer-policy` but no `Strict-Transport-Security` or `Content-Security-Policy`. Not a ranking factor directly, but Google's security signals and Lighthouse "Best Practices" score account for it. | Add via Cloudflare Transform Rules or origin config if feasible. |
| No `llms.txt` | Low | Optional, informal convention some AI crawlers reference (Google ignores it). Low priority given finding #1 already blocks most AI bots at the robots.txt level. | Low priority; address finding #1 first. |

---

## 2. Content Quality (Score: 65/100)

**What works:**
- Each page has distinct, purpose-specific content (media/community brand page, two individual sponsorship proposals) — no thin/duplicate boilerplate between pages.
- Copy is specific and concrete (podcast formats, audience stats sections, package pricing) rather than generic filler.

**Findings:**
| Title | Severity | Description | Recommendation |
|---|---|---|---|
| No visible author/byline or publish date on content sections | Medium | For E-E-A-t, and news/media schema conventions, dated, attributed content signals trustworthiness. Currently no author bios or dated posts detected on the homepage. | If there's a blog/article section planned, add author + date. Not critical for a single-page brand site, but relevant if content marketing expands. |
| No case-study/data-backed proof points found on homepage in this audit pass | Info | Not fully verified — this pass didn't do a full readability/word-count scan of body copy (would require rendering the page, which needs the skill's `render_page.py`, not run in this pass). | Recommend a follow-up manual/content-specific pass (`seo-content` skill) if deeper readability/E-E-A-T scoring is wanted. |

---

## 3. On-Page SEO (Score: 72/100)

| Page | Title (chars) | Meta description (chars, approx content only) | H1 count |
|---|---|---|---|
| `/` | "VespaKita - Vespa Untuk Kita Semua" (35) | ~192 | 1 |
| `/en/` | "VespaKita - Vespa For Us All" (29) | ~202 | 1 |
| `/60s-yogyakarta/` | 68 | ~148 | 1 |
| `/vw-yogyakarta/` | 74 | ~179 | 1 |

**Findings:**
| Title | Severity | Description | Recommendation |
|---|---|---|---|
| Meta descriptions on `/` and `/en/` exceed ~160 char display limit | Medium | Google typically truncates snippets around 155-160 characters; both homepage descriptions run ~190-200 chars. | Trim to ≤160 chars, front-load the value proposition. |
| Homepage titles are short and brand-only | Low | "VespaKita - Vespa Untuk Kita Semua" doesn't include a descriptive keyword phrase (e.g. "media Vespa Indonesia", "komunitas & podcast Vespa"). | Consider "VespaKita — Media & Komunitas Vespa Indonesia" style title for better keyword coverage; test against brand-recognition tradeoff. |
| Single H1 per page | — (positive) | Confirmed exactly 1 `<h1>` on every page. | No action needed. |

---

## 4. Schema & Structured Data (Score: 70/100)

**What works:**
- `Organization` schema (name, alternateName, url, logo, description, knowsAbout, areaServed, sameAs) present on `/` and `/en/`.
- `Event` schema present on both proposal pages (`60s-yogyakarta`, `vw-yogyakarta`) with name + description.
- All JSON-LD blocks are valid JSON (no parse errors).

**Findings:**
| Title | Severity | Description | Recommendation |
|---|---|---|---|
| Event schema likely missing required fields for rich results | Medium | Google's Event rich result requires `startDate`, `location`, and recommends `offers`/`organizer`. This pass only confirmed `@type`, `name`, `description` exist — full field-by-field validation wasn't run. | Run Google's Rich Results Test on both proposal pages to confirm `startDate`/`location` are present and valid. |
| No `WebSite` schema with `SearchAction` | Low | Enables sitelinks search box in Google results. Optional, minor. | Nice-to-have, not urgent. |
| No `BreadcrumbList` schema | Low | Site is shallow (no deep hierarchy) so impact is minor. | Low priority. |

---

## 5. Performance / Core Web Vitals (Score: 45/100 — weakest area)

**Findings:**
| Title | Severity | Description | Recommendation |
|---|---|---|---|
| Oversized hero videos | Critical | `60s-yogyakarta/vespa_kegiatanok.mp4` = 19MB, `jsp_landscape.mp4` = 5.8MB, `vw-yogyakarta/images/hero-bg.mp4` = 1.2MB, all used as autoplaying backgrounds. This is very likely the single biggest LCP/load-time problem on the site, especially on mobile/cellular. | Re-encode to H.264/VP9 at a bitrate targeting <3MB, add a poster image, `preload="metadata"` or `preload="none"`, and consider serving a static image on mobile instead of video. |
| Several large JPGs (240-600KB each) | Medium | E.g. `vespa_ss90.png` (624KB), `60s-yogyakarta/jamnas_poster.jpg` (600KB), multiple `vw-yogyakarta/images/page_*.jpg` (240-370KB each). No evidence of WebP/AVIF versions. | Convert to WebP/AVIF with JPG fallback; target <150KB for hero-adjacent images. |
| No CDN cache-control tuning observed beyond Cloudflare defaults | Low | `cache-control: public, max-age=0, must-revalidate` on the HTML document (expected/correct for HTML) — not checked for static assets in this pass. | Verify static assets (images/video/fonts) have long `max-age` + immutable caching via Cloudflare Page Rules. |

*(No live Lighthouse/PageSpeed/CrUX field data was collected in this pass — no PageSpeed Insights API key or Google Search Console/CrUX credentials are configured. Scores above are estimated from asset sizes and lazy-load coverage, not measured LCP/INP/CLS numbers.)*

---

## 6. AI Search Readiness / GEO (Score: 25/100 — critical gap)

| Title | Severity | Description | Recommendation |
|---|---|---|---|
| AI crawlers blocked at the Cloudflare edge | Critical | See Technical SEO finding #1 above — this is the same issue, scored again here because it fully determines the GEO category. `ai-train=no` Content-Signal + explicit `Disallow: /` for GPTBot, Google-Extended, ClaudeBot, Applebot-Extended, meta-externalagent, CCBot, Bytespider means the site is structurally invisible to ChatGPT search, Perplexity, Google AI Overviews' training/grounding crawler, Meta AI, and Claude's web tools. | **This is a decision, not a bug** — resolve it deliberately: if AI-driven discovery matters for lead gen, selectively allow Google-Extended and GPTBot (both usually safe from a content-scraping standpoint since they're the ones powering AI Overviews/ChatGPT browsing, the actual GEO channels). Keep blocking pure training-data bots like CCBot/Bytespider if content-protection is still a priority. |

---

## 7. Images (Score: 60/100)

| Page | Total images | Missing alt | Lazy-loaded |
|---|---|---|---|
| `/` | 13 | 0 | 3 |
| `/en/` | 13 | 0 | 3 |
| `/60s-yogyakarta/` | 8 | 0 | 0 |
| `/vw-yogyakarta/` | 7 | 0 | 0 |

**What works:** 100% alt-text coverage across all pages — no accessibility/SEO gap there.

**Findings:**
| Title | Severity | Description | Recommendation |
|---|---|---|---|
| Inconsistent lazy-loading | Medium | Only 3/13 images lazy-loaded on main pages; 0 on both proposal pages. | Add `loading="lazy"` to every `<img>` below the fold (keep hero/above-fold images eager). |
| No modern image formats detected | Medium | All checked images are `.jpg`/`.png`; no `.webp`/`.avif` found. | Convert to WebP with fallback, or use `<picture>` with AVIF/WebP sources. |

---

## Coverage Notes / Limitations

- This audit ran directly against the **local repository files** plus a handful of **live checks** (robots.txt, sitemap.xml, response headers) — it did not do a full 500-page crawl (site only has 4 pages, so this is complete coverage of all pages).
- No DataForSEO, Google Search Console, GA4, or PageSpeed Insights credentials are configured, so this report has **no live SERP position, real CWV field data, backlink profile, or organic traffic data** — those would come from the `seo-google` / `seo-dataforseo` sub-skills once API access is set up.
- No Playwright-rendered screenshots were captured in this pass (visual/mobile-render check not run).
