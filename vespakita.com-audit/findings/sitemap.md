# Sitemap Audit — https://www.vespakita.com/sitemap.xml

Audited: 2026-09-12. Live sitemap fetched directly (HTTP 200, `Content-Type: application/xml`), cross-referenced against the generator source (`functions/sitemap.xml.js`) and `robots.txt`.

## Summary

| Check | Result |
|---|---|
| XML well-formed | ✅ Pass |
| URL / size limits (≤50k URLs, ≤50MB) | ✅ Pass (49 URLs, ~27KB) |
| All sitemap URLs return 200 | ✅ Pass (49/49, no redirects) — see caveat below |
| Duplicate `<loc>` entries | ✅ None found |
| hreflang reciprocity | ✅ Pass on all 20 id/en pairs that carry hreflang |
| Deprecated `priority`/`changefreq` | ℹ️ Present on every URL (Google ignores both) |
| `lastmod` validity | ✅ Valid W3C dates where present; not fabricated/identical |
| Admin tools excluded from sitemap | ✅ Both named admin pages excluded — **but see new 3rd admin tool found, below** |
| Robots.txt conflicts | ⚠️ One anti-pattern found (`/marketplace/admin/`) |
| Missing sections | 🛑 2 found: `/rate-card/` (unprotected internal draft) and `/komunitas/tongkrongan/admin/` (unprotected 3rd admin tool) |
| hreflang gaps beyond the known legacy pages | ⚠️ `/marketplace/semua/` also lacks hreflang, undocumented in the original reference set |

Location-page quality gates (30+/50+ location pages) are **not applicable** — the sitemap contains 0 location/city pages; the two "legacy" pages (`60s-yogyakarta`, `vw-yogyakarta`) are one-off local-brand pages, not a programmatic location template.

---

## 1. XML structure

- Declares `<?xml version="1.0" encoding="UTF-8"?>`, root `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="...">`.
- Parses cleanly with `xml.etree.ElementTree` — no syntax errors, no DOCTYPE, no BOM.
- 49 `<loc>` entries, no duplicates.
- Well under both caps: 49 URLs (limit 50,000) and ~27 KB uncompressed (limit 50 MB).
- Generated dynamically per-request by `functions/sitemap.xml.js` (Cloudflare Pages Function): 9 hand-authored bilingual pairs + 2 legacy singles + 1 unpaired page, plus every `status = 'published'` row from the `listings` and `communities` D1 tables (bilingual pairs each). This is a sound architecture — it self-updates as marketplace/community content is approved, unlike the old static file the code comment says it replaced ("only ever listed 5 URLs").

## 2. HTTP status of all 49 URLs

Checked every URL in the live sitemap (not just a sample): **all 49 return 200, no redirects.**

Spot-checked dynamic UUID pages specifically as requested:
- `/marketplace/l/{uuid}` × 12 IDs (+ EN pairs) → 200
- `/komunitas/c/{uuid}` × 3 IDs (+ EN pairs) → 200

**Caveat on status-code validation reliability**: this is a client-rendered SPA with a catch-all shell. A deliberately nonsense path, `https://www.vespakita.com/this-page-does-not-exist-xyz123/`, also returns **200**. So a raw 200 alone doesn't prove a static route is "real." However, the dynamic detail routes do have genuine server-side existence checks — a random, non-existent UUID (`/marketplace/l/00000000-0000-0000-0000-000000000000`) correctly returns **404**. That means the 200s on the 15 UUID-based sitemap entries are meaningful evidence those are real published records, not SPA-shell false positives. Recommendation: sitemap health monitoring for this site should check for real content/soft-404 signals on the hand-authored static pages, since status code alone won't catch a broken static route.

## 3. Deprecated tags (priority / changefreq)

Every one of the 49 entries carries both `<priority>` and `<changefreq>`. Google has publicly ignored both for years. Severity: Info — no functional harm, but:
- The relative priority scheme is internally sensible (id versions consistently outrank their en counterpart: home 1.0/0.8, marketplace hub 0.9/0.7, listing detail 0.7/0.5, komunitas hub 0.8/0.6, community profile 0.6/0.4, daftar 0.4/0.3, legacy pages flat 0.6).
- `changefreq: hourly` on `/komunitas/tongkrongan/` and its EN pair is unrealistic even as a hint — cosmetic issue only since Google ignores it.
- Recommendation: safe to strip `priority`/`changefreq` entirely from the generator to reduce file size and maintenance surface; no ranking/crawl impact either way.

