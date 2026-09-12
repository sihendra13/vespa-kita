# GEO / AI-Search Readiness Audit — vespakita.com

Audit date: 2026-09-12
Scope: https://www.vespakita.com (ID + /en/), /marketplace/, /komunitas/, /komunitas/tongkrongan/, /marketplace/l/*, /komunitas/c/*, /60s-yogyakarta/

---

## GEO Readiness Score: 32 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 22 | 5.5 |
| Structural Readability | 20% | 48 | 9.6 |
| Multi-Modal Content | 15% | 38 | 5.7 |
| Authority & Brand Signals | 20% | 30 | 6.0 |
| Technical Accessibility | 20% | 25 | 5.0 |
| **Total** | | | **31.8 → 32** |

The score is dominated by one fact: **the site is returning HTTP 403 at the Cloudflare edge to the AI search crawlers of OpenAI, Perplexity, and Anthropic.** This is a harder block than robots.txt and is not visible from reading robots.txt alone.

---

## 1. AI Crawler Access — robots.txt says one thing, the edge does another

### 1a. What robots.txt actually says

`https://www.vespakita.com/robots.txt` is **not** the file in the repo. The repo file
(`/Users/kayuwangi/Desktop/Vespa Kita/Landing Page/robots.txt`) is 5 lines. The served file
has a Cloudflare-injected block prepended, delimited by
`# BEGIN Cloudflare Managed content` / `# END Cloudflare Managed Content`.

Content signal declared for all user agents:

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /
```

Named `Disallow: /` entries: `Amazonbot`, `Applebot-Extended`, `Bytespider`, `CCBot`,
`ClaudeBot`, `CloudflareBrowserRenderingCrawler`, `Google-Extended`, `GPTBot`,
`meta-externalagent`.

Critically, **robots.txt does NOT disallow any AI *search* crawler.** `OAI-SearchBot`,
`ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`,
`Googlebot` and `Bingbot` all fall under `User-agent: * / Allow: /`. Reading robots.txt in
isolation would give a falsely reassuring "AI search is fine" verdict.

### 1b. What the edge actually does (live UA probe, 2026-09-12)

Requests to `https://www.vespakita.com/` and `/marketplace/` with each UA:

| User agent | What it governs | robots.txt says | Live HTTP | Verdict |
|---|---|---|---|---|
| `OAI-SearchBot` | **ChatGPT Search citation** | Allowed | **403** | **BLOCKED** |
| `ChatGPT-User` | ChatGPT user-triggered fetch | Allowed | **403** | **BLOCKED** |
| `PerplexityBot` | **Perplexity index + citation** | Allowed | **403** | **BLOCKED** |
| `Perplexity-User` | Perplexity user-triggered fetch | Allowed | **403** | **BLOCKED** |
| `Claude-SearchBot` | **Claude search citation** | Allowed | **403** | **BLOCKED** |
| `Googlebot` | Google Search **and AI Overviews** | Allowed | 200 (59,311 b) | OK |
| `Bingbot` | Bing index **and Copilot** | Allowed | 200 (59,311 b) | OK |
| `Applebot` | Siri / Spotlight / Safari | Allowed | 200 | OK |
| `DuckDuckBot` | DuckDuckGo | Allowed | 200 | OK |
| `facebookexternalhit` | Link previews | Allowed | 200 | OK |
| `GPTBot` | OpenAI **training only** | Disallowed | **403** | Blocked (low impact) |
| `ClaudeBot` | Anthropic **training only** | Disallowed | **403** | Blocked (low impact) |
| `CCBot` | Common Crawl (training corpora) | Disallowed | **403** | Blocked (medium impact) |
| `Bytespider` | ByteDance training | Disallowed | **403** | Blocked (low impact) |
| `Amazonbot` | Alexa/Amazon | Disallowed | **403** | Blocked (low impact) |
| `meta-externalagent` | Meta AI training | Disallowed | **403** | Blocked (low impact) |
| `Google-Extended` | Gemini/Vertex training + grounding | Disallowed | 200 (token-only, no UA) | Blocked via robots |
| `Applebot-Extended` | Apple Intelligence training | Disallowed | n/a (token-only) | Blocked via robots |
| `curl/8.4.0`, generic browser UA, `SomeRandomBot/1.0`, `YandexBot` | — | Allowed | 200 | OK |

