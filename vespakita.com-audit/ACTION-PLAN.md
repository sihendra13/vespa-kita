# Action Plan — vespakita.com SEO Audit

## Phase 1: Critical Fixes (Week 1)
1. **Disable Cloudflare Pages SPA-fallback** and ship a real `404.html` returned with an actual 404 status. Leave the already-correct dynamic-route Function 404s (`/marketplace/l/[id].js`, `/komunitas/c/[id].js`) untouched.
2. **Add a Cloudflare redirect rule**: `vespakita.com/*` → 301 → `https://www.vespakita.com/$1`.
3. **In the Cloudflare dashboard (AI Crawl Control / WAF — not robots.txt)**, allow `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, and `Claude-SearchBot`. This is a ~15-minute dashboard change; editing robots.txt will not fix it, since these bots are already allowed there.
4. **Add `noindex, nofollow`** to `/rate-card/` and `/komunitas/tongkrongan/admin/`, and add both paths to `robots.txt` `Disallow` alongside the existing `/marketplace/admin/` entry.
5. **Resolve the `/komunitas/` intent inversion**: rewrite the `<title>` and `<h1>` to commit to one primary intent. Recommended: keep the sponsor-matching pitch (it's the real business model), and move directory-browsing to a clearly labeled secondary section rather than contesting it in the title tag.

## Phase 2: High-Impact Improvements (Weeks 2–3)
6. **Server-render `/komunitas/`, `/marketplace/semua/`, and the homepage "Event" widget** — reuse the existing `functions/api/communities.js` / `functions/api/marketplace-listings.js` D1-backed data at request time instead of only client-fetching it. This single change resolves findings independently raised by the Technical, SXO, and GEO passes.
7. **Add an H1 and Organization/Club JSON-LD** to `/komunitas/c/{id}` community profile pages.
8. **Extend `/marketplace/l/{id}` title templates** to include model + "bekas" + city (e.g. `Vespa Exclusive 2 2001 Bekas — Yogyakarta | VespaKita Marketplace`), matching the terms every ranking competitor already uses.
9. **Add explicit `width`/`height`** (or CSS `aspect-ratio`) to all `<img>` tags; extend `loading="lazy"` to all below-the-fold images sitewide.
10. **Remove `user-scalable=no`** from the `/komunitas/tongkrongan/` viewport tag; use `touch-action: manipulation` on specific interactive elements if double-tap-zoom interference was the original concern.
11. **Add security headers** (HSTS, a report-only CSP baseline, X-Frame-Options) via a Cloudflare Pages `_headers` file, at minimum on `/marketplace/admin/*` and `/komunitas/admin/*`.
12. **Fix the `/marketplace/admin/` robots.txt + noindex combination** — keep only the `noindex` meta tag; a robots.txt `Disallow` on the same URL prevents crawlers from ever seeing the noindex directive.

## Phase 3: Content & Authority (Month 2)
13. **Re-run the Content Quality and Performance specialist passes to completion** — both were cut off at their analysis turn-limit this round and are not yet real findings, just partial signal.
14. **Write one clear, quotable 120–160 word paragraph** stating VespaKita's three business pillars together (media brand + marketplace + community sponsor-matching) — on the homepage and in `Organization.description`. No such passage currently exists anywhere on the site.
15. **Standardize on a single Instagram/social handle** across schema, footer, and social links (currently 3 different handles compete for the brand identity).
16. **Add IndexNow ping** on new marketplace listing / community publish, so new UUID pages are discovered faster than sitemap re-crawl alone allows.
17. **Consider city- or model-scoped marketplace browse URLs** (e.g. `/marketplace/yogyakarta/`) — every ranking competitor for the core "jual vespa {city}" query encodes this in the URL path; VespaKita currently has zero such landing pages.
18. **Manually spot-check marketplace listing quality/pricing** as part of the existing vetting process — one sampled listing was priced well outside the comparable market band with description text that reads as possibly machine-translated. Worth checking given "dicek manual oleh tim kami" is the marketplace's core trust claim.

## Phase 4: Monitoring & Iteration (Ongoing)
19. Connect/confirm Google Search Console is verified for the domain; confirm GA4 (`G-6LLXWQ6MMM`, already installed) is capturing traffic to the newer `/komunitas/` and marketplace sections.
20. **Re-run this audit after Phase 1–2 land** to confirm score improvement and close out Content Quality, Performance, and Visual/Mobile as fully-scored categories.
21. Add self-referencing `hreflang` to `/60s-yogyakarta/`, `/vw-yogyakarta/`, and `/marketplace/semua/` for consistency with the rest of the sitemap (low priority, cosmetic).

---

**Why this order**: Phase 1 items are either genuinely broken right now (soft-404s, the AI-crawler block, an unprotected internal page) or actively working against a core business goal (the `/komunitas/` sponsor-matching pitch getting buried by its own title tag). Phase 2 is the single highest-leverage architectural fix (server-rendering the client-fetched hubs) plus cheap, mechanical wins. Phase 3 requires either content-writing work or finishing the two incomplete specialist passes. Phase 4 is the feedback loop that tells you whether any of this actually moved the needle.
