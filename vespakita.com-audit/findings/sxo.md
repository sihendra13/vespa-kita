# Search Experience Optimization (SXO) Findings — vespakita.com

**Audit date:** 2026-09-12
**Analyst method:** SERP-backwards (classify what ranks → classify target → measure gap)
**Scope:** 4 commercially important page types — homepage, `/marketplace/`, `/marketplace/l/{id}`, `/komunitas/`
**Note:** SXO Gap Score is a separate metric from the SEO Health Score. Do not merge them.

---

## Executive Summary — Lead Finding

**PRIMARY FINDING (CRITICAL): `/komunitas/` is two different pages fighting each other.**

The page's `<title>` and meta description sell a **directory** ("Direktori Komunitas Vespa
di seluruh Indonesia — cari komunitas sesuai kotamu"). The page's H1 and entire above-the-fold
hero sell a **B2B sponsorship brokerage service** ("PUNYA EVENT? DAPATKAN DUKUNGAN SPONSOR").

This is an intent inversion, not a minor copy issue:

- The searcher Google sends from *"komunitas vespa jogja"* is a **rider looking for a club to
  join**. They land on a pitch asking them to submit their community for sponsor matching.
- The searcher who would actually want the sponsor pitch (*"cara dapat sponsor event komunitas"*)
  faces a SERP that is **100% how-to guides and proposal templates** — a format this page does
  not provide at all (no process explanation, no proposal guidance, no rate/deliverable detail).

Neither audience is served. The page simultaneously mismatches both of the SERPs it is
positioned against. **Severity: CRITICAL.**

**Secondary finding (HIGH): `/marketplace/` renders as an empty store to first-pass crawlers
and to anyone on a slow connection.** The static HTML served at `/marketplace/` contains the
literal empty-state copy *"Belum Ada Listing Saat Ini — Marketplace ini baru saja dibuka. Jadi
penjual pertama di sini."* There are in fact **15 live listings** (11 units, 4 spareparts) in
the D1 database, but all of them are injected client-side from `/api/marketplace-listings`.
The pre-JS document that Google's first crawl wave sees advertises zero inventory.

---

## 1. Target Page Inventory (as parsed)

| Page | Title | H1 | Static word count | Schema | Render model |
|---|---|---|---|---|---|
| `/` | VespaKita - Vespa Untuk Kita Semua | `VESPA KITA` | 642 | Organization | Static + JS event feed |
| `/marketplace/` | Marketplace Vespa Terkurasi \| VespaKita | `JUAL BELI VESPA & AKSESORIS TANPA TAKUT KENA TIPU` | 254 | **none** | Static shell + JS grid |
| `/marketplace/semua/` | Semua Listing Vespa \| VespaKita Marketplace | `Semua Vespa Dijual` | **41** | **none** | Static shell + JS grid |
| `/marketplace/l/{id}` | `Exclusive 2 Tahun 2001 - Rp 65.000.000 \| VespaKita Marketplace` | `Exclusive 2 Tahun 2001` | 86 | Product + Offer + Brand | **Server-rendered (Pages Function)** |
| `/komunitas/` | Direktori Komunitas Vespa \| VespaKita | `PUNYA EVENT? DAPATKAN DUKUNGAN SPONSOR` | 106 | **none** | Static shell + JS grid |
| `/komunitas/c/{id}` | `Vespa 60's Yogyakarta \| Komunitas VespaKita` | **no H1 at all** | 137 | **none** | Server-rendered |

Live data volume (fetched from public APIs):
- `/api/marketplace-listings` → **15 items**. Cities: Yogyakarta ×6, Jakarta ×2, Depok ×2,
  Bogor, Sukabumi, Malang, Bandung, Serang. Price range Rp 200.000 – Rp 275.000.000.
- `/api/communities` → **3 items** (RF ScooVeter Team, Vespa 60's Yogyakarta,
  Volkswagen Club Yogyakarta).

Total sitemap size: 49 URLs (25 unique ID pages × 2 languages + hand-authored pages).

---

## 2. SERP Analysis

### 2.1 Keyword: `jual vespa yogyakarta`

| # | Result | Page type (taxonomy) |
|---|---|---|
| 1 | instagram.com/vespalalu | Social seller profile |
| 2 | olx.co.id `/yogyakarta-di_g2000032/q-vespa` | **Category / Inventory Listing** |
| 3 | olx.co.id `/yogyakarta-kota_g4000072/motor-bekas_c200/q-vespa` | **Category / Inventory Listing** |
| 4 | oto.com `/motor-baru/vespa/s/harga-yogyakarta` | Price-guide (Hybrid) |
| 5 | olx.co.id `/yogyakarta-di_g2000032/motor-bekas_c200/q-vespa` | **Category / Inventory Listing** |
| 6 | oto.com `/motor-baru/vespa/sprint/harga-yogyakarta` | Price-guide (Hybrid) |
| 7 | olx.co.id `/yogyakarta-di_g2000032/motor_c87/q-vespa` | **Category / Inventory Listing** |
| 8 | zigwheels.co.id `/motor-baru/vespa/sprint/harga/yogyakarta/` | Price-guide (Hybrid) |
| 9 | en.wikipedia.org/wiki/Yogyakarta | Irrelevant / entity bleed |

**SERP consensus: Category/Inventory Listing page — 4/8 relevant results (50%),
price-guide Hybrid 3/8 (37.5%).** Confidence: **HIGH (88%)** that Google wants a page
which *lists actual units filtered to a city*.