The 403 response is `content-type: text/plain`, 25 bytes, body `Your request was blocked.`,
`server: cloudflare`, no origin headers. Generic and unknown bots get 200, so this is **not**
broad bot mitigation — it is a **targeted AI-crawler blocklist matching on user-agent string**.
That blocklist is a separate Cloudflare setting from the managed robots.txt (AI Crawl Control
"Block AI crawlers" / Bot Management managed rule) and it **overrides** what robots.txt permits.

### 1c. Per-platform impact, stated precisely

- **Google AI Overviews / AI Mode — NOT blocked.** AIO inclusion follows `Googlebot`, which
  returns 200. `Google-Extended` being disallowed governs **Gemini app / Vertex AI training and
  grounding only** — it has never controlled Google Search or AI Overviews inclusion. The
  existing note in `audit-data.json` ("Cloudflare edge robots.txt blocks ... Google-Extended
  ... defeats AI Overviews visibility") is **incorrect on that specific point** and should be
  corrected. AIO visibility here is limited by thin content, not by crawler access.
- **ChatGPT Search — effectively blocked.** `OAI-SearchBot` (the ChatGPT Search crawler) gets
  403. `ChatGPT-User` (fired when a user pastes the URL or the model retrieves live) also gets
  403. `GPTBot` being disallowed is the *least* important of the three — it only governs model
  training, not citability. Practical outcome: ChatGPT cannot fetch or cite this site.
- **Perplexity — effectively blocked.** Both `PerplexityBot` and `Perplexity-User` get 403.
- **Claude — effectively blocked for search.** `Claude-SearchBot`, which per Anthropic's
  crawler documentation governs Claude search citability, gets 403. `ClaudeBot` (training)
  being disallowed is separately low-impact.
- **Bing Copilot — NOT blocked.** Copilot grounding follows `Bingbot`, which returns 200.
- **Apple Intelligence** training is opted out via `Applebot-Extended`, but Siri/Spotlight/
  Safari discoverability follows `Applebot`, which returns 200 — unaffected.

### 1d. Is this deliberate or an unreviewed default?

Strong evidence it is **an unreviewed Cloudflare default the owner should be told about**:

1. The repo's own `robots.txt` contains no AI directives at all — the entire AI policy is
   injected by Cloudflare, not authored by the site owner.
2. The declared content signal is `use=reference`, which **affirmatively permits AI systems to
   reference and cite the content with attribution**, and `ai-input` is left unset (neither
   granted nor restricted — i.e. RAG/grounding is not refused). The stated policy therefore
   *wants* AI citation. The WAF block does the opposite. A site owner who deliberately wanted
   to bar AI search would have set `search=no` or `use=no`, not `use=reference`.
3. `CloudflareBrowserRenderingCrawler` is disallowed — that is Cloudflare's own rendering
   fetcher, of no interest to a publisher, and is a giveaway of a stock preset.
4. The business model is *media + sponsor matchmaking*. Discovery in AI answers is directly
   revenue-relevant. Blocking ChatGPT and Perplexity is strategically inconsistent with a
   homepage whose primary CTA is "Mari Berkolaborasi" and a downloadable media kit.

**Recommendation:** in the Cloudflare dashboard, under AI Crawl Control / Bot Management,
switch AI *search* crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`,
`Perplexity-User`, `Claude-SearchBot`, `Claude-User`) to **Allow**, and keep AI *training*
crawlers (`GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`, `meta-externalagent`, `Amazonbot`,
`Google-Extended`, `Applebot-Extended`) blocked if training opt-out is the intent. That
combination matches the `search=yes, ai-train=no, use=reference` signal already declared.

---

## 2. llms.txt / RSL 1.0

| Probe | Result |
|---|---|
| `/llms.txt` | **Missing** — returns HTTP 200 with the full homepage HTML (`text/html`), a soft-200 |
| `/llms-full.txt` | Missing — same soft-200 homepage HTML |
| `/ai.txt` | Missing — same soft-200 homepage HTML |
| RSL 1.0 licensing (`<link rel="license" type="application/rsl+xml">`, `rsl.xml`, `License:` in robots.txt) | **Absent** |
| Content-Signal (pre-RSL) | Present via Cloudflare: `search=yes,ai-train=no,use=reference` |

There is a related correctness bug: **unknown root-level paths return HTTP 200 with the
homepage**, not 404. `/zzz-nonexistent-12345` → 200, `<title>VespaKita - Vespa Untuk Kita
Semua</title>`. Deep marketplace routes do 404 correctly (`/marketplace/l/FAKE-ID-999` → 404,
`<title>Listing Tidak Ditemukan</title>`), so the gap is only at the root level. Soft-200s
waste crawl budget and make any future `llms.txt` probe look like a success while returning
garbage.

---

## 3. Citability — the content is too thin to quote

Passage analysis on trafilatura-extracted text (boilerplate stripped), raw HTML, no JS:

| Page | Extractable words (whole page) | Blocks > 5 words | Blocks in 134–167 word citation band | Longest block |
|---|---|---|---|---|
| `/` | 154 | 8 | **0** | 31 w |
| `/en/` | 166 | 8 | **0** | 33 w |
| `/marketplace/` | 106 | 5 | **0** | 36 w |
| `/komunitas/` | 61 | 2 | **0** | 34 w |
| `/komunitas/tongkrongan/` | 48 | 1 | **0** | 17 w |
| `/marketplace/l/<id>` | 59 | 3 | **0** | 14 w |
| `/60s-yogyakarta/` | 248 | 9 | **0** | 44 w |

The homepage's *entire* extractable prose is 154 words — less than one optimally-sized citable
passage. Every page is built from slogans and short captions (`JUAL BELI VESPA AMAN TANPA
TIPU-TIPU`, `Mari Berkolaborasi`) rather than self-contained answer paragraphs. There is
nothing for an LLM to lift.

**Zero** pages have: an FAQ block, a question-form H2/H3, a "What is VespaKita" definition
paragraph, a dated statistic with source attribution in body text, or an About page (no
`/about/`, `/tentang/`, or equivalent exists anywhere in the repo or sitemap).

### The brand-definition sentence does not exist

You asked specifically whether "VespaKita is an independent Vespa media brand + curated
marketplace + community sponsor-matching directory" is statable from one crawlable sentence.
**It is not.** The three pillars are stated separately on three different pages and never
combined:

- Media: homepage/meta — "Media independen seputar dunia Vespa dan komunitas di Indonesia —
  podcast, liputan event, dan cerita perjalanan…" (media only; no marketplace, no directory)
- Marketplace: `/marketplace/` — "Alternatif marketplace Vespa yang lebih aman. Setiap listing
  … dicek manual oleh tim VespaKita sebelum tayang."
- Sponsor matching: `/komunitas/` — "VespaKita siap membantu komunitas kamu mendapatkan
  dukungan sponsor untuk kegiatan touring, gathering, atau jambore…"

The `Organization` JSON-LD `description` likewise covers only the media pillar. An LLM asked
"what is VespaKita?" has no single passage that returns the correct full answer, and would
most likely describe it as a podcast/Instagram media account only.

---

## 4. Structural Readability

**Working:**
- Unique, well-written `<title>` and `<meta description>` on every page type, including
  dynamically generated listing and community detail pages.
- Self-referencing canonicals plus reciprocal `hreflang` id/en/x-default.
- `Organization` JSON-LD on `/` with `knowsAbout` (7 topical entities), `areaServed: ID`,
  and `sameAs` to Instagram + YouTube.
- `Product` + `Offer` + `Brand` JSON-LD on every `/marketplace/l/*` page, server-rendered,
  with real price, condition, images and `availability`. This is the single strongest GEO
  asset on the site.
- `Event` + `Organization` + `Place` + `PostalAddress` JSON-LD on `/60s-yogyakarta/`.
- Sitemap: 49 URLs, 36 with `lastmod`, linked from robots.txt.

**Broken / missing:**
- **A JS template literal has leaked into the static HTML as a real heading** on `/`:
  `<h3>' + escapeHtmlNE(e.title) + '</h3>`. A crawler reads that literal string as a heading.
- `/komunitas/tongkrongan/` has **no H1 and no H2 at all**.
- `/komunitas/c/<id>` (community detail) has **no H1 and no JSON-LD** — the community name
  exists only in `<title>`. These pages should carry `Organization` schema.
- `/marketplace/` index has **no JSON-LD** — no `ItemList`/`CollectionPage` wrapping the
  listings, so the collection is invisible as a structured entity.
- Headings are ALL-CAPS slogans, not question-form. Zero `H2`/`H3` phrased as a question.
- 13 of 49 sitemap URLs missing `lastmod`; no freshness dates on any content in the body.

---

## 5. Multi-Modal Content

- Rich media exists: hero videos (`jsp_landscape.mp4`), Cloudinary listing photo sets (5+
  images per listing, correctly enumerated in `Product.image`), community logos and covers.
- `VideoObject` schema: **absent everywhere**, including on the homepage video and the six
  "KONTEN DENGAN PERFORMA TERBAIK" reels.
- Podcast is a core product ("Ngobrol soal jalanan, komunitas, dan skena Vespa") but there is
  **no `PodcastSeries` / `PodcastEpisode` / `AudioObject` schema and no transcripts**.
  Transcripts are the highest-leverage multimodal fix here: they convert the strongest asset
  (long-form interview audio) into exactly the 134–167 word citable passages the site lacks.
- No `ImageObject` with captions; images carry no descriptive context for AI.
- Media kit exists as a PDF (`vespakita-media-kit.pdf`) — good, but its contents are not
  mirrored as HTML, so the audience/reach data inside is invisible to every crawler.

---

## 6. Authority & Brand Entity Signals

| Signal | Status | Notes |
|---|---|---|
| **Wikipedia entity** | **None** | No article on id.wikipedia or en.wikipedia; no Wikidata item. Searches for "VespaKita" return unrelated results. Biggest entity-recognition gap. |
| **YouTube** (strongest AI-citation correlate, r≈0.737) | **Very weak** | `@VespaKitaSemua`: **51 subscribers, 10,495 total views**, channel created 10 Dec 2025. Present but far below the threshold where YouTube mentions drive citation. |
| **Reddit** | Not detectable | Reddit search API blocked from this environment; no Reddit link in `sameAs`. Indonesian Vespa discussion largely lives on Instagram/WhatsApp, so this is a structurally hard channel. |
| **LinkedIn** | Absent | No company page referenced anywhere; not in `sameAs`. |
| **Instagram** | Primary channel (`@ves_pakita`) | Instagram is near-invisible to AI crawlers, so the brand's main audience proof does not translate into AI-citable evidence. |
| **Authorship** | **None** | No bylines, no author bios, no `Person` schema. Only "Hendra" appears, as a *seller* name on one listing. |
| **Dates** | Near-none | One body-text date: "Update terakhir: 24 Agustus 2026" on the Instagram-insights block. No `datePublished`/`dateModified` on any page. |
| **Citations / sourcing** | Weak | Stats ("96% audiens di Indonesia", "usia 25–44") are attributed to "Instagram Insights" — better than nothing, but headline reach numbers come from `/api/account-stats` client-side and are not in the HTML at all. |
| **Verifiable track record** | Exists but unstructured | "Road to Jakarta (Vespa 60's Yogyakarta) sukses bersinergi dengan 4 brand nasional" is a genuine, citable trust claim — currently a single clause on `/komunitas/`, with the 4 brands unnamed. |
| `Organization` schema completeness | Partial | Has name/url/logo/description/knowsAbout/areaServed/sameAs. **Missing** `founder`, `foundingDate`, `address`, `contactPoint`, `email`, `slogan`, and any `sameAs` beyond IG/YouTube. |

---

## 7. Technical Accessibility — client-side content is invisible to non-rendering crawlers

The site is server-rendered static HTML (`is_spa: false`), which is good. But **every dataset
that constitutes the site's actual value is fetched client-side after load** and is absent from
the HTML a non-rendering crawler receives.

| Surface | Server-rendered? | Client fetch | What a non-JS crawler sees |
|---|---|---|---|
| Homepage event feed | **No** | `/api/communities` | Literal placeholder text `Memuat event...` |
| Homepage reach/engagement stats | **No** | `/api/account-stats` (returns `views_30d: 6258, reach_30d: 4634, engagement_rate_30d: 6`) | Empty/`--` placeholders |
| Homepage reel metrics | **No** | `/api/reel-metrics?postId=…` | Empty |
| `/marketplace/` listing grid | **No** | `/api/marketplace-listings` | Section headings only; **zero listings** |
| `/komunitas/` community directory | **No** | `/api/communities` (13 communities in payload) | Two intro paragraphs; **zero communities** |
| `/komunitas/tongkrongan/` posts | **No** | `/api/tongkrongan` | `Memuat obrolan...` |
| `/komunitas/c/<id>` body | **Partial** | `/api/comments` | Description paragraph is server-rendered (good); comments are not |
| `/marketplace/l/<id>` | **Yes** | `/api/marketplace-track` (analytics only) | Full content + Product JSON-LD |

Mitigating factors: detail pages for both listings and communities *are* server-rendered and
are all present in `sitemap.xml` (36 of the 49 URLs), so the individual entities are reachable
by direct crawl even though the index pages appear empty. Googlebot renders JS and will see the
grids anyway. But **Bingbot renders JS inconsistently, and the OpenAI / Perplexity / Anthropic
fetchers generally do not render JS at all** — so even if the 403 block were lifted tomorrow,
those crawlers would see a marketplace with no listings and a directory with no communities.
Fixing the crawler block without fixing the client-side rendering would only get you halfway.

A second issue: the homepage runs a JS language redirect (`if (!userLang.startsWith('id'))
window.location.replace('/en/')`). Non-JS crawlers stay on `/`, which is correct behaviour, but
this means `/en/` accrues no crawler-visible entry signal from real traffic patterns.

---

## Platform-Specific Scores

| Platform | Score | Limiting factor |
|---|---|---|
| **Google AI Overviews / AI Mode** | **45 / 100** | Crawler access is fine (Googlebot 200, renders JS). Capped by 154-word homepage, no FAQ, no entity, no dates. `Google-Extended` block does **not** apply here. |
| **Bing Copilot** | **40 / 100** | Bingbot 200. Same thin-content cap, plus unreliable JS rendering hides marketplace/directory. |
| **ChatGPT Search** | **5 / 100** | `OAI-SearchBot` and `ChatGPT-User` both 403 at the edge. Hard block. |
| **Perplexity** | **5 / 100** | `PerplexityBot` and `Perplexity-User` both 403 at the edge. Hard block. |
| **Claude search** | **5 / 100** | `Claude-SearchBot` 403 at the edge. Hard block. |
| **Apple Siri / Spotlight** | 35 / 100 | `Applebot` 200 (unaffected by the `Applebot-Extended` opt-out). Thin content only. |

---

## Top 5 Highest-Impact Changes

| # | Change | Why | Effort | Expected lift |
|---|---|---|---|---|
| 1 | **Allow AI *search* crawlers at the Cloudflare edge.** In AI Crawl Control / Bot Management, set `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User` to Allow. Keep `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`, `meta-externalagent`, `Amazonbot`, `Google-Extended`, `Applebot-Extended` blocked. Verify with `curl -A "OAI-SearchBot/1.0" https://www.vespakita.com/` → expect 200. | Removes a hard 403 on three of the five major AI answer engines. Nothing else on this list matters for ChatGPT/Perplexity/Claude until this is done. | **15 min** (dashboard only, no code) | ChatGPT/Perplexity/Claude: 5 → ~40 |
| 2 | **Server-render the marketplace grid and community directory into the initial HTML.** Inline the `/api/marketplace-listings` and `/api/communities` payloads as static markup at build/deploy time (or via a Pages Function that renders server-side), keeping the client fetch only for live updates. Add `ItemList` JSON-LD to `/marketplace/` and `Organization` JSON-LD to `/komunitas/c/*`. | Non-rendering AI fetchers currently see an empty marketplace and an empty directory — the two things that differentiate the brand. Also removes the `Memuat event...` placeholder from the homepage. | **1–2 days** | All platforms; unlocks the value of #1 |
| 3 | **Add an `/tentang/` + `/en/about/` page opening with a single-sentence definition**, e.g. "VespaKita adalah media independen Vespa Indonesia yang menjalankan tiga hal: liputan & podcast komunitas, marketplace Vespa terkurasi dengan verifikasi manual setiap listing, dan direktori komunitas yang mempertemukan komunitas dengan sponsor brand." Follow with 4–6 self-contained 134–167 word sections (founding, editorial independence, how curation works, how sponsor matching works, audience data with the 24-Aug-2026 Instagram Insights attribution, named track record incl. the 4 national brands on Road to Jakarta). Mirror the definition into `Organization.description`, add `founder`, `foundingDate`, `contactPoint`, `slogan`. | Fixes the single largest citability gap: there is currently no crawlable sentence that correctly describes what VespaKita is. This is the passage every engine will quote. | **4–6 hrs** | Citability 22 → ~55 |
| 4 | **Publish podcast episode pages with full transcripts** + `PodcastEpisode`/`AudioObject` schema, and add `VideoObject` to the six featured reels. Add `datePublished`/`dateModified` and a named author byline (`Person` schema) to every content page. | Converts the strongest existing asset (long-form audio) into the exact 134–167 word citable passages the site has zero of, and supplies the authorship/freshness signals that are entirely missing. | **1–2 days** initial, then per-episode | Citability + Authority + Multi-Modal |
| 5 | **Ship `/llms.txt`, fix the root-level soft-404, and clean up heading structure.** `llms.txt`: the brand definition sentence plus a curated map of `/marketplace/`, `/komunitas/`, podcast, about. Return real 404s for unknown root paths (a `404.html` in the Pages project root). Fix the leaked `<h3>' + escapeHtmlNE(e.title) + '</h3>` template literal on `/`, add H1s to `/komunitas/tongkrongan/` and `/komunitas/c/*`, and reword key H2s into question form ("Apa itu VespaKita?", "Bagaimana cara menjual Vespa dengan aman?", "Bagaimana komunitas mendapatkan sponsor?"). | Low effort, removes a visibly broken heading, and gives AI crawlers a clean entry map. The soft-404 currently makes `/llms.txt` "exist" as homepage HTML. | **2–3 hrs** | Structural 48 → ~70 |

---

## Correction to the existing audit

`vespakita.com-audit/audit-data.json` currently lists, under Technical SEO:

> "Cloudflare edge robots.txt blocks GPTBot, Google-Extended, ClaudeBot, Applebot-Extended, CCBot, Bytespider, meta-externalagent — defeats AI Overviews/ChatGPT/Perplexity visibility"

Two corrections:
1. **Google-Extended and Applebot-Extended do not affect AI Overviews or Siri.** They govern
   Gemini/Vertex and Apple Intelligence *training* respectively. AIO follows Googlebot (200 here);
   Siri/Spotlight follow Applebot (200 here). AI Overviews visibility is **not** defeated.
2. **The ChatGPT/Perplexity/Claude block is real but comes from a different mechanism** — a
   Cloudflare WAF/AI-Crawl-Control UA rule returning 403, not robots.txt. robots.txt explicitly
   *allows* `OAI-SearchBot`, `PerplexityBot`, and `Claude-SearchBot`. Editing robots.txt alone
   will not fix it; the dashboard setting must be changed.

The quick-win "allow Google-Extended + GPTBot if GEO matters" should be rewritten to
"allow `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`
at the edge; `GPTBot`/`Google-Extended` are training-only and can stay blocked."

---

## audit-data.json — AI Search Readiness category

```json
{
  "name": "AI Search Readiness (GEO)",
  "score": 32,
  "what_works": [
    "Product + Offer + Brand JSON-LD server-rendered on every marketplace listing detail page",
    "Event + Organization + Place JSON-LD on /60s-yogyakarta/",
    "Organization JSON-LD on homepage with knowsAbout (7 entities), areaServed and sameAs",
    "Googlebot, Bingbot and Applebot all receive HTTP 200 - Google AI Overviews and Bing Copilot access is intact",
    "Content-Signal declares use=reference and leaves ai-input unset, i.e. AI citation with attribution is affirmatively permitted",
    "Detail pages for listings and communities are server-rendered and present in sitemap.xml (36 of 49 URLs)",
    "Unique titles and meta descriptions on all page types including dynamic detail pages"
  ],
  "findings": [
    {
      "title": "Cloudflare edge returns HTTP 403 to OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User and Claude-SearchBot",
      "severity": "Critical",
      "description": "A Cloudflare AI Crawl Control / Bot Management UA rule blocks the AI search crawlers of OpenAI, Perplexity and Anthropic with a 25-byte 'Your request was blocked.' response, even though robots.txt explicitly allows all of them under User-agent: *. Generic and unknown bots receive 200, confirming a targeted AI blocklist rather than broad bot mitigation. ChatGPT Search, Perplexity and Claude cannot fetch or cite the site.",
      "fix": "In the Cloudflare dashboard (AI Crawl Control / Bot Management), allow OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot and Claude-User. Verify with curl -A 'OAI-SearchBot/1.0' https://www.vespakita.com/ returning 200.",
      "effort": "15 minutes"
    },
    {
      "title": "AI crawler policy is an unreviewed Cloudflare managed default, not an owner decision",
      "severity": "High",
      "description": "The served robots.txt contains a Cloudflare-injected block absent from the repo file, disallowing 9 named agents including CloudflareBrowserRenderingCrawler - a stock-preset tell. The declared Content-Signal (search=yes, ai-train=no, use=reference) permits AI reference use, contradicting the edge block. For a media brand whose primary CTA is sponsor collaboration, blocking AI discovery is strategically inconsistent.",
      "fix": "Make an explicit decision: keep training crawlers (GPTBot, ClaudeBot, CCBot, Bytespider, meta-externalagent, Amazonbot, Google-Extended, Applebot-Extended) blocked, allow all AI search crawlers.",
      "effort": "15 minutes"
    },
    {
      "title": "No single crawlable sentence defines what VespaKita is",
      "severity": "High",
      "description": "The three business pillars - independent Vespa media, curated marketplace, community sponsor-matching directory - are stated on three separate pages and never combined. Organization JSON-LD description covers only the media pillar. No /about/ or /tentang/ page exists. An LLM asked 'what is VespaKita' would describe it as a podcast account only.",
      "fix": "Create /tentang/ and /en/about/ opening with a one-sentence three-pillar definition; mirror it into Organization.description and meta description.",
      "effort": "4-6 hours"
    },
    {
      "title": "Marketplace listings, community directory and homepage event feed are client-fetched and invisible without JS",
      "severity": "High",
      "description": "/marketplace/ fetches /api/marketplace-listings, /komunitas/ fetches /api/communities, homepage fetches /api/communities and /api/account-stats, /komunitas/tongkrongan/ fetches /api/tongkrongan. Raw HTML contains only placeholders such as 'Memuat event...' and zero listings or communities. OpenAI, Perplexity and Anthropic fetchers generally do not execute JS, and Bingbot renders inconsistently.",
      "fix": "Server-render the listing grid and community directory into initial HTML at build/deploy time; add ItemList JSON-LD to /marketplace/ and Organization JSON-LD to /komunitas/c/*.",
      "effort": "1-2 days"
    },
    {
      "title": "Site-wide content is far below citable passage length",
      "severity": "High",
      "description": "Homepage yields 154 extractable words in total; /marketplace/ 106; /komunitas/ 61; /komunitas/tongkrongan/ 48. Across all pages audited, zero text blocks fall in the 134-167 word AI citation band and the longest single block anywhere is 44 words. No FAQ, no question-form headings, no definition paragraphs.",
      "fix": "Add 4-6 self-contained 134-167 word sections per key page under question-form H2s; publish podcast transcripts.",
      "effort": "1-2 days"
    },
    {
      "title": "No llms.txt and root-level paths return soft-200 instead of 404",
      "severity": "Medium",
      "description": "/llms.txt, /llms-full.txt and /ai.txt all return HTTP 200 with the full homepage HTML. /zzz-nonexistent-12345 likewise returns 200 with the homepage. Deep marketplace routes 404 correctly, so the gap is root-level only. No RSL 1.0 licensing present.",
      "fix": "Add a real /llms.txt and a 404.html in the Pages project root.",
      "effort": "1-2 hours"
    },
    {
      "title": "Brand has no Wikipedia/Wikidata entity and a 51-subscriber YouTube channel",
      "severity": "Medium",
      "description": "No Wikipedia article on id or en wikipedia and no Wikidata item. YouTube @VespaKitaSemua has 51 subscribers and 10,495 lifetime views since Dec 2025 - YouTube presence is the strongest single correlate of AI citation (r~0.737). Instagram is the primary channel but is near-invisible to AI crawlers. No LinkedIn page, no author bylines, no Person schema, no publication dates.",
      "fix": "Invest in YouTube as the crawler-visible mirror of Instagram content; add author bylines with Person schema and datePublished/dateModified; expand Organization sameAs.",
      "effort": "Ongoing"
    },
    {
      "title": "Broken heading and missing H1s",
      "severity": "Medium",
      "description": "A JS template literal leaked into static homepage HTML as a real heading: <h3>' + escapeHtmlNE(e.title) + '</h3>. /komunitas/tongkrongan/ has no H1 or H2 at all. /komunitas/c/<id> has no H1 and no JSON-LD. /marketplace/ has no JSON-LD.",
      "fix": "Remove the leaked template literal, add H1s, add Organization schema to community detail pages and ItemList to the marketplace index.",
      "effort": "2-3 hours"
    },
    {
      "title": "Podcast and video content carry no schema and no transcripts",
      "severity": "Medium",
      "description": "Podcast is a core product and the homepage features six reels, but there is no PodcastSeries, PodcastEpisode, AudioObject or VideoObject markup anywhere, and no transcripts. Media kit content exists only as a PDF, not mirrored in HTML.",
      "fix": "Publish per-episode pages with full transcripts and PodcastEpisode schema; add VideoObject to featured reels; mirror media kit data as an HTML page.",
      "effort": "1-2 days"
    }
  ],
  "platform_scores": {
    "google_ai_overviews": 45,
    "bing_copilot": 40,
    "chatgpt_search": 5,
    "perplexity": 5,
    "claude_search": 5,
    "apple_siri_spotlight": 35
  },
  "crawler_access": {
    "OAI-SearchBot": "blocked_403_edge",
    "ChatGPT-User": "blocked_403_edge",
    "PerplexityBot": "blocked_403_edge",
    "Perplexity-User": "blocked_403_edge",
    "Claude-SearchBot": "blocked_403_edge",
    "Googlebot": "allowed_200",
    "Bingbot": "allowed_200",
    "Applebot": "allowed_200",
    "DuckDuckBot": "allowed_200",
    "GPTBot": "blocked_robots_and_403",
    "ClaudeBot": "blocked_robots_and_403",
    "CCBot": "blocked_robots_and_403",
    "Bytespider": "blocked_robots_and_403",
    "Amazonbot": "blocked_robots_and_403",
    "meta-externalagent": "blocked_robots_and_403",
    "Google-Extended": "blocked_robots_token_only",
    "Applebot-Extended": "blocked_robots_token_only"
  },
  "llms_txt": "missing_soft_200",
  "rsl_licensing": "absent",
  "content_signal": "search=yes,ai-train=no,use=reference"
}
```
