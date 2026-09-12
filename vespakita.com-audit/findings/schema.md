# Schema.org / Structured Data Audit — vespakita.com

**Audited:** 2026-09-12
**Method:** Server-rendered HTML fetched via `render_page.py` (`--mode auto`), JSON-LD extracted with `--json-ld-output` (bounded artifacts, no raw markup pasted into this report). Homepage, both sponsorship "proposal" pages, a marketplace listing detail page, and three `/komunitas/c/{uuid}` profile pages were checked directly; results generalize across the sitemap's URL patterns (`sitemap-urls.txt`, 49 URLs across id/en locales).

All schema found on the site is **server-rendered in raw HTML** (present before any JS executes), so there is no client-side-injection risk for crawlers — a genuine strength to preserve in any fix.

---

## 1. Detection Results (what exists today)

| URL pattern | JSON-LD present | Types found |
|---|---|---|
| `/`, `/en/` | Yes (1 block) | `Organization` |
| `/60s-yogyakarta/` | Yes (1 block) | `Event` (+ nested `Organization`, `Place`, `PostalAddress`) |
| `/vw-yogyakarta/` | Yes (1 block) | `Event` (+ nested `Organization`, `Place`, `PostalAddress`) |
| `/marketplace/l/{uuid}` (id + en, sampled 1 of 15) | Yes (1 block) | `Product` (+ nested `Brand`, `Offer`) |
| `/marketplace/`, `/marketplace/semua/` (index) | **None** | — |
| `/komunitas/c/{uuid}` (sampled 3 of 3) | **None** | — |
| `/komunitas/`, `/komunitas/tongkrongan/`, `/komunitas/daftar/` (index) | **None** | — |

No Microdata or RDFa markup was found anywhere — everything is JSON-LD, which is correct per Google's preference. `@context` is consistently `https://schema.org` (HTTPS, correct) across every block found.

---

## 2. Validation Results

### 2.1 Homepage `Organization` — PASS (minor gaps only)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VespaKita",
  "alternateName": "Vespa Kita",
  "url": "https://www.vespakita.com/",
  "logo": "https://www.vespakita.com/logo.png",
  "description": "...",
  "knowsAbout": [...],
  "areaServed": "ID",
  "sameAs": ["instagram...", "youtube..."]
}
```
- ✅ Valid JSON, valid `@type`, absolute URLs, no placeholder text.
- ✅ `/en/` version correctly localizes `knowsAbout` strings (no duplicate-content schema issue between locales).
- ⚠️ No `@id` — recommended so other pages (Event `organizer`, marketplace `seller`) can reference the same canonical entity via `"organizer": {"@id": "https://www.vespakita.com/#organization"}` instead of repeating a bare name.
- ℹ️ Only 2 `sameAs` profiles (Instagram, YouTube) — add TikTok/Spotify/Apple Podcasts if VespaKita has active podcast distribution accounts, since this is described as a podcast media brand.
- Not a rich-result blocker either way — Organization markup mainly feeds the Knowledge Panel / brand entity, not a SERP snippet.

### 2.2 Proposal-page `Event` schema (`/60s-yogyakarta/`, `/vw-yogyakarta/`) — PASS with one completeness gap
Both blocks are structurally identical and valid:
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "...",
  "description": "...",
  "startDate": "2026-08-20",
  "endDate": "2026-08-23",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Yogyakarta menuju Jakarta (Jalur Pantai Utara)",
    "address": { "@type": "PostalAddress", "addressCountry": "ID" }
  },
  "organizer": { "@type": "Organization", "name": "...", "url": "..." },
  "image": "https://www.vespakita.com/.../logo-share.png"
}
```
- ✅ All Google-required Event properties present: `name`, `location`, `startDate`.
- ✅ Dates are ISO 8601. `eventStatus`/`eventAttendanceMode` use full schema.org URLs (correct enum form).
- ⚠️ `PostalAddress` only has `addressCountry: "ID"` — no `addressLocality`/`addressRegion`, even though the location name text mentions specific places ("Bantul", "Jakarta"). Google's guidelines want a locality-level address where known; add `addressLocality`/`addressRegion` for stronger local-event eligibility.
- ⚠️ No `offers` — acceptable since these are non-ticketed community touring events, not a rich-result blocker.
- ℹ️ Verify the `image` (`logo-share.png`) is ≥1200px wide per Google's Event image guideline — could not confirm dimensions from markup alone.