**The decisive structural signal:** every single ranking URL encodes the city
(`/yogyakarta-di_g2000032/`) and often the category (`/motor-bekas_c200/`) **in the path**.
Google is rewarding faceted inventory URLs. VespaKita has **zero** city-scoped or model-scoped
marketplace URLs. `/marketplace/` and `/marketplace/semua/` are the only two browse URLs.

SERP features observed: no featured snippet; no AI Overview surfaced; heavy price-anchoring
in titles ("Harga Murah", "Terlengkap"); "Motor Bekas" category token recurs in 5 of 8 URLs.

### 2.2 Keyword: `marketplace vespa terpercaya` / `jual beli vespa bekas`

| # | Result | Page type |
|---|---|---|
| 1 | tokopedia.com/find/motor-vespa-bekas | **Category / Inventory Listing** |
| 2 | shopee.co.id/list/Vespa/Bekas | **Category / Inventory Listing** |
| 3 | instagram.com/vespasecond.id | Social seller profile |
| 4 | tokopedia.com/find/motor-bekas-vespa | **Category / Inventory Listing** |
| 5 | olx.co.id/bekasi-kota_g4000020/motor-bekas_c200/q-vespa | **Category / Inventory Listing** |
| 6 | mobil123.com/motor-dijual/vespa/indonesia | **Category / Inventory Listing** |
| 7 | olx.co.id/motor-bekas_c200/q-vespa | **Category / Inventory Listing** |
| 8 | vesparkindo.com/vespa-for-sale/ | Dealer inventory page |
| 9 | shopee.co.id/list/Motor/Vespa/Klasik | **Category / Inventory Listing** |

**SERP consensus: Category/Inventory Listing — 7/9 (78%). Confidence: VERY HIGH (92%).**

Important secondary read: **the word "terpercaya" does not pull a single editorial
"which marketplace is safest" article.** Google resolves the trust modifier by showing the
big-brand marketplaces themselves. VespaKita's entire differentiation ("dicek manual oleh
tim kami") is a claim Google currently has **no query surface to reward** — because no one
is searching for it and no comparison-format page ranks for it. This is a positioning
problem, not just an on-page problem.

### 2.3 Keyword: `vespa excel 2 bekas 2001 harga` (listing-detail intent)

| # | Result | Page type |
|---|---|---|
| 1 | lacakharga.com/kendaraan/vespa-excel-2002 | Price-guide / aggregator |
| 2–7, 9–10 | olx.co.id `/motor-bekas_c200/q-vespa-excel` + city variants | **Category / Inventory Listing** |
| 8 | motorplus-online.com — "Segini Harga Vespa Exclusive Dan Excel..." | Blog Post |

**SERP consensus: Category/Inventory Listing 70%, Price-guide/editorial 30%.**

Critical insight for listing detail pages: **Google is not ranking individual listing URLs
for model queries — it ranks the filtered collection.** Individual listing pages win long-tail
only. And the market price band this SERP establishes for a 2001 Excel/Exclusive is
**Rp 20–40 juta**. The audited VespaKita listing is priced at **Rp 65 juta** with an 86-word
description and no justification content. That is a direct conversion/trust liability, not
only an SEO one.

### 2.4 Keyword: `komunitas vespa indonesia`

| # | Result | Page type |
|---|---|---|
| 1 | otomotif.kompas.com — "Komunitas Vespa Indonesia Diakui..." | **Blog Post / News** |
| 2 | facebook.com/groups/vespa.ind | Social group |
| 3 | otomotif.kompas.com — "Kata Orang Eropa Tentang..." | **Blog Post / News** |
| 4 | top1.co.id/berita/... | **Blog Post / News** |
| 5 | komunita.id/listing-tag/komunitas-vespa/ | **Directory listing** |
| 6 | instagram.com/vespaclubindonesia | Social profile |
| 7 | vespaworldclub.org/national-clubs/indonesia/ | Entity/Org page |
| 8 | astraotoshop.com/article/anak-vespa | **Blog Post** |

**SERP consensus: Editorial Blog/News — 4/8 (50%). Directory format: 1/8 (12.5%).**
Confidence: MEDIUM-HIGH (75%) that this head term is **informational, not navigational-to-directory**.

### 2.5 Keyword: `komunitas vespa jogja` / `daftar klub vespa indonesia`

For `komunitas vespa jogja`: news articles (detikoto, Harianjogja ×2, humanonwheels),
**individual community homepages** (vesparty.id), Instagram club profiles, and a
Motoplex dealer content page. Dominant: Blog Post / individual-community entity page.

For `daftar klub vespa indonesia`: **this is where the directory format wins** — scribd
club register, vespaecka.blogspot list, vespariwisata list, makassar-scooter list,
scootman "Daftar Club kalian Disini", komunita.id. **Directory/list format ≈ 70%.**

**This is the actionable split.** The directory format only earns the SERP when the query
carries a `daftar` / `direktori` / `list` modifier. The high-volume head terms
(`komunitas vespa indonesia`, `komunitas vespa jogja`) want **editorial profiles of specific
communities**. VespaKita has exactly the right asset for this (`/komunitas/c/{id}` profile
pages with real communities) — but those pages currently ship **with no H1 and no schema**.

### 2.6 Keyword: `cara dapat sponsor event komunitas motor`