## 4. `lastmod` accuracy

- Only the 20 dynamic listing/community URLs carry `<lastmod>`, sourced from `published_at`/`submitted_at` in D1 — this reflects real record dates, not boilerplate. Good practice: dates are varied and realistic (`2026-08-17` through `2026-09-11`), not a single mass-stamped date.
- The 9 hand-authored bilingual pages, the 2 legacy pages, and `/marketplace/semua/` have **no `<lastmod>`** at all. Not a spec violation (the tag is optional), but if the generator can access real deploy/edit dates for these static pages, adding accurate `lastmod` would be a minor freshness-signal improvement. Do not fabricate — omission is preferable to a fake identical date.
- All present `lastmod` values are valid `YYYY-MM-DD` W3C Datetime strings, none in the future relative to today (2026-09-12).

## 5. hreflang reciprocity

Programmatically verified all 20 URL pairs that carry `xhtml:link` alternates: **every id↔en pair's hreflang set is byte-identical in both directions** (id, en, and x-default all resolve consistently). No broken reciprocity found.

Three entries have **no hreflang tags at all**:
1. `/60s-yogyakarta/` — per the audit brief, known/expected, but inconsistent with every other page in the file.
2. `/vw-yogyakarta/` — same as above.
3. **`/marketplace/semua/` — not called out in the original reference set, found independently.** Source comment in `functions/sitemap.xml.js` confirms this is intentional today: `// No EN build exists for this one yet, unlike the pages above.` This is a live, indexable, `changefreq: daily` core marketplace filter page that inconsistently ships with zero hreflang annotation (not even a self-referencing `hreflang="id"`/`x-default`), unlike its sibling `/marketplace/` and `/en/marketplace/`. Recommend either shipping the `/en/marketplace/semua/` build and wiring up proper reciprocal hreflang, or at minimum adding a self-referencing hreflang pair to keep the file internally consistent until then.

## 6. Missing / extra pages vs. site sections

**Extra pages in sitemap that 404 or redirect:** none — all 49 return 200 with no redirects (see caveat in §2).

**Missing from sitemap — 2 findings:**

1. **`/rate-card/` — HIGH severity, not just "missing," actively unprotected.** This is a real, live page (200 OK) at the top level of the site, not referenced anywhere in `functions/sitemap.xml.js`. Its `<title>` is literally **"VespaKita — Rate Card (Draft Internal)"** — this reads as an internal/draft document that was never meant to be public. It:
   - is not linked from the homepage, `/marketplace/`, or `/komunitas/` nav (orphan page, found only via directory listing in the repo),
   - has **no `<meta name="robots">` tag**,
   - is **not blocked in `robots.txt`**,
   - serves a linked PDF (`VespaKita_Rate_Card.pdf`) alongside it.
   Correctly excluded from the sitemap, but with zero crawl/index protection it can still be indexed if discovered by a crawler or linked externally, and the "Draft Internal" title would look bad in search results. **Recommendation: add `noindex, nofollow` (and ideally a robots.txt disallow or auth-gate) immediately if this is meant to stay internal; otherwise clean up the title/content and make it a real public page.**