### 2.3 Marketplace listing `Product`/`Offer`/`Brand` — PASS with 2 validation issues + gaps
Full example (from `/marketplace/l/e0194a1f-4899-49fc-8cdc-9889af374289`):
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Exclusive 2 Tahun 2001",
  "description": "Original · 2001 · Yogyakarta. Rp 65.000.000. Dicek manual oleh tim VespaKita.",
  "image": ["...photo-1.jpg", "...photo-2.jpg", "...photo-3.jpg", "...photo-4.jpg", "...photo-5.jpg"],
  "sku": "e0194a1f-4899-49fc-8cdc-9889af374289",
  "url": "https://www.vespakita.com/marketplace/l/e0194a1f-4899-49fc-8cdc-9889af374289",
  "itemCondition": "https://schema.org/UsedCondition",
  "brand": { "@type": "Brand", "name": "Vespa" },
  "offers": {
    "@type": "Offer",
    "url": "...",
    "priceCurrency": "IDR",
    "price": 65000000,
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/UsedCondition",
    "areaServed": "ID"
  }
}
```
- ✅ This is genuinely good, already-implemented Product markup — better than most small marketplaces ship on day one. `name`, `image`, `offers.price`, `offers.priceCurrency`, `offers.availability` are all present (Google's required set for Merchant listing eligibility).
- ✅ `/en/` locale correctly points `url` at the `/en/` variant of the same listing and translates the description — no cross-locale duplication issue.
- ❌ **Validation error:** `itemCondition` is placed directly on the `Product` node. Per schema.org, `itemCondition` is a property of `Offer`/`Demand`, **not** `Product` — it's not a recognized Product property. It's already correctly present on `offers.itemCondition`, so the top-level copy on `Product` should simply be removed (harmless in Google's Rich Results Test today, but it's invalid vocabulary and a validator will flag "unknown field").
- ⚠️ **Missing `offers.seller`** — no seller entity (Organization or Person) is declared. For a marketplace whose value prop is "verified by our team," adding `seller` (VespaKita as the vetting/listing organization) strengthens trust signals and is expected by Google's Merchant listing experience.
- ⚠️ **Missing `offers.priceValidUntil`** — recommended by Google, particularly since listings can sit for weeks; without it, stale prices in search snippets are more likely.
- ℹ️ No `aggregateRating`/`review` — correctly omitted (these are one-off used-vehicle listings, not reviewed products; do not fabricate ratings).
- ℹ️ **Vehicle-specific schema (`Vehicle`/`Car` type, `vehicleModelDate`, `mileageFromOdometer`, etc.)**: schema.org supports this, and Google has a "vehicle listing" structured-data feature, but it is currently limited to specific countries/verticals and is not confirmed available for Indonesia-market used-scooter listings. **Do not prioritize** — stick with `Product`/`Offer`, which works globally for the Merchant listing experience.
- No `BreadcrumbList` on this page (see §3).

### 2.4 `/komunitas/c/{uuid}` community profile pages — FAIL (no schema at all, despite qualifying content)
All 3 sampled profiles (`967c6190…`, `90f26708…`, `58538998…`) have **zero JSON-LD**, yet each page visibly renders a real, dated, named event card, e.g.:
- `967c6190…`: "Road to Jakarta — Jamnas Vespa 60's Indonesia 2026", 20–23 Agustus 2026, ~300 peserta — this is the *same* event that already has valid Event schema on `/60s-yogyakarta/`, but the profile page presenting identical information has none.
- `90f26708…`: "Swingin' Summer VDUB 2026", 5–6 September 2026 — mirrors the Event schema already on `/vw-yogyakarta/`.
- `58538998…`: "The Broto's Vespa Race", 26–27 September (no year in the on-page text — should be confirmed), ~300 peserta — **no linked proposal page exists for this one, and no location/venue text is shown on-page at all.** This event currently could not get valid Event schema without additional venue data, since `location` is a required property for Event rich results.

This is the single highest-value gap: two of the three sampled communities already have all the data needed for Event schema (it just needs to be added to the profile page too, ideally via the same `Organization`/`@id` referencing pattern as the proposal pages), while the third needs a location field added to the underlying data model before Event schema can be validly generated.

Also missing on these pages: any `Organization`/`SportsOrganization`-equivalent markup describing the community itself (name, description, sameAs to their own socials if the platform captures them) — recommended addition below.

### 2.5 Category/index pages (`/marketplace/`, `/marketplace/semua/`, `/komunitas/`, `/komunitas/tongkrongan/`, `/komunitas/daftar/`) — no schema
Not a hard requirement (Google doesn't have a rich result for generic index/listing pages), but these are good `BreadcrumbList` candidates (see below) and optionally `CollectionPage`/`ItemList`.

---

## 3. Missing Opportunities (prioritized)

| Priority | Opportunity | Pages affected | Why |
|---|---|---|---|
| **Critical** | Add `Event` schema to `/komunitas/c/{uuid}` profile pages | All community profile pages | Real event title/date data already renders on-page but has zero machine-readable markup; two of three sampled events already have a matching Event block elsewhere that can be reused/synced |
| **High** | Remove invalid `itemCondition` from the `Product` node (keep it only on `Offer`) | All `/marketplace/l/{uuid}` pages | Invalid schema.org vocabulary usage |
| **High** | Add `offers.seller` to marketplace listings | All `/marketplace/l/{uuid}` pages | Trust signal + expected by Merchant listing experience |
| **Medium** | Add `offers.priceValidUntil` | All `/marketplace/l/{uuid}` pages | Google recommendation; avoids stale-price snippets |
| **Medium** | Add `BreadcrumbList` | Marketplace listings, komunitas profiles, both index sections | Both verticals use a nested URL structure (`/marketplace/l/{uuid}`, `/komunitas/c/{uuid}`) that has no visual or structured breadcrumb trail today |
| **Medium** | Add `addressLocality`/`addressRegion` to existing Event `PostalAddress` blocks | `/60s-yogyakarta/`, `/vw-yogyakarta/` (and any new komunitas Event blocks) | Currently only `addressCountry: "ID"` — too coarse for local-event eligibility |
| **Low** | Add `Organization` (or `@id` reference) for each community on its own profile page | `/komunitas/c/{uuid}` | Establishes the community as a distinct entity, reusable as `Event.organizer` |
| **Low** | Add `WebSite` + `SearchAction` on homepage | `/`, `/en/` | Sitelinks search box eligibility (optional; only matters if the site has real on-site search) |
| **Info only — no SERP benefit** | None found currently — do not add `FAQPage`. If any FAQ-style content exists elsewhere on the site, note that Google retired FAQ rich results for all sites (May 7, 2026); use plain content or `QAPage` for genuine user Q&A instead. | n/a | Per current Google policy |

**Do not implement:** `HowTo`, `SpecialAnnouncement`, `CourseInfo`/`EstimatedSalary`/`LearningVideo` — all deprecated/retired, not applicable here anyway.

**Vehicle-specific schema (`Vehicle`/`Car` type)**: noted as a future option, not a current recommendation — coverage/eligibility for Google's vehicle listing feature is not confirmed for this market; `Product`/`Offer` already covers the global Merchant listing surface.

---

## 4. Generated JSON-LD for Implementation

### 4.1 Fix: `Product` schema on marketplace listings (remove invalid property, add `seller` + `priceValidUntil`)
Replace the current block with (example values from the sampled listing — replace with the live listing's real values at render time):
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Exclusive 2 Tahun 2001",
  "description": "Original · 2001 · Yogyakarta. Rp 65.000.000. Dicek manual oleh tim VespaKita.",
  "image": [
    "https://res.cloudinary.com/cumlazou/image/upload/v1786932152/listings/e0194a1f-4899-49fc-8cdc-9889af374289/photo-1.jpg",
    "https://res.cloudinary.com/cumlazou/image/upload/v1786932155/listings/e0194a1f-4899-49fc-8cdc-9889af374289/photo-2.jpg",
    "https://res.cloudinary.com/cumlazou/image/upload/v1786932157/listings/e0194a1f-4899-49fc-8cdc-9889af374289/photo-3.jpg",
    "https://res.cloudinary.com/cumlazou/image/upload/v1786932158/listings/e0194a1f-4899-49fc-8cdc-9889af374289/photo-4.jpg",
    "https://res.cloudinary.com/cumlazou/image/upload/v1786932160/listings/e0194a1f-4899-49fc-8cdc-9889af374289/photo-5.jpg"
  ],
  "sku": "e0194a1f-4899-49fc-8cdc-9889af374289",
  "url": "https://www.vespakita.com/marketplace/l/e0194a1f-4899-49fc-8cdc-9889af374289",
  "brand": { "@type": "Brand", "name": "Vespa" },
  "offers": {
    "@type": "Offer",
    "url": "https://www.vespakita.com/marketplace/l/e0194a1f-4899-49fc-8cdc-9889af374289",
    "priceCurrency": "IDR",
    "price": 65000000,
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/UsedCondition",
    "areaServed": "ID",
    "seller": {
      "@type": "Organization",
      "name": "VespaKita",
      "url": "https://www.vespakita.com/"
    }
  }
}
```
Notes for implementation: `priceValidUntil` should be generated dynamically (e.g., listing creation date + 90 days, or a fixed rolling window), not hardcoded. `seller` uses the VespaKita organization since listings are vetted/verified by the platform team rather than exposing private-seller identity (consistent with the WA-contact privacy model).