100% informational: proposal templates (satriaclubparung blogspot, pdfcoffee), how-to guides
(mudaberdaya.id, evoriaevent.com, vcube.co.id, zonabikers.com, jurnalbikers.com).
**Zero service/brokerage landing pages rank.** Confidence: VERY HIGH (95%) informational.

### 2.7 Keyword: `vespakita` / media-partner positioning

Branded search surfaces Instagram `@vespakita.co`, a YouTube channel `@vespakita-tulungagung`,
and Facebook `Vespa Java Indonesia` — **but not vespakita.com in the returned link set**, and
crucially **the brand's own declared socials are `@ves_pakita` and `@VespaKitaSemua`, which
differ from the `@vespakita.co` account Google surfaces for the brand name.** There is an
entity-disambiguation problem: at least three distinct "Vespa Kita" entities compete for the
brand term and Google is not resolving vespakita.com as the canonical one.

---

## 3. Page-Type Mismatch Matrix

| Page | Target keyword cluster | SERP dominant type | Target page actual type | Severity |
|---|---|---|---|---|
| `/komunitas/` | komunitas vespa {kota}, direktori komunitas | Blog Post / entity profile (head), Directory (daftar-modified) | **Landing Page (B2B service pitch)** | **CRITICAL** |
| `/marketplace/` | jual vespa {kota}, vespa bekas | Category / Inventory Listing | **Landing Page + Lead-capture Form** | **HIGH** |
| `/marketplace/semua/` | vespa dijual, semua vespa | Category / Inventory Listing | Category shell, 41 words, no facets | **HIGH** |
| `/` | vespakita (brand), media vespa indonesia | Social profile / entity page | Hybrid (media brand + B2B landing) | **HIGH** |
| `/marketplace/l/{id}` | {model} {tahun} {kota} bekas | Product (long-tail) / Category (head) | **Product Page** | **MEDIUM** |
| `/komunitas/c/{id}` | {nama komunitas} | Entity profile / Blog Post | Entity profile — but no H1, no schema | **MEDIUM** |

### 3.1 Mismatch detail: `/komunitas/` — CRITICAL

Evidence from static source (`komunitas/index.html`):

- `<title>`: "Direktori Komunitas Vespa | VespaKita"
- Meta: "Direktori komunitas Vespa di seluruh Indonesia — cari komunitas sesuai kotamu,
  lihat event & kegiatan mereka, atau daftarkan komunitasmu sendiri gratis."
- `<h1>`: "PUNYA EVENT? DAPATKAN DUKUNGAN SPONSOR"
- Hero body: "VespaKita siap membantu komunitas kamu mendapatkan dukungan sponsor..."
- Primary CTAs: "Daftarkan Komunitas" / "Lihat Jejaring Komunitas"
- Above-the-fold stat bar: "2 Partner Komunitas · 4 Mitra Brand · 227+ Total Anggota"
- H2s: "Sinergi yang Menghidupkan Skena" (success story), "Jejaring Komunitas & Event"
- The directory itself is **client-fetched** from `/api/communities` and appears **below**
  a full success-story section and a partner-logo band.

Three compounding problems:

1. **Title/H1 contradiction.** Google uses both as relevance signals. A page whose title
   says "directory" and whose H1 says "get sponsors" gives contradictory topic signals and
   will be diluted for both.
2. **The directory has 3 entries.** Against SERP competitors listing 33+ IMI-registered
   clubs (scribd) and dozens (vespaecka, komunita.id), a 3-entry directory cannot win
   `daftar klub vespa` even if the page type were corrected.
3. **The stat bar is an anti-trust signal at this scale.** "2 Partner Komunitas" displayed
   prominently above the fold tells a visiting community organizer the network is nearly
   empty. Competitors don't display their counts because they don't need to; VespaKita is
   volunteering its weakest number.

### 3.2 Mismatch detail: `/marketplace/` — HIGH

Evidence from static source (`marketplace/index.html`):

- Static HTML contains H3 `Belum Ada Listing Saat Ini`, `Belum Ada Sparepart`,
  `Belum Ada Unit Saat Ini` — all three empty states ship in the pre-JS document.
- Fallback copy: *"Marketplace ini baru saja dibuka. Jadi penjual pertama di sini."*
- Only 2 images in static HTML; all listing photography is JS-injected.
- The seller-submission form (`Ajukan Listing`) is a very long inline form — name, WA,
  Instagram (required), model & year, price, condition, location, document status, tax
  status, ownership status, description, disclosed faults, 2–5 photos, mandatory ≤60s video.
  This form consumes the majority of the page's text content (it is most of the 254 words
  of parseable copy).
- **No filter, sort, or facet UI**. No city selector, no model selector, no price range.
- **No `ItemList` schema, no `CollectionPage`, no pagination markup.**

Against a SERP where 7–9 of 10 results are faceted inventory grids, this page reads to Google
as a **supply-side lead-capture landing page**, not a marketplace browse page. The trust
proposition ("dicek manual", "tanpa perantara", "gratis") is genuinely strong copy — it is
simply on a page type that the query does not summon.

### 3.3 Mismatch detail: `/marketplace/l/{id}` — MEDIUM

This is the **best-built page type on the site.** It is server-rendered by a Cloudflare Pages
Function (`functions/marketplace/l/[id].js`), so the full content and a valid
`Product` + `Offer` + `Brand` JSON-LD block are in the initial HTML. That is correct and
should be preserved.

The mismatch is narrower but consequential — **the title and H1 do not contain the words a
searcher types**:

