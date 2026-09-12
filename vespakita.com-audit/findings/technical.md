# Technical SEO Findings — www.vespakita.com

Audited 2026-09-12. Crawl set: the 49 URLs in `sitemap-urls.txt` plus robots.txt, sitemap.xml, and out-of-sitemap probes (apex domain, admin path, 404 behavior). All checks below are from live fetches (`curl`, `sitemap_discovery.py`, `render_page.py`), not inferred.

**Technical Score: 68 / 100**

Architecture note (confirmed against local repo): dynamic detail pages (`functions/marketplace/l/[id].js`, `functions/komunitas/c/[id].js`, and their `/en/` mirrors) are Pages Functions that render full HTML server-side. Directory/index pages (`/komunitas/`, `/marketplace/semua/`, homepage event widget) are static HTML shells that populate content client-side via `fetch('/api/...')`. This split is the source of most Medium/High findings below.

---

## What Works

- **Sitemap is valid and correctly declared.** `sitemap_discovery.py` confirms `https://www.vespakita.com/sitemap.xml` is declared in robots.txt, returns 200, and validates as a proper `urlset` (49 URLs, matches the provided crawl set).
- **Bidirectional hreflang is implemented correctly** on every ID/EN pair checked, including the UUID-based dynamic pages: homepage, `/marketplace/`, `/komunitas/`, `/komunitas/tongkrongan/`, `/komunitas/daftar/`, both sampled `/marketplace/l/{uuid}` pairs, and both sampled `/komunitas/c/{uuid}` pairs all carry reciprocal `hreflang="id"`/`hreflang="en"` plus `x-default` pointing at the ID version. No orphaned or one-way hreflang targets found in the sample.
- **Canonicals are self-referencing and correct** on every page checked, including on the apex-domain duplicate (see Critical #2) and on `/marketplace/admin/` (canonical absent but page is noindexed anyway).
- **Admin path is properly protected**: `/marketplace/admin/` is disallowed in robots.txt *and* independently carries `<meta name="robots" content="noindex, nofollow">` *and* is gated behind a password prompt in the HTML. Defense-in-depth is correctly layered here.
- **Dynamic detail pages are server-rendered**, not JS-dependent: `/marketplace/l/{uuid}` and `/komunitas/c/{uuid}` (both ID and EN) return full content, correct `<title>`, meta description, canonical, and hreflang directly in the raw HTML with no client fetch required to see the primary content.
- **Product structured data on marketplace listings is well-formed**: valid `Product` JSON-LD with `name`, `image[]`, `sku`, `brand`, and a nested `Offer` with `priceCurrency: IDR`, numeric `price`, `availability`, and `itemCondition`. Validated by direct JSON parse, no syntax errors.
- **Organization schema present on homepage** (`@type: Organization` with `name`, `url`, `logo`, `knowsAbout`).
- **Bad dynamic-route IDs correctly 404**: `/marketplace/l/00000000-0000-0000-0000-000000000000` returns a true 404 (Pages Function validates against D1 and fails closed) — contrast with the sitewide soft-404 issue below.
- **HTTP→HTTPS redirect works**: `http://www.vespakita.com/` → 301 → `https://www.vespakita.com/`.
- **Trailing-slash normalization works**: `/komunitas` and `/marketplace` (no trailing slash) 308-redirect to the trailing-slash canonical form in one hop.
- **`pages.dev` → production domain redirect** is explicitly configured in `_redirects` (`https://vespa-kita.pages.dev/* https://www.vespakita.com/:splat 301`), preventing the Cloudflare Pages default subdomain from competing in the index.
- **Viewport tag present on all pages checked**, `width=device-width, initial-scale=1.0` (or `1` with `viewport-fit=cover` on the legacy event pages).
- **ID/EN content is genuinely localized**, not just a wrapper: diffing the ID vs EN listing page for the same UUID shows 132 differing lines (meta description, body copy) — this is real translation, not duplicate content with a language switch.
- **60s-yogyakarta / vw-yogyakarta hreflang omission is consistent, not a bug**: neither page has an `/en/` counterpart anywhere on the site (no such path in the sitemap or in the `/en/` function tree), so the absence of hreflang tags on these two is correct self-referencing behavior for untranslated pages, not an inconsistency. No action needed here — flagging as resolved per the brief's "check if intentional" ask.

---

## Findings

### Critical

**1. Sitewide soft-404: every unmatched URL returns HTTP 200 with homepage content instead of a 404.**
- Evidence: `curl -o /dev/null -w "%{http_code}"` against `/nonexistent-page-xyz/`, `/another-fake-path-999`, `/wp-admin/`, `/totally-made-up-random-path-8271`, and even `/marketplace/l/` (no ID) all return **200**, serving the literal homepage HTML — same `<title>VespaKita - Vespa Untuk Kita Semua</title>`, `<meta name="robots" content="index, follow">`, and `<link rel="canonical" href="https://www.vespakita.com/">`.
- Also affects `/indexnow.txt`, which returns 200 but is the homepage HTML, not a key file — meaning no real IndexNow key file exists at the expected path despite a 200 status masking that fact.
- Root cause (confirmed against repo): `_redirects` only contains a `pages.dev`→production rewrite; there is no explicit 404 handling. This 200-for-everything behavior matches Cloudflare Pages' "Single Page Application mode" fallback (serves `index.html` with a 200 for any unmatched path), which is almost certainly enabled in the Pages project settings — a bad fit for a mostly-static multi-page site.
- Impact: Google Search Console will flag these as **Soft 404s**; any mistyped/expired/scraper-guessed URL gets treated as indexable duplicate homepage content, which wastes crawl budget on a site that already runs infinite-looking UUID space (`/marketplace/l/*`, `/komunitas/c/*`) and can dilute homepage's own indexing signals via duplicate-canonical confusion at scale.
- Recommendation: Disable Cloudflare Pages' SPA/"not found" fallback for this project (Workers & Pages → project → Settings → Builds, or via `_redirects`/`_routes.json` depending on how it's configured), and add a real `404.html` returned with an actual 404 status for unmatched paths, keeping the explicit dynamic-route Functions (which already 404 correctly) unaffected.