### 4.2 New: `Event` schema for `/komunitas/c/{uuid}` profile pages
Example using the real, on-page data for `967c6190-f529-4418-b6cf-a0b36861d3cc` (Vespa 60's Yogyakarta):
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Road to Jakarta — Jamnas Vespa 60's Indonesia 2026",
  "description": "Touring lintas provinsi dari Yogyakarta menuju Jambore Nasional Vespa 60's Indonesia 2026 di Jakarta, melintasi jalur Pantura.",
  "startDate": "2026-08-20",
  "endDate": "2026-08-23",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Yogyakarta menuju Jakarta (Jalur Pantai Utara)",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Yogyakarta",
      "addressRegion": "DI Yogyakarta",
      "addressCountry": "ID"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "Vespa 60's Yogyakarta",
    "url": "https://www.vespakita.com/komunitas/c/967c6190-f529-4418-b6cf-a0b36861d3cc"
  },
  "url": "https://www.vespakita.com/komunitas/c/967c6190-f529-4418-b6cf-a0b36861d3cc"
}
```
This should be generated **programmatically from the same event-card data already rendering on the page** (title, date range, description), not hand-authored per community — the platform already has this data structured enough to drive the visual card, so the same source can feed the JSON-LD. For communities like "The Broto's Vespa Race" where no location is captured, either (a) add a location field to the event data model before emitting Event schema for that entry, or (b) omit the Event block for that specific event until location data exists (a partial/invalid Event block is worse than none).

### 4.3 New: `BreadcrumbList` for nested URL structure
Example for a marketplace listing page:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Beranda", "item": "https://www.vespakita.com/" },
    { "@type": "ListItem", "position": 2, "name": "Jual Beli", "item": "https://www.vespakita.com/marketplace/" },
    { "@type": "ListItem", "position": 3, "name": "Exclusive 2 Tahun 2001", "item": "https://www.vespakita.com/marketplace/l/e0194a1f-4899-49fc-8cdc-9889af374289" }
  ]
}
```
Example for a community profile page:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Beranda", "item": "https://www.vespakita.com/" },
    { "@type": "ListItem", "position": 2, "name": "Komunitas", "item": "https://www.vespakita.com/komunitas/" },
    { "@type": "ListItem", "position": 3, "name": "Vespa 60's Yogyakarta", "item": "https://www.vespakita.com/komunitas/c/967c6190-f529-4418-b6cf-a0b36861d3cc" }
  ]
}
```
Use the `/en/` equivalent URLs and localized labels ("Home", "Marketplace", "Community") on the English-locale pages.

---

## 5. Summary

- **What works:** Homepage `Organization` and both sponsorship proposal pages' `Event` schema are valid, correctly formatted (`https://schema.org`, ISO 8601 dates, absolute URLs), and — notably — the marketplace listing pages already ship a solid `Product`/`Offer`/`Brand` block with price, currency, availability, and condition. Everything is server-rendered, so no JS-rendering risk for crawlers. No deprecated types (`HowTo`, `SpecialAnnouncement`, etc.) are present anywhere.
- **What's broken:** One validation error — `itemCondition` incorrectly placed on the `Product` node instead of only on `Offer`.
- **Biggest gap:** `/komunitas/c/{uuid}` pages carry zero structured data despite displaying real, dated event content that in two of three sampled cases duplicates an Event block that already exists elsewhere on the site — this is the highest-leverage fix available.
- **Second gap:** No `BreadcrumbList` anywhere on the site, despite both the marketplace and komunitas sections having a clear nested URL hierarchy.
- **FAQPage:** none found on sampled pages; no action needed. If added elsewhere on the site in the future, treat as Info priority only (Google retired FAQ rich results for all sites May 7, 2026).