- Actual title: `Exclusive 2 Tahun 2001 - Rp 65.000.000 | VespaKita Marketplace`
- Actual H1: `Exclusive 2 Tahun 2001`
- Missing from both: **"Vespa"**, **"bekas"/"dijual"**, **"Yogyakarta"**

A user searching *"vespa exclusive 2001 yogyakarta"* gets no title match on brand or city.
The city ("Yogyakarta") exists in the body and in the meta description but not in the H1 or
title. Competitor OLX titles read "Vespa Excel - Motor Bekas Terlengkap Harga Murah di
Yogyakarta D.I." — brand + category + city, all three.

Additional gaps on this template:
- No `BreadcrumbList` schema (confirmed absent in source).
- `seller` is not expressed in the Product/Offer JSON-LD despite seller data being rendered.
- No `Vehicle`-family properties (`vehicleModelDate`, `mileageFromOdometer`,
  `vehicleEngine`, `vehicleConfiguration`) — the schema treats a motorcycle as a generic Product.
- No related-listings module → dead end after the WhatsApp CTA, no internal link equity flow,
  no recovery path if the unit is sold.
- The seller Instagram handle renders as a **raw URL including tracking parameters**:
  `@hendra_kayuwangi?igsh=NDRnZ2Uza2R2azBj&utm_source=qr`. This looks broken/spammy in a
  trust-critical position.
- Description quality is uncontrolled: the audited unit's description reads
  *"Mesin enak tinggal pakai tidak ada, tidak perlu service"* and the disclosed-faults field
  reads *"Tidak pernah sipakai"* (typo, and contradicts the listing being used). 86 words
  total against a Rp 65 juta ask.

### 3.4 Mismatch detail: Homepage — HIGH

- H1 is `VESPA KITA` — brand name only, zero descriptive keyword.
- Extracted body content is overwhelmingly **B2B**: media kit download, audience demographics
  ("96% Indonesia, laki-laki 25–44"), rate card, "Paket Starter / Paket Enterprise",
  "Booking Paket", and **three separate "Mari Berkolaborasi" CTAs** plus
  "PUNYA EVENT? KAMI SIAP JADI MEDIA PARTNER".
- The consumer-facing propositions (marketplace, komunitas) appear as H2 blocks well down
  the page with secondary CTAs ("Cari Vespa", "Pasang Iklan").
- The event highlight rail ships as `Memuat event...` in static HTML — another JS-dependent
  module with a loading-state string in the crawlable document.
- Podcast content links **out** to YouTube ("Tonton Episode Lengkap di YouTube" ×6). There
  are **no on-site episode pages** — the site's strongest E-E-A-T asset (original podcast
  interviews, event coverage) generates zero indexable content on vespakita.com. The sitemap's
  49 URLs contain no article, episode, or event pages.
- Schema is `Organization` only. No `WebSite` + `SearchAction`, no `PodcastSeries`,
  no `VideoObject`, no `Event`.
- `htmldate` resolves the homepage publication date to **2024-11-01**, while the page body
  claims "Update terakhir: 24 Agustus 2026". Freshness is asserted in prose but not in markup.

---

## 4. User Stories (derived from SERP signals)

Every story cites the signal that produced it.

### `/marketplace/` + `/marketplace/l/{id}`

**US-1 — Local Used-Vespa Hunter (Decision stage)**
> As a **rider in Yogyakarta with ~Rp 30 juta ready**, I want to **see every Vespa for sale
> near me, filtered by city and price**, because **I want to inspect and ride it before I pay**,
> but I'm blocked by **the page showing me no way to filter to my city — and on first load,
> no listings at all.**
> *Signal: 4 of 8 ranking URLs for `jual vespa yogyakarta` encode the city in the path
> (`/yogyakarta-di_g2000032/`). Target page has zero city-scoped URLs and ships
> "Belum Ada Listing Saat Ini" in static HTML.*

**US-2 — Scam-Wary First-Time Classic Buyer (Consideration)**
> As a **first-time classic Vespa buyer**, I want to **know this seller and these documents
> are real before I message anyone**, because **I've heard stories of BPKB-palsu and
> disappearing sellers**, but I'm blocked by **a curation claim I have no way to verify —
> no reviewer name, no check date, no completed-transaction history, no dispute path.**
> *Signal: "terpercaya" queries resolve to big-brand marketplaces (Tokopedia/Shopee/OLX/Mobil123),
> i.e. Google treats trust as a platform-scale property. Target page asserts
> "dicek manual oleh tim kami" with no evidence artifact.*

**US-3 — Model-Specific Price Researcher (Awareness)**
> As a **someone comparing what a 2001 Excel/Exclusive should cost**, I want to **see a price
> range with the factors that move it**, because **I don't want to overpay by 2×**, but I'm
> blocked by **an 86-word listing asking Rp 65 juta with no restoration history, no numbers-
> matching evidence, and no comparison to the Rp 20–40 juta market band.**
> *Signal: `vespa excel 2 bekas 2001 harga` returns lacakharga.com price-guide at #1 and a
> motorplus-online price editorial at #8 — the SERP contains a dedicated price-explanation
> layer that VespaKita has no page for.*

**US-4 — Seller Who Wants Reach, Not a Form (Decision)**
> As a **Vespa owner wanting to sell fast**, I want to **know how many buyers will actually
> see my listing**, because **filling a 14-field form plus a mandatory 60-second video is a
> lot of work**, but I'm blocked by **no audience/traffic proof anywhere on the submit flow —
> and the page telling me "jadi penjual pertama di sini."**
> *Signal: competing supply channels in the SERP (Instagram seller accounts @vespalalu,
> @vespasecond.id) require one post and zero verification. VespaKita's friction is far higher
> with no stated payoff.*