2. **`/komunitas/tongkrongan/admin/` — HIGH severity — a third, undocumented admin tool with no protection at all.** Distinct directory/route from `/komunitas/admin/`. It is:
   - live (200 OK),
   - correctly excluded from the sitemap (not in the generator's hand-authored list, not sourced from D1),
   - **not covered by `robots.txt`** (`Disallow` only lists `/marketplace/admin/`),
   - **has no `<meta name="robots">` noindex tag** (unlike its two sibling admin pages, both of which do carry `noindex, nofollow`).
   This is the least-protected of the three admin surfaces on the site. **Recommendation: add `noindex, nofollow` to match `/marketplace/admin/` and `/komunitas/admin/`, and add it to the `robots.txt` disallow list.**

No other missing content sections were found. `/marketplace/jual/` (listing submission) and `/komunitas/login/` were spot-checked and are correctly absent from the sitemap — they're functional/auth-gated action pages, not canonical content pages, so exclusion is appropriate.

## 7. Admin-page exclusion (as specifically requested)

`/marketplace/admin/` and `/komunitas/admin/` are **correctly excluded** from `sitemap.xml` — confirmed against all 49 `<loc>` entries and against the generator source, which has no path that could ever emit either URL.

However, their indexation-protection is inconsistent, and a **third** admin tool was found with none:

| Admin page | robots.txt Disallow | `<meta robots noindex>` | Assessment |
|---|---|---|---|
| `/marketplace/admin/` | ✅ Yes | ✅ Yes | ⚠️ Anti-pattern: robots.txt block prevents crawlers from ever fetching the page to see the noindex tag — if any external site links to it, it could appear indexed with no snippet ("no information is available for this page"). Recommend keeping only the `noindex` meta tag (stronger for full deindexing) and dropping the robots.txt line, or accept the low residual risk since it's low-traffic/admin-only. |
| `/komunitas/admin/` | ❌ No | ✅ Yes | ✅ Correct — noindex-only is the right pattern (crawlable so the tag is honored, but never indexed). |
| `/komunitas/tongkrongan/admin/` | ❌ No | ❌ **No** | 🛑 Unprotected — see §6, finding 2. |

## 8. robots.txt cross-check

- `Sitemap: https://www.vespakita.com/sitemap.xml` is correctly declared.
- No URL present in the live sitemap is blocked by `robots.txt` — all 49 sitemap entries are under paths allowed by the `Disallow: /marketplace/admin/` rule (none of them touch that path). Pass.
- Cloudflare-managed AI-bot block section (`GPTBot`, `Google-Extended`, `ClaudeBot`, etc. → `Disallow: /`) does not affect sitemap validity, but is worth flagging to whichever team owns overall Technical SEO if AI-search visibility (GEO) matters — it's outside this sitemap audit's scope.

## 9. Note on stale prior finding

The existing `audit-data.json` → "Technical SEO" category contains a finding titled **"/vw-yogyakarta/ missing from sitemap.xml"** with severity High. This is now **stale/incorrect** — a fresh fetch of the live sitemap confirms `/vw-yogyakarta/` (and `/60s-yogyakarta/`) **are** present (lines present, both without hreflang, consistent with what the audit brief already expected). This sitemap audit supersedes that finding; recommend removing or correcting it in the Technical SEO category to avoid duplicate/contradictory reporting.

---

## Findings (severity-ranked, for `audit-data.json`)

1. **HIGH** — `/rate-card/` is a live, unprotected "Draft Internal" page: no noindex, no robots.txt block, not in sitemap, orphaned (unlinked). Risk of accidental indexing of internal content.
2. **HIGH** — `/komunitas/tongkrongan/admin/` (a third admin tool) has no noindex meta tag and no robots.txt disallow, unlike its two sibling admin pages.
3. **MEDIUM** — `/marketplace/admin/` combines a robots.txt `Disallow` with a `noindex` meta tag — a known anti-pattern that can prevent Google from ever seeing the noindex directive.
4. **LOW** — `/marketplace/semua/` ships with zero hreflang annotation (not even self-referencing), inconsistent with every other paired page in the sitemap; code comment confirms this is a known gap pending an EN build.
5. **LOW** — `/60s-yogyakarta/` and `/vw-yogyakarta/` also lack hreflang tags (matches the audit brief's known reference), inconsistent with the rest of the file.
6. **INFO** — `priority`/`changefreq` present on all 49 URLs; both are ignored by Google and safe to remove.
7. **INFO** — 9 hand-authored static pages have no `<lastmod>`; acceptable (optional tag) but could be improved if real edit dates are available.
8. **INFO** — Existing "Technical SEO" category finding claiming `/vw-yogyakarta/` is missing from the sitemap is stale and should be corrected/removed.

## What's working well

- Sitemap is dynamically generated from the live D1 database (listings/communities), so it self-updates as content is published/removed — a materially better architecture than a hand-maintained static file.
- hreflang reciprocity is 100% correct across all 20 pairs that have it.
- `lastmod` values on dynamic pages are real, varied, and sourced from actual content dates — not fabricated.
- Both named admin tools (`/marketplace/admin/`, `/komunitas/admin/`) are correctly excluded from the sitemap.
- No 404s, no redirects, no duplicate URLs, no size/count limit issues.
