# Action Plan — vespakita.com SEO

## Phase 1: Critical Fixes (This Week)

1. **Decide on the Cloudflare AI-crawler block.** Go to Cloudflare dashboard → Security → Bots (or "AI Crawl Control" / Content Signals settings) and confirm whether blocking GPTBot/Google-Extended/ClaudeBot/etc. is intentional. If GEO/AI-citation visibility matters, allow at minimum `Google-Extended` and `GPTBot`.
2. **Compress the hero videos.** Re-encode `60s-yogyakarta/vespa_kegiatanok.mp4` (19MB) and `jsp_landscape.mp4` (5.8MB) to <3MB, add poster images, set `preload="none"` or `preload="metadata"`.
3. **Add `/vw-yogyakarta/` to `sitemap.xml`** — copy the existing `60s-yogyakarta` `<url>` block pattern.

## Phase 2: High-Impact Improvements (Weeks 2-3)

4. Trim meta descriptions on `/` and `/en/` to ≤160 characters.
5. Add `loading="lazy"` to all below-the-fold images on all 4 pages (currently only 3/13 on main pages, 0 on proposal pages).
6. Convert large JPG/PNG assets (`vespa_ss90.png` 624KB, `jamnas_poster.jpg` 600KB, `vw-yogyakarta/images/page_*.jpg`) to WebP/AVIF.
7. Validate Event schema on both proposal pages against Google's Rich Results Test — confirm `startDate`/`location`/`offers` fields are present and correctly formatted.

## Phase 3: Content & Authority (Month 2)

8. If planning ongoing content (blog/articles), add author attribution + publish dates for E-E-A-T.
9. Consider adding `WebSite` schema with `SearchAction` for sitelinks search box eligibility.
10. Revisit homepage `<title>` to include a descriptive keyword phrase alongside the brand name.

## Phase 4: Monitoring & Iteration (Ongoing)

11. Set up Google Search Console + connect this project's GA4 property (already has `G-6LLXWQ6MMM`) to get real indexation status and organic traffic data — re-run this audit with the `seo-google` sub-skill once configured for field-data-backed CWV scores instead of estimates.
12. Re-run this audit after Phase 1-2 fixes to confirm score improvement, particularly Performance and AI Search Readiness categories (currently the two lowest at 45 and 25).
13. Add security headers (HSTS, CSP) via Cloudflare Transform Rules if feasible.