**2. Apex domain (`vespakita.com`) serves full content directly with HTTP 200 instead of redirecting to `www`.**
- Evidence: `curl -sI https://vespakita.com/` returns `200`, not a 301/308 to `https://www.vespakita.com/`. Byte-for-byte diff between the apex and `www` homepage bodies is empty (`diff | wc -l` → 0) — it's the identical page served on two hostnames.
- Mitigating factor: the canonical tag on the apex response correctly points to `https://www.vespakita.com/`, so well-behaved crawlers should consolidate signals — but this relies entirely on canonical compliance rather than an authoritative redirect, and doesn't stop the apex host from being crawled, indexed as a soft duplicate, or from splitting link equity if anyone links to the bare domain.
- Recommendation: Add a Cloudflare-side redirect rule (Bulk Redirect or a Page Rule) forcing `vespakita.com/*` → `301` → `https://www.vespakita.com/$1`, so host canonicalization is enforced at the edge, not just via a hint tag.

### High

**3. Community directory (`/komunitas/`) and full marketplace listing (`/marketplace/semua/`) render their primary content only client-side.**
- Evidence: raw HTML for `/komunitas/` contains `<div id="kom-grid" class="kom-grid reveal"></div>` — empty — with the actual listing populated by `fetch('/api/communities')` in an inline script. `render_page.py --mode auto` independently classified the page as `is_spa: False` (so it does NOT even trigger the tool's own Playwright fallback) and its `extracted_text` for `/komunitas/` was only 470 characters of unrelated CTA/testimonial copy — none of the actual community directory content.
- Same pattern on `/marketplace/semua/`: `<div id="listing-grid" class="listing-grid"></div>` is empty in raw HTML, populated via `fetch('/api/marketplace-listings')`.
- Impact: this is the directory/index layer that is supposed to funnel crawl equity to the individual `/komunitas/c/{uuid}` and `/marketplace/l/{uuid}` pages — but a crawler that doesn't execute JS (Bingbot's JS budget is inconsistent, most social/AI/aggregator crawlers, and even Google under crawl-budget constraints on a low-authority newer site) will see an empty grid and find zero internal links to the detail pages from these hub pages. Since detail pages are also UUID paths with no other on-site discovery path evident from the sample, sitemap.xml becomes the sole discovery mechanism if these hubs aren't rendered — that's a fragile single point of failure for internal linking.
- Recommendation: Server-render at least the link list (even a minimal `<a href="/komunitas/c/{id}">Name</a>` grid) in the initial HTML from the same Functions/D1 backend already used by `functions/api/communities.js` and `functions/api/marketplace-listings.js`, then progressively enhance with the existing client JS for filtering/interactivity. This is the same SSR pattern already proven working on the detail pages.

