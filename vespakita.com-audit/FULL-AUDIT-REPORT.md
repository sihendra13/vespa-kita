# SEO Audit — vespakita.com
**Date:** 2026-09-12 · **Scope:** 49 sitemap URLs, live edge fetches, SERP-backwards analysis
**Coverage:** 5 of 8 planned specialist passes completed in full (Technical, Sitemap, GEO, SXO, plus a partial Schema pass). Content Quality, Performance, and Visual/Mobile stopped at their analysis turn-limit before writing full findings — see the note in each section.

## Health Score: 52/100 (partial coverage — directional, not final)

This is not a full-confidence score. It's weighted only across the categories where an agent actually finished with real evidence (Technical, On-Page/SXO, Schema-partial, GEO, Images, Sitemap). Content Quality and Performance — two of the largest weight categories in a normal audit — did not complete, so the true score could move meaningfully in either direction once those are re-run.

## Business Type
Independent Vespa media brand (podcast, event coverage, brand collaboration) + a curated peer-to-peer Vespa marketplace + a community directory that matches Vespa clubs with event sponsors.

---

## Top 5 Critical/High Findings

1. **`/komunitas/` fights itself (SXO, Critical).** Title/meta sell a directory; H1/hero sell a B2B sponsor-matching pitch. Neither a rider looking for a club nor an organizer looking for sponsor help is served by the same page.
2. **Sitewide soft-404 (Technical, Critical).** Every mistyped or nonexistent URL returns HTTP 200 with homepage content — Cloudflare Pages' SPA fallback, not real 404 handling. On a site with an open UUID URL space, this is a scaling problem, not a cosmetic one.
3. **ChatGPT Search, Perplexity, and Claude are 403'd at the edge (GEO, Critical).** A Cloudflare WAF/AI Crawl Control rule blocks these bots by user-agent — separate from, and worse than, the robots.txt AI-training block. robots.txt actually *allows* all five; the block is enforced elsewhere and reading robots.txt alone hides this.
4. **`/marketplace/` advertises zero inventory to crawlers (SXO, High).** Static HTML ships literal "no listings yet" copy while 15 real listings exist, injected client-side only.
5. **Three unprotected internal/admin surfaces (Sitemap, High).** `/rate-card/` (a "Draft Internal" page) and `/komunitas/tongkrongan/admin/` (password-gated, but not noindexed or robots-blocked like its two sibling admin tools) are both crawlable and indexable right now.

**One root cause explains three of these independently-raised findings**: `/komunitas/`, `/marketplace/` + `/marketplace/semua/`, and the homepage's "Event" widget are all static shells populated entirely by client-side `fetch()`. Technical, SXO, and GEO each flagged this on their own, from different angles — fixing it once (server-render these hub pages, reusing the same D1-backed API already in place) resolves all three.

---

## Category Breakdown

| Category | Score | Status |
|---|---|---|
| Technical SEO | 68/100 | Complete |
| On-Page SEO / SXO | 35/100 | Complete |
| Content Quality | — | **Incomplete** (crawled, not scored) |
| Schema / Structured Data | 60/100 | Partial |
| Performance (CWV) | — | **Incomplete** |
| AI Search Readiness (GEO) | 32/100 | Complete |
| Images | 35/100 | Complete (via Technical pass) |
| Sitemap | 80/100 | Complete |

Full detail for each category is in `findings/*.md`. Screenshots (desktop + mobile, homepage/marketplace/komunitas) are in `screenshots/` — captured but not yet written up into a formal Visual findings doc.

### Technical SEO — 68/100
What works: valid sitemap, fully correct bidirectional hreflang including on UUID pages, correct self-referencing canonicals, properly layered admin protection on `/marketplace/admin/`, genuinely server-rendered detail pages with valid Product/Organization schema, working HTTPS and trailing-slash redirects, real (not wrapper) ID/EN translation.

Critical: sitewide soft-404 (see above); apex domain `vespakita.com` serves identical content instead of redirecting to `www` (protected only by a canonical tag).

High: `/komunitas/`, `/marketplace/semua/`, and the homepage event widget are client-fetch-only.

Medium: no HSTS/CSP/X-Frame-Options headers anywhere; `/komunitas/tongkrongan/` disables pinch-zoom; 0 of 38 homepage images have width/height attributes; no structured data on community profile pages.