### `/komunitas/` + `/komunitas/c/{id}`

**US-5 — Rider Looking for a Club to Join (Awareness)**
> As a **new Vespa owner in Jogja**, I want to **find a local club whose vibe fits my bike
> and meet them at a kopdar**, because **"satu Vespa sejuta saudara" is most of why I bought
> the bike**, but I'm blocked by **landing on a page whose headline asks me about event
> sponsorship, with a 3-entry directory buried below a partner-logo band.**
> *Signal: `komunitas vespa jogja` SERP is dominated by community narratives (Harianjogja on
> Vespa 60s Jogja, humanonwheels, detikoto) and individual club sites (vesparty.id) — all
> answering "who are they and how do I join". Target page H1 answers a different question.*

**US-6 — Community Organizer Chasing Sponsors (Decision)**
> As a **ketua komunitas planning a jambore**, I want to **understand exactly what VespaKita
> does, what brands are in the network, and what I have to deliver**, because **I've already
> written proposals that got ignored**, but I'm blocked by **a single success story, a "2
> Partner Komunitas" counter that signals an empty network, and no explanation of the process,
> timeline, or what the sponsor expects in return.**
> *Signal: `cara dapat sponsor event komunitas motor` SERP is 100% procedural — proposal
> templates and step-by-step guides (evoriaevent, zonabikers, jurnalbikers, mudaberdaya).
> The audience expects process content; the page provides a pitch.*

**US-7 — Brand Marketer Vetting Community Reach (Consideration)**
> As a **brand activation manager evaluating Vespa-community channels**, I want to **see
> verified reach, past campaign outcomes, and audience overlap**, because **my budget needs
> defensible numbers**, but I'm blocked by **Instagram-Insights screenshots as the sole
> evidence, one case study, and a media kit behind a WhatsApp form.**
> *Signal: SERP for `media partner komunitas vespa` surfaces national outlets (Kompas Otomotif,
> Gridoto, detikCom Community Connect, Media Indonesia) and Piaggio Indonesia's own community
> programs — the competitive set is institutional media with published reach.*

Journey-stage coverage: Awareness (US-3, US-5), Consideration (US-2, US-7),
Decision (US-1, US-4, US-6). ✔

---

## 5. SXO Gap Scores

Seven dimensions, 100 points. **This is the SXO Gap Score, not the SEO Health Score.**

### 5.1 `/marketplace/` — 32/100 (Critical)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type | 5/15 | Landing page + lead form vs SERP consensus 78% inventory grid. No facets, no city/model URLs. |
| Content Depth | 4/15 | 254 static words, most of it form labels. Three "Belum Ada..." empty states in crawlable HTML. |
| UX Signals | 9/15 | Trust bullets and unit/sparepart tabs are good; no filter/sort/price-range; seller form dominates the scroll. |
| Schema | 0/15 | No `ItemList`, no `CollectionPage`, no `BreadcrumbList`, no `SearchAction`. Zero blocks. |
| Media | 3/15 | 2 images in static document; all listing photography JS-injected. |
| Authority | 6/15 | Curation claim present but unevidenced; no transaction count, no reviews, no verified-seller badge system. |
| Freshness | 5/10 | Listings are current in the DB but no `datePosted`/`dateModified` exposed in markup. |