**4. Homepage "Highlight Event" section is entirely client-fetched and shows a loading placeholder in raw HTML.**
- Evidence: raw homepage HTML shows `<div id="next-events-grid">...<p>Memuat event...</p></div>` (literally "Loading events..."), with event cards built client-side in JS from `(c.events || [])` extracted out of the `fetch('/api/communities')` response.
- Impact: this is exactly the "dynamic Event section" flagged in the audit brief — a crawler or link-preview bot that doesn't execute JS sees only a loading spinner, not the event names/dates/community links, meaning this content and its internal links effectively don't exist for non-JS consumers or for social share unfurls.
- Recommendation: same fix pattern as #3 — server-render the event list at request time (or at build/deploy time via a scheduled sitemap-style regeneration) since the underlying data already lives in D1 and is already being queried per-page-load.

### Medium

**5. No HSTS, CSP, X-Frame-Options, or Permissions-Policy headers on any page checked.**
- Evidence: `curl -sI` on homepage, `/en/`, and other sampled pages shows only `x-content-type-options: nosniff` and `referrer-policy: strict-origin-when-cross-origin`. No `strict-transport-security`, `content-security-policy`, `x-frame-options`, or `permissions-policy` header appears anywhere in the response set gathered.
- Impact: not an indexing blocker, but this is a real security/hardening gap that Google's security signals and manual reviewers increasingly weight, and leaves the site without protocol-downgrade protection (no HSTS) or clickjacking protection (no frame-ancestors/X-Frame-Options) on a site that handles a password-gated admin panel and (per project context) a WA-contact marketplace flow.
- Recommendation: Add via Cloudflare Pages `_headers` file (already supported by the platform): `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, a baseline `Content-Security-Policy` (start report-only to avoid breaking the inline `<script>` blocks used throughout the site), and `X-Frame-Options: SAMEORIGIN` (or `frame-ancestors 'self'` via CSP) at minimum on `/marketplace/admin/*`.

**6. `/komunitas/tongkrongan/` disables pinch-zoom.**
- Evidence: viewport meta on both `/komunitas/tongkrongan/` and its `/en/` mirror is `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` — no other page in the sample sets `user-scalable=no`.
- Impact: this is a WCAG 2.1 (1.4.4 Resize Text / 1.4.10 Reflow) and mobile-usability anti-pattern; Google's mobile-friendliness signals and accessibility audits penalize disabling pinch-zoom, and it actively harms low-vision users on a chat/feed UI where zooming is a normal expectation.
- Note per brief: this section ("Tongkrongan") was flagged as a feature you didn't build yourself — evaluating it as-is, this viewport setting should still be corrected regardless of authorship.
- Recommendation: Remove `maximum-scale=1.0, user-scalable=no` from the viewport tag; if the concern was double-tap-zoom interfering with chat UI gestures, handle that with `touch-action: manipulation` in CSS on the specific interactive elements instead of disabling zoom globally.

**7. Images lack explicit `width`/`height` attributes (CLS risk).**
- Evidence: on the homepage, `grep -o '<img[^>]*>' | grep -c 'width='` → **0 of 38** `<img>` tags have a `width` attribute; only 17 of 38 have `loading="lazy"`.
- Impact: without intrinsic size hints, the browser cannot reserve layout space before the image downloads, which is a direct contributor to Cumulative Layout Shift, particularly for the sponsor-logo marquee and hero imagery that load above the fold.
- Recommendation: Add explicit `width`/`height` (or `aspect-ratio` via CSS) to all `<img>` tags, especially the above-the-fold logo and hero images; extend `loading="lazy"` to the remaining below-the-fold images (currently only 17/38 have it).

**8. No structured data on community profile pages.**
- Evidence: `grep -o '"@type":"[^"]*"'` (and the pretty-printed variant) against both the ID and EN `/komunitas/c/{uuid}` samples returned nothing — no JSON-LD block present at all on these pages, unlike the marketplace listing pages which have full `Product` schema.
- Impact: missed opportunity for rich results (e.g., `Organization` or a custom `SportsOrganization`/`Club`-style entity with `sameAs` links to social profiles) on pages that otherwise have unique, well-differentiated content per the ID/EN diff check.
- Recommendation: Add a lightweight `Organization` JSON-LD block (name, url, logo/avatar if available, `sameAs` for community social links) to the community profile Function template, mirroring the pattern already used on the homepage and marketplace listings.

### Low / Info

**9. `Content-Signal` robots.txt directive sets `ai-train=no` for all crawlers by default, layered under Cloudflare's managed AI-blocklist preset.** This is Cloudflare's default managed content block (confirmed by the `# BEGIN/END Cloudflare Managed content` markers) rather than a custom choice, and is consistent with the brief's description. No action needed unless the intent is to selectively allow specific AI crawlers for `ai-input`/discovery use cases (e.g., allowing ChatGPT/Perplexity referral traffic while still blocking `ai-train`) — currently `GPTBot`, `ClaudeBot`, `Google-Extended`, etc. are fully disallowed (`Disallow: /`), which also blocks their non-training crawl-for-answer use cases, not just training.
- Robots.txt vs. sitemap consistency: confirmed clean — the one path disallowed (`/marketplace/admin/`) does not appear in `sitemap.xml`, and every URL in the sitemap is allowed by the effective robots rules. No conflict.
- **`marketplace/semua/` and the legacy event pages have no hreflang block** — correct, since none of these have translated counterparts in the `/en/` tree (confirmed by directory listing of `functions/en/`). Not a defect.
- IndexNow: no evidence of IndexNow key-file or ping-on-publish implementation was found (`/indexnow.txt` resolves to the homepage soft-404 fallback, not a real key). Given the marketplace/community content changes frequently (new listings, new profiles), wiring `functions/api/marketplace-listings.js` / community-approval flow to ping IndexNow (Bing/Yandex/Naver) on publish would speed up non-Google discovery of new UUID pages, which otherwise depend on sitemap re-crawl frequency alone.
- `report-to`/`nel` (Network Error Logging) headers are present and correctly scoped to Cloudflare's own endpoint — no action needed, noted for completeness only.

---

## Summary Table

| Category | Status |
|---|---|
| Crawlability (robots.txt) | Pass, with soft-404 caveat (Critical #1) |
| Sitemap consistency | Pass |
| Indexability / canonicals | Pass on-page; apex-host duplication unresolved at edge (Critical #2) |
| hreflang | Pass — bidirectional, x-default present, no orphans found |
| Security headers | Fail — missing HSTS/CSP/X-Frame-Options (Medium #5) |
| HTTPS | Pass |
| URL structure / redirects | Pass, except apex-domain (Critical #2) and soft-404 (Critical #1) |
| Mobile viewport | Pass, except zoom-disable on Tongkrongan (Medium #6) |
| Core Web Vitals (static signals) | Needs improvement — missing image dimensions (Medium #7) |
| Structured Data | Partial — strong on Product/Organization, missing on community profiles (Medium #8) |
| JS rendering dependency | Fail on directory/hub pages and homepage event widget (High #3, #4); Pass on detail pages |
| IndexNow | Not implemented (Low #9) |

---

Files referenced during this audit:
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/vespakita.com-audit/sitemap-urls.txt`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/_redirects`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/sitemap.xml.js`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/marketplace/l/[id].js`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/en/marketplace/l/[id].js`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/komunitas/c/[id].js`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/en/komunitas/c/[id].js`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/api/marketplace-listings.js`
- `/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/functions/api/communities.js`