### On-Page SEO / SXO — 35/100
SERP-backwards analysis across 4 page types found `/marketplace/l/{id}` is the strongest page on the site (server-rendered, valid Product+Offer+Brand schema) — it's the template to replicate. `/komunitas/` and `/marketplace/` both scored Critical/High on intent-match: see findings above. Community profile pages have no H1 at all. Brand identity is split across three different-looking social handles in Google's eyes vs. the site's own schema.

### Content Quality — Incomplete
The subagent crawled all 49 pages successfully but hit its turn limit before writing scored findings. Indirect signal from SXO's page inventory: static word counts of 106–642 across the 4 sampled page types, which is thin by conventional standards — though several of these pages are client-rendered, so true rendered content is higher than what a non-JS reading shows. **Recommend re-running this pass before treating Content Quality as audited.**

### Schema / Structured Data — 60/100 (partial)
Valid Product+Offer+Brand JSON-LD on marketplace listings; Organization schema on the homepage. Missing entirely on community profile pages (confirmed independently by two separate passes). The dedicated schema agent was mid-writeup (BreadcrumbList, WebSite/SearchAction, Event schema recommendations) when it hit its turn limit — see `findings/schema.md` for the fuller partial detail.

### Performance (CWV) — Incomplete
The performance agent confirmed Cloudinary's `w_800,q_auto,f_auto` transform is correctly applied to listing/community thumbnails before stopping at its turn limit — no measured LCP/INP/CLS numbers were produced this round. A separate, older scan (not from this audit run) had flagged three autoplaying hero videos at 19MB/5.8MB/1.2MB as a likely major LCP risk; **treat that figure as unconfirmed carryover, not fresh data**, until re-verified.

### AI Search Readiness (GEO) — 32/100
The headline finding here is the WAF-level block on ChatGPT/Perplexity/Claude search bots (above) — worse than and separate from robots.txt. Two corrections to a prior pass's assumptions: blocking `Google-Extended` does **not** affect Google AI Overviews (that follows Googlebot, confirmed 200), and blocking `Applebot-Extended` does not affect Siri/Spotlight either — both are training-only signals, a defensible content-protection choice independent of AI-search visibility. Separately: no single page states what VespaKita actually is (three business pillars live on three separate pages, no About page exists); passage-level citability is very low (longest extractable text block sitewide is 44 words, well under the ~134–167 word band AI citation tends to favor).

### Images — 35/100
0 of 38 homepage images have explicit width/height (CLS risk); only 17/38 are lazy-loaded. Cloudinary transforms are confirmed correctly applied on the delivery side.

### Sitemap — 80/100
Strongest category. Dynamically generated from live D1 data, 100% hreflang reciprocity, both known admin tools correctly excluded, no 404s/redirects/duplicates among 49 checked URLs. The real issues are things *not* in the sitemap: `/rate-card/` and a third undocumented admin tool (`/komunitas/tongkrongan/admin/`) are both live and unprotected from indexing.

---

## Notable Findings Outside Pure SEO

- **Marketplace listing quality control**: the SXO pass sampled one live listing priced at Rp 65 juta for a 2001 Vespa Exclusive against a SERP-established market band of Rp 20–40 juta, with description text ("Mesin enak tinggal pakai tidak ada, tidak perlu service") and a disclosed-faults field ("Tidak pernah sipakai") that read as possibly machine-translated or low-effort. Worth a manual spot-check given VespaKita's core differentiator is "dicek manual oleh tim kami."
- **Brand entity confusion**: Google surfaces `@vespakita.co` for the brand name; the site's own schema/footer reference `@ves_pakita` and `@VespaKitaSemua` elsewhere — three distinct-looking handles competing for one brand identity.

## Limitations
- Playwright/headless-Chromium could not install on this machine (`mac13-arm64` unsupported), so post-JS-render text extraction was not verified independently — analysis relied on pre-JS HTML, source-code inspection, and live API calls to confirm real data volumes instead.
- WebSearch used for SERP analysis is US-locale; page-type consensus (directory vs. listing vs. editorial) is robust, but exact ranking positions would need an ID-geolocated tool before acting on them.
- Content Quality, Performance, and Visual/Mobile passes did not complete — see each section above.