### 5.2 `/komunitas/` — 29/100 (Critical)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type | 3/15 | Title promises directory, H1 delivers B2B sponsor pitch. Neither SERP is matched. |
| Content Depth | 3/15 | 106 static words. 3 communities, client-fetched, below the fold. |
| UX Signals | 8/15 | Clean hero and stat bar, but the stat bar advertises "2 Partner Komunitas"; no city filter; no map. |
| Schema | 0/15 | No `ItemList`, no `Organization`/`SportsClub` per community, no `Event`. |
| Media | 5/15 | 6 images, mostly partner logos; no community photography in the crawlable document. |
| Authority | 6/15 | One success story (Vespa 60's Yogyakarta / Jamnas), 4 brand partners, no third-party citation. |
| Freshness | 4/10 | No dates on communities or activities; Tongkrongan updates are polled via JS only. |

### 5.3 `/marketplace/l/{id}` — 63/100 (Needs Work, but structurally sound)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type | 12/15 | Correct Product page. Server-rendered. Loses points only on head-term competition (SERP wants collection). |
| Content Depth | 5/15 | 86 words. Description: "Mesin enak tinggal pakai tidak ada, tidak perlu service". Faults field: "Tidak pernah sipakai". |
| UX Signals | 11/15 | Gallery with pinch-zoom, view count (110), chat count (3), doc/tax/ownership badges, back-link. Missing: related listings, share, sold state. |
| Schema | 10/15 | Valid `Product`+`Offer`+`Brand`. Missing `seller`, `BreadcrumbList`, `Vehicle` props, `priceValidUntil`. |
| Media | 12/15 | 5 Cloudinary images in schema, 8 `<img>` on page, mandatory seller video. Strong. |
| Authority | 8/15 | "Dikurasi oleh Admin VespaKita" + seller IG; but IG handle renders with raw `?igsh=...&utm_source=qr` tracking params. |
| Freshness | 5/10 | No listed-date or last-verified date in markup or on page. |

### 5.4 Homepage — 53/100 (Needs Work)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type | 8/15 | Hybrid media-brand + B2B landing. Brand SERP is owned by social profiles; site doesn't consolidate the entity. |
| Content Depth | 7/15 | 642 words. Zero indexable podcast episodes, event recaps, or articles anywhere on the domain (49-URL sitemap). |
| UX Signals | 10/15 | Strong video hero, clear sections; but 3× identical "Mari Berkolaborasi" CTA serves one audience only; `Memuat event...` in static HTML. |
| Schema | 5/15 | `Organization` only. No `WebSite`/`SearchAction`, `PodcastSeries`, `VideoObject`, or `Event`. |
| Media | 12/15 | Hero video (`jsp_landscape.mp4` + poster), 37 images, reels rail. Genuine strength. |
| Authority | 7/15 | IG + YouTube `sameAs`, audience demographics, media kit PDF. No press mentions, no named author/host entity, no `Person` schema for the podcast host. |
| Freshness | 4/10 | `htmldate` → 2024-11-01; prose claims "Update terakhir 24 Agustus 2026"; no `dateModified` markup. |

**Site-wide systemic pattern:** Schema is the lowest dimension across three of four page
types (0, 0, 5). Content Depth is second-lowest (4, 3, 5, 7). The one page that scores well
(`/marketplace/l/{id}`) is the one that is **server-rendered with JSON-LD** — which is the
template to replicate everywhere else.

---

## 6. Persona Scoring

Personas derived from SERP signal clusters (§2). Seven personas; weighted toward commercial
intent because 78–88% of the analyzed SERPs are transactional.

### 6.1 `/marketplace/` (browse)

| Persona | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|
| Local Used-Vespa Hunter (US-1) | 8/25 | 5/25 | 12/25 | 7/25 | **32/100** | Critical Mismatch |
| Scam-Wary First-Timer (US-2) | 15/25 | 14/25 | 11/25 | 10/25 | **50/100** | Needs Work |
| Sparepart/Accessory Shopper | 9/25 | 8/25 | 11/25 | 8/25 | **36/100** | Critical Mismatch |
| Seller Seeking Reach (US-4) | 18/25 | 17/25 | 13/25 | 16/25 | **64/100** | Good |

**Weakest: Local Used-Vespa Hunter (32/100).**
Top issue: no city-scoped browse URL exists, and the pre-JS page says there are no listings.
Recommended fix: ship server-rendered facet pages at `/marketplace/vespa-dijual/{kota}/`
(start with `yogyakarta`, `jakarta`, `depok` — the three cities with ≥2 live units), each with
H1 `Vespa Bekas Dijual di {Kota} — {N} Unit Terkurasi`, an `ItemList` + `BreadcrumbList`
JSON-LD block, and the listing cards rendered server-side. Add a city chip row and a price
slider above the grid on `/marketplace/`. Delete every "Belum Ada Listing" string from the
static HTML and replace the fallback with server-rendered cards.

Note: the Sparepart Shopper scores 36 partly because **spareparts are 4 of 15 listings but
have no dedicated URL** — `/marketplace/` uses a JS tab, not a route. `/marketplace/sparepart-vespa/`
should exist.

### 6.2 `/marketplace/l/{id}` (detail)

| Persona | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|
| Local Used-Vespa Hunter (US-1) | 20/25 | 18/25 | 13/25 | 20/25 | **71/100** | Good |
| Scam-Wary First-Timer (US-2) | 19/25 | 16/25 | 10/25 | 17/25 | **62/100** | Good |
| Model-Specific Price Researcher (US-3) | 12/25 | 11/25 | 8/25 | 13/25 | **44/100** | Needs Work |
| Classic/Restoration Collector | 14/25 | 10/25 | 7/25 | 15/25 | **46/100** | Needs Work |

**Weakest: Model-Specific Price Researcher (44/100).**
Top issue: Rp 65 juta ask on a model whose SERP-established band is Rp 20–40 juta, with 86
words of justification and a contradictory faults field.
Recommended fix: make the submission form enforce a minimum description (e.g. 300 characters)
and add structured fields — `Riwayat Restorasi`, `Kelengkapan Original vs Repro`, `Nomor Rangka/Mesin Matching (Ya/Tidak)`, `Servis Terakhir`. Render these as a spec table on the detail
page and mirror them into `Vehicle` schema properties. Add a "Kenapa harga ini?" block that
the curator fills during review — that single block converts the curation claim from an
assertion into a visible artifact and lifts Trust for all four personas.

Second fix (cheap, high value): change the title/H1 template to
`Vespa {Model} {Tahun} Bekas — {Kota} | Rp {Harga} | VespaKita` and H1 to
`Vespa {Model} {Tahun} — {Kota}`. Add `BreadcrumbList` and `seller` to the JSON-LD. Add a
"Vespa lain di {Kota}" related rail (3–6 cards) to kill the dead end after the WhatsApp CTA.

### 6.3 `/komunitas/`

| Persona | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|
| Rider Looking for a Club (US-5) | 6/25 | 4/25 | 9/25 | 7/25 | **26/100** | Critical Mismatch |
| Community Organizer (US-6) | 17/25 | 15/25 | 9/25 | 16/25 | **57/100** | Needs Work |
| Brand Marketer (US-7) | 11/25 | 12/25 | 10/25 | 12/25 | **45/100** | Needs Work |
| Event-Goer Looking for Kopdar/Agenda | 7/25 | 6/25 | 8/25 | 6/25 | **27/100** | Critical Mismatch |

**Weakest: Rider Looking for a Club (26/100).**
Top issue: the H1 addresses a completely different persona than the one Google sends.
Recommended fix — **split the page into two**:

1. `/komunitas/` becomes a true directory. H1: `Direktori Komunitas Vespa Indonesia`.
   Server-render the community cards. Add city chips and `/komunitas/{kota}/` facet routes.
   Add `ItemList` JSON-LD, and `Organization`/`SportsClub` per entry.
2. Move the sponsor pitch to `/komunitas/sponsor/` (or `/kolaborasi/sponsor-event/`) with
   H1 `Dapatkan Sponsor untuk Event Komunitas Vespa`. Because that SERP is 100% procedural,
   the page must **lead with process content**: "5 Langkah Mendapatkan Sponsor Event Komunitas",
   a downloadable proposal template, what brands ask for, typical timeline. Put the
   "Daftarkan Komunitas" CTA after the guide, not before it. This converts a page that
   currently cannot rank at all into one that matches the dominant format.

Remove the "2 Partner Komunitas" counter until the number is impressive; replace with
"Komunitas terhubung di {N} kota" or the success-story outcome ("4 brand nasional").

The Event-Goer persona (27/100) is the cheapest win on the whole site: there is real event
data (`Memuat event...` rail on the homepage, community `Kegiatan` sections) that is currently
100% invisible to search. An `/event/` section with server-rendered `Event` schema per
kopdar/jambore would capture `kopdar vespa jogja`, `jambore vespa 2026`-class queries that
have no strong incumbent.

### 6.4 Homepage

| Persona | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|
| Brand Marketer (US-7) | 22/25 | 20/25 | 14/25 | 21/25 | **77/100** | Good |
| Rider Looking for a Club (US-5) | 10/25 | 9/25 | 13/25 | 9/25 | **41/100** | Needs Work |
| Local Used-Vespa Hunter (US-1) | 12/25 | 10/25 | 13/25 | 12/25 | **47/100** | Needs Work |
| Podcast/Content Audience | 13/25 | 12/25 | 15/25 | 8/25 | **48/100** | Needs Work |

The homepage is the only asset on the site that serves its primary persona well — but that
persona (Brand Marketer) is **the lowest-search-volume audience of the four**. The three
consumer personas that actually generate organic demand all score in the 40s.

**Systemic issue — Action dimension:** the Podcast Audience scores 8/25 on Action because
every content CTA is "Tonton Episode Lengkap di YouTube". Traffic is deliberately exported.
Fix: create `/podcast/{slug}/` pages with the embed, a transcript, guest `Person` schema, and
`PodcastEpisode` JSON-LD. This is the single highest-leverage E-E-A-T move available — it
converts existing original content into indexable pages and gives the domain topical depth
it currently does not have anywhere.

---

## 7. Priority Actions (ordered by weakest persona × volume weight)

1. **Split `/komunitas/`.** Directory at `/komunitas/`, sponsor service at `/komunitas/sponsor/`
   with procedural content. Fixes the CRITICAL mismatch and the 26/100 persona.
2. **Server-render every listing and community grid.** Remove all "Belum Ada Listing" and
   "Memuat event..." strings from crawlable HTML. Replicate the
   `functions/marketplace/l/[id].js` pattern for `/marketplace/`, `/marketplace/semua/`,
   and `/komunitas/`.
3. **Ship city facet routes.** `/marketplace/vespa-dijual/{kota}/` and `/komunitas/{kota}/`.
   This is the structural pattern every ranking competitor uses and VespaKita has none of it.
4. **Fix listing title/H1 template** to include `Vespa` + model + year + city. Zero-cost,
   immediate relevance gain.
5. **Add `ItemList` + `BreadcrumbList` JSON-LD** to all browse pages; add `seller`,
   `BreadcrumbList`, and `Vehicle` properties to listing detail.
6. **Add an H1 to `/komunitas/c/{id}`** (currently zero H1 tags) and `Organization`/`SportsClub`
   + `Event` schema. These profile pages match the dominant head-term SERP format and are
   currently crippled by a missing heading.
7. **Build `/podcast/{slug}/` episode pages.** Stop exporting the domain's only original
   E-E-A-T asset to YouTube.
8. **Make curation visible.** Reviewer name, verification date, and a "Kenapa harga ini?"
   note on each listing. Converts the core differentiator from claim to artifact.
9. **Resolve brand entity ambiguity.** `@vespakita.co` (surfaced by Google for the brand),
   `@ves_pakita` and `@VespaKitaSemua` (declared in `sameAs`) are not the same accounts.
   Reconcile, and add `WebSite` + `SearchAction` schema.
10. **Add price-context content** (`/harga-vespa-bekas/{model}/`) to intercept the
    price-guide layer the SERP shows at #1 for model queries.

---

## 8. Cross-Skill Referrals

- **E-E-A-T gaps** (no author/host entity, no on-site content archive, unverifiable curation
  claim) → run `/seo content`.
- **Missing schema** (`ItemList`, `BreadcrumbList`, `Event`, `Vehicle`, `PodcastEpisode`,
  `WebSite`+`SearchAction`, `Organization` per community) → run `/seo schema`.
- **Strong local intent** — every high-value marketplace and community SERP carries a city
  qualifier, and the brand is Yogyakarta-based → run `/seo local` for GBP and local-entity
  strategy.
- **Thin content** (`/marketplace/semua/` at 41 words, `/komunitas/` at 106,
  `/marketplace/l/{id}` at 86) → run `/seo page`.

---

## 9. Limitations

- **JavaScript rendering could not be executed.** Playwright refuses to install a browser on
  this host (`Playwright does not support chromium on mac13-arm64`). All analysis is based on
  (a) the pre-JS HTML served to first-wave crawlers, (b) direct reads of the local page source
  in the repo, and (c) direct calls to `/api/marketplace-listings` and `/api/communities` to
  confirm the real data volume. The post-JS visual experience and above-the-fold layout after
  hydration were **not** verified. Core Web Vitals, CLS from late-injected grids, and hydration
  timing are unassessed — and CLS is a real risk given how much content is JS-injected.
- **SERP data is from a US-locale search index.** Indonesian SERPs for these queries will
  differ in ordering, local-pack presence, and ad density. The *page-type consensus* (OLX-style
  faceted inventory dominating commercial queries; editorial dominating community queries) is
  robust across locales, but exact rankings should be re-verified with an ID-geolocated tool
  before acting on position-specific claims.
- **No SERP feature data captured** for People Also Ask, ad copy, AI Overview presence, or
  related searches — the search tool returns organic links only. User stories were therefore
  derived from result-type composition, URL structure patterns, and title-tag language rather
  than from PAA/ad signals. This is a weaker evidence base than the framework prefers.
- **Competitor page depth was not measured.** OLX/Tokopedia inventory counts per city, their
  schema implementations, and their internal linking were inferred from URL structure and
  titles, not crawled.
- **No GSC/analytics data.** Actual impressions, positions, and CTR for vespakita.com are
  unknown; persona volume weighting is an estimate from SERP commercial-intent density.
- **Wireframes not generated** (not requested). Available on request via
  `skills/seo-sxo/references/wireframe-templates.md`.

---

## 10. Structured Findings (for `audit-data.json`)

```json
{
  "category": "search_experience",
  "skill": "seo-sxo",
  "audit_date": "2026-09-12",
  "sxo_gap_scores": {
    "homepage": 53,
    "marketplace_browse": 32,
    "marketplace_listing_detail": 63,
    "komunitas_directory": 29
  },
  "primary_finding": {
    "severity": "CRITICAL",
    "page": "/komunitas/",
    "type": "intent_inversion",
    "detail": "Title/meta promise a community directory; H1 and hero deliver a B2B sponsorship-brokerage pitch. Neither the directory SERP nor the sponsorship SERP is matched."
  },
  "mismatches": [
    {"page": "/komunitas/", "serp_type": "blog_post_entity_profile", "actual_type": "landing_page", "severity": "CRITICAL"},
    {"page": "/marketplace/", "serp_type": "category_inventory_listing", "actual_type": "landing_page_lead_form", "severity": "HIGH"},
    {"page": "/marketplace/semua/", "serp_type": "category_inventory_listing", "actual_type": "thin_category_shell", "severity": "HIGH"},
    {"page": "/", "serp_type": "social_entity_profile", "actual_type": "hybrid_b2b_landing", "severity": "HIGH"},
    {"page": "/marketplace/l/{id}", "serp_type": "product", "actual_type": "product", "severity": "MEDIUM"},
    {"page": "/komunitas/c/{id}", "serp_type": "entity_profile", "actual_type": "entity_profile_no_h1", "severity": "MEDIUM"}
  ],
  "serp_consensus": [
    {"keyword": "jual vespa yogyakarta", "dominant_type": "category_inventory_listing", "confidence": 88},
    {"keyword": "marketplace vespa terpercaya", "dominant_type": "category_inventory_listing", "confidence": 92},
    {"keyword": "vespa excel 2 bekas 2001 harga", "dominant_type": "category_inventory_listing", "confidence": 70},
    {"keyword": "komunitas vespa indonesia", "dominant_type": "blog_post_news", "confidence": 75},
    {"keyword": "daftar klub vespa indonesia", "dominant_type": "directory_list", "confidence": 70},
    {"keyword": "cara dapat sponsor event komunitas motor", "dominant_type": "how_to_guide", "confidence": 95}
  ],
  "weakest_personas": [
    {"page": "/komunitas/", "persona": "Rider Looking for a Club", "score": 26},
    {"page": "/komunitas/", "persona": "Event-Goer Looking for Kopdar", "score": 27},
    {"page": "/marketplace/", "persona": "Local Used-Vespa Hunter", "score": 32},
    {"page": "/marketplace/", "persona": "Sparepart Shopper", "score": 36}
  ],
  "systemic_issues": [
    "schema_absent_on_3_of_4_page_types",
    "client_side_rendered_inventory_with_empty_state_in_static_html",
    "no_city_or_model_facet_urls",
    "no_indexable_original_content_podcast_events_exported_to_youtube",
    "brand_entity_ambiguity_across_social_accounts"
  ],
  "live_data_volume": {
    "marketplace_listings": 15,
    "marketplace_units": 11,
    "marketplace_spareparts": 4,
    "communities": 3,
    "sitemap_urls": 49
  },
  "limitations": [
    "javascript_rendering_unavailable_playwright_unsupported_on_mac13_arm64",
    "serp_data_from_us_locale_not_id_geolocated",
    "no_paa_ads_or_ai_overview_signals_captured",
    "no_gsc_or_analytics_data",
    "core_web_vitals_and_cls_unassessed"
  ]
}
```

---

*Generate a PDF report? Use `/seo google report`.*
