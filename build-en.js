#!/usr/bin/env node
// Generates every en/*.html page from its Indonesian source, so the language
// versions never drift apart in structure/logic — only the i18n/*.json
// dictionaries need upkeep. The .id source files are the only ones anyone
// should hand-edit. Run this script (or let the deploy pipeline run it)
// after every change, then commit both the source and the generated files.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Applies every entry in one or more dictionaries to `html` in a SINGLE pass
// over the original text — critical, not just an optimization: applying
// entries one at a time (mutating `html` after each) lets an earlier
// replacement's OUTPUT get re-matched by a later, unrelated dictionary entry.
// E.g. translating "Nama Event" -> "Event Name" and then, in a later
// iteration, "Event" -> "Events" (for a *different* source phrase) would
// corrupt the already-translated "Event Name" into "Events Name". A single
// combined-alternation regex, scanned once over the untouched input, can't
// do that: String.replace(regex, fn) matches against the original string's
// positions, so inserted replacement text is never re-scanned.
// Longest keys first in the alternation so a short phrase can't consume part
// of a longer one that contains it — regex alternation tries branches in
// order and takes the first match at each position. Single "words" (no
// spaces/punctuation) get \b boundaries so e.g. "Event" doesn't corrupt
// "addEventListener"; multi-word phrases are specific enough to match plainly.
function applyDictionaries(html, dictPaths) {
  const merged = {};
  for (const dictPath of dictPaths) {
    const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
    for (const [k, v] of Object.entries(dict)) {
      if (k.startsWith("_")) continue;
      merged[k] = v;
    }
  }
  const keys = Object.keys(merged).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return { html, missing: [] };

  const pattern = keys
    .map((k) => (/^[A-Za-z0-9]+$/.test(k) ? `\\b${escapeRegExp(k)}\\b` : escapeRegExp(k)))
    .join("|");
  const combined = new RegExp(pattern, "g");

  const matched = new Set();
  const translated = html.replace(combined, (m) => {
    matched.add(m);
    return merged[m];
  });

  const missing = keys.filter((k) => !matched.has(k));
  return { html: translated, missing };
}

function buildHomepage() {
  const SRC = path.join(ROOT, "index.html");
  const OUT = path.join(ROOT, "en", "index.html");
  const DICT_PATH = path.join(ROOT, "i18n", "en.json");

  let html = fs.readFileSync(SRC, "utf8");

  html = html.replace('<html lang="id">', '<html lang="en">');
  html = html.replace(
    /<script>\s*\(function\(\) \{\s*\/\/ If user previously chose Indonesian manually, do not redirect[\s\S]*?<\/script>\n/,
    ""
  );

  const metaSwaps = [
    ['<title>VespaKita - Vespa Untuk Kita Semua</title>', '<title>VespaKita - Vespa For Us All</title>'],
    ['<link rel="canonical" href="https://www.vespakita.com/" />', '<link rel="canonical" href="https://www.vespakita.com/en/" />'],
    ['<meta property="og:url" content="https://www.vespakita.com/">', '<meta property="og:url" content="https://www.vespakita.com/en/">'],
    ['<meta property="og:locale" content="id_ID">', '<meta property="og:locale" content="en_US">'],
    ['<meta property="og:locale:alternate" content="en_US">', '<meta property="og:locale:alternate" content="id_ID">'],
    ['<meta property="og:title" content="VespaKita - Vespa Untuk Kita Semua">', '<meta property="og:title" content="VespaKita - Vespa For Us All">'],
    ['<meta name="twitter:title" content="VespaKita - Vespa Untuk Kita Semua">', '<meta name="twitter:title" content="VespaKita - Vespa For Us All">'],
    [
      `<a href="#blog">Tips &amp; Trik</a>`,
      `<a href="#blog">Tips &amp; Tricks</a>`,
    ],
    [
      `<a href="/#blog">Tips &amp; Trik</a>`,
      `<a href="/#blog">Tips &amp; Tricks</a>`,
    ],
    [
      `<!-- TIPS & TRIK (BLOG PREVIEW CAROUSEL) -->
<style>
  .blog-section{padding:60px 0 80px; border-top:1px solid rgba(255,255,255,0.08);}
  .blog-carousel-wrapper{display:flex; align-items:center; gap:12px; max-width:1120px; margin:0 auto; padding:0 24px;}
  .blog-grid{display:flex; gap:22px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-behavior:smooth; padding:4px 4px 12px; scrollbar-width:none;}
  .blog-grid::-webkit-scrollbar{display:none;}
  .blog-carousel-arrow{flex:0 0 auto; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:var(--aspal-2); border:1px solid rgba(241,232,214,0.15); color:var(--krem); cursor:pointer; transition:all .2s ease;}
  .blog-carousel-arrow:hover{background:var(--merah); border-color:var(--merah); color:#fff;}
  .blog-card{background:var(--aspal-2); border:1px solid rgba(241,232,214,0.1); border-radius:6px; overflow:hidden; text-decoration:none; display:flex; flex-direction:column; color:inherit; flex:0 0 calc((100% - 44px) / 3); scroll-snap-align:start; transition:transform .2s ease, border-color .2s ease;}
  .blog-card:hover{transform:translateY(-4px); border-color:rgba(111,168,154,0.4);}
  .blog-card-content{padding:22px; display:flex; flex-direction:column; flex-grow:1;}
  .blog-category{font-family:var(--mono); font-size:10.5px; font-weight:700; color:var(--mint); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;}
  .blog-card h3{font-family:var(--body); font-size:16.5px; font-weight:700; color:var(--krem); margin-bottom:10px; line-height:1.4;}
  .blog-card p{font-size:13.5px; color:var(--chrome); line-height:1.6; margin-bottom:20px; flex-grow:1;}
  .blog-readmore{font-family:var(--mono); font-size:12px; text-transform:uppercase; letter-spacing:0.05em; font-weight:700; color:var(--merah); display:flex; align-items:center; gap:6px; transition:gap .2s ease;}
  .blog-card:hover .blog-readmore{gap:10px;}
  .blog-more-container{text-align:center; margin-top:36px;}
  @media (max-width:1024px){ .blog-card{flex:0 0 calc((100% - 22px) / 2);} }
  @media (max-width:767px){
    .blog-carousel-arrow{display:none;}
    .blog-card{flex:0 0 85%;}
  }
</style>
<section class="dark blog-section" id="blog">
  <div class="wrap">
    <div class="section-head reveal" style="text-align:center; margin-bottom:36px;">
      <div class="eyebrow" style="justify-content:center;">Tips &amp; Trik</div>
      <h2>Panduan Vespa Klasik</h2>
      <p style="max-width:600px; margin:12px auto 0; color:var(--chrome); font-size:15px;">Tips praktis seputar Vespa klasik — dari cara memilih bengkel sampai perawatan.</p>
    </div>
  </div>
  <div class="blog-carousel-wrapper">
    <button type="button" class="blog-carousel-arrow" aria-label="Artikel sebelumnya" onclick="scrollBlogCarousel(-1)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="blog-grid" id="blogCarousel">
      <a href="/blog/cara-memilih-bengkel-vespa-klasik-terpercaya/" class="blog-card">
        <div class="blog-card-content">
          <div class="blog-category">Bengkel</div>
          <h3>Cara Memilih Bengkel Vespa Klasik yang Terpercaya</h3>
          <p>Ciri-ciri bengkel yang bisa dipercaya, pertanyaan wajib sebelum servis, dan red flag yang harus dihindari.</p>
          <div class="blog-readmore">Baca Artikel &rarr;</div>
        </div>
      </a>
    </div>
    <button type="button" class="blog-carousel-arrow" aria-label="Artikel berikutnya" onclick="scrollBlogCarousel(1)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
  <div class="blog-more-container">
    <a href="/blog/" class="btn btn-outline">Lihat Semua Tips &amp; Trik</a>
  </div>
</section>
<script>
  function scrollBlogCarousel(direction){
    var track = document.getElementById('blogCarousel');
    if(!track) return;
    var card = track.querySelector('.blog-card');
    if(!card) return;
    var cardWidth = card.getBoundingClientRect().width;
    var gap = parseFloat(getComputedStyle(track).gap) || 22;
    track.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  }
</script>`,
      `<!-- TIPS & TRICKS (BLOG PREVIEW CAROUSEL) -->
<style>
  .blog-section{padding:60px 0 80px; border-top:1px solid rgba(255,255,255,0.08);}
  .blog-carousel-wrapper{display:flex; align-items:center; gap:12px; max-width:1120px; margin:0 auto; padding:0 24px;}
  .blog-grid{display:flex; gap:22px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-behavior:smooth; padding:4px 4px 12px; scrollbar-width:none;}
  .blog-grid::-webkit-scrollbar{display:none;}
  .blog-carousel-arrow{flex:0 0 auto; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:var(--aspal-2); border:1px solid rgba(241,232,214,0.15); color:var(--krem); cursor:pointer; transition:all .2s ease;}
  .blog-carousel-arrow:hover{background:var(--merah); border-color:var(--merah); color:#fff;}
  .blog-card{background:var(--aspal-2); border:1px solid rgba(241,232,214,0.1); border-radius:6px; overflow:hidden; text-decoration:none; display:flex; flex-direction:column; color:inherit; flex:0 0 calc((100% - 44px) / 3); scroll-snap-align:start; transition:transform .2s ease, border-color .2s ease;}
  .blog-card:hover{transform:translateY(-4px); border-color:rgba(111,168,154,0.4);}
  .blog-card-content{padding:22px; display:flex; flex-direction:column; flex-grow:1;}
  .blog-category{font-family:var(--mono); font-size:10.5px; font-weight:700; color:var(--mint); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;}
  .blog-card h3{font-family:var(--body); font-size:16.5px; font-weight:700; color:var(--krem); margin-bottom:10px; line-height:1.4;}
  .blog-card p{font-size:13.5px; color:var(--chrome); line-height:1.6; margin-bottom:20px; flex-grow:1;}
  .blog-readmore{font-family:var(--mono); font-size:12px; text-transform:uppercase; letter-spacing:0.05em; font-weight:700; color:var(--merah); display:flex; align-items:center; gap:6px; transition:gap .2s ease;}
  .blog-card:hover .blog-readmore{gap:10px;}
  .blog-more-container{text-align:center; margin-top:36px;}
  @media (max-width:1024px){ .blog-card{flex:0 0 calc((100% - 22px) / 2);} }
  @media (max-width:767px){
    .blog-carousel-arrow{display:none;}
    .blog-card{flex:0 0 85%;}
  }
</style>
<section class="dark blog-section" id="blog">
  <div class="wrap">
    <div class="section-head reveal" style="text-align:center; margin-bottom:36px;">
      <div class="eyebrow" style="justify-content:center;">Tips &amp; Tricks</div>
      <h2>Classic Vespa Guides</h2>
      <p style="max-width:600px; margin:12px auto 0; color:var(--chrome); font-size:15px;">Practical tips for classic Vespa owners — from choosing a workshop to maintenance.</p>
    </div>
  </div>
  <div class="blog-carousel-wrapper">
    <button type="button" class="blog-carousel-arrow" aria-label="Previous article" onclick="scrollBlogCarousel(-1)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="blog-grid" id="blogCarousel">
      <a href="/blog/cara-memilih-bengkel-vespa-klasik-terpercaya/" class="blog-card">
        <div class="blog-card-content">
          <div class="blog-category">Workshop</div>
          <h3>Cara Memilih Bengkel Vespa Klasik yang Terpercaya</h3>
          <p>How to spot a trustworthy classic Vespa workshop, what to ask before a service, and red flags to avoid. (Indonesian)</p>
          <div class="blog-readmore">Read Article &rarr;</div>
        </div>
      </a>
    </div>
    <button type="button" class="blog-carousel-arrow" aria-label="Next article" onclick="scrollBlogCarousel(1)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
  <div class="blog-more-container">
    <a href="/blog/" class="btn btn-outline">See All Tips &amp; Tricks</a>
  </div>
</section>
<script>
  function scrollBlogCarousel(direction){
    var track = document.getElementById('blogCarousel');
    if(!track) return;
    var card = track.querySelector('.blog-card');
    if(!card) return;
    var cardWidth = card.getBoundingClientRect().width;
    var gap = parseFloat(getComputedStyle(track).gap) || 22;
    track.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  }
</script>`,
    ],
    [
      `"description": "VespaKita adalah rumah digital untuk semua yang berkaitan dengan Vespa di Indonesia, dijalankan sebagai tiga hal sekaligus. Pertama, kami media independen yang meliput dunia Vespa lewat podcast, liputan event, dan kolaborasi brand dengan komunitas. Kedua, kami menjalankan Marketplace Vespa terkurasi tempat unit dan sparepart bekas dicek manual oleh tim kami sebelum tayang, supaya pembeli tidak was-was soal kondisi maupun keaslian dokumen. Ketiga, kami membantu komunitas Vespa di seluruh Indonesia mendapatkan dukungan sponsor untuk event mereka, mulai dari touring dan gathering sampai jambore nasional, lewat jaringan brand yang sudah kami bangun, dengan bukti nyata seperti Road to Jakarta bersama Vespa 60s Yogyakarta yang berhasil menggandeng 4 brand nasional. Ketiganya saling menguatkan: cerita dari media kami menghidupkan komunitas, komunitas mempercayakan transaksi lewat marketplace kami, dan sponsor yang kami hubungkan membuat event komunitas makin besar.",`,
      `"description": "VespaKita is Indonesia's digital home for everything Vespa, run as three things at once. First, we're an independent media brand covering the Vespa world through podcasts, event coverage, and brand collaborations with communities. Second, we run a curated Vespa Marketplace where every used unit and spare part is manually checked by our team before it goes live, so buyers never have to worry about condition or paperwork. Third, we help Vespa communities across Indonesia land sponsors for their events, from touring and gatherings to national jamborees, through the brand network we've built, proven by Road to Jakarta with Vespa 60's Yogyakarta, which secured 4 national brand sponsors. All three reinforce each other: our media stories bring communities to life, communities trust our marketplace for transactions, and the sponsors we connect make community events bigger.",`,
    ],
    [
      `<!-- ABOUT / BRAND IDENTITY -->
<section class="dark" id="tentang" style="padding: 56px 0; border-top: 1px solid rgba(255,255,255,0.05);">
  <div class="wrap">
    <div class="section-head reveal" style="margin-bottom: 0;">
      <div class="eyebrow">Tentang VespaKita</div>
      <p style="max-width: 760px; color: var(--krem); opacity: 0.85; font-size: 15.5px; line-height: 1.8;">VespaKita adalah rumah digital untuk semua yang berkaitan dengan Vespa di Indonesia, dijalankan sebagai tiga hal sekaligus. Pertama, kami media independen yang meliput dunia Vespa lewat podcast, liputan event, dan kolaborasi brand dengan komunitas. Kedua, kami menjalankan <a href="/marketplace/" style="color: var(--mint); text-decoration: underline;">Marketplace Vespa terkurasi</a> tempat unit dan sparepart bekas dicek manual oleh tim kami sebelum tayang, supaya pembeli tidak was-was soal kondisi maupun keaslian dokumen. Ketiga, kami membantu <a href="/komunitas/" style="color: var(--mint); text-decoration: underline;">komunitas Vespa di seluruh Indonesia mendapatkan dukungan sponsor</a> untuk event mereka, mulai dari touring dan gathering sampai jambore nasional, lewat jaringan brand yang sudah kami bangun, dengan bukti nyata seperti Road to Jakarta bersama Vespa 60's Yogyakarta yang berhasil menggandeng 4 brand nasional. Ketiganya saling menguatkan: cerita dari media kami menghidupkan komunitas, komunitas mempercayakan transaksi lewat marketplace kami, dan sponsor yang kami hubungkan membuat event komunitas makin besar.</p>
    </div>
  </div>
</section>`,
      `<!-- ABOUT / BRAND IDENTITY -->
<section class="dark" id="about" style="padding: 56px 0; border-top: 1px solid rgba(255,255,255,0.05);">
  <div class="wrap">
    <div class="section-head reveal" style="margin-bottom: 0;">
      <div class="eyebrow">About VespaKita</div>
      <p style="max-width: 760px; color: var(--krem); opacity: 0.85; font-size: 15.5px; line-height: 1.8;">VespaKita is Indonesia's digital home for everything Vespa, run as three things at once. First, we're an independent media brand covering the Vespa world through podcasts, event coverage, and brand collaborations with communities. Second, we run a <a href="/en/marketplace/" style="color: var(--mint); text-decoration: underline;">curated Vespa Marketplace</a> where every used unit and spare part is manually checked by our team before it goes live, so buyers never have to worry about condition or paperwork. Third, we help <a href="/en/komunitas/" style="color: var(--mint); text-decoration: underline;">Vespa communities across Indonesia land sponsors</a> for their events, from touring and gatherings to national jamborees, through the brand network we've built, proven by Road to Jakarta with Vespa 60's Yogyakarta, which secured 4 national brand sponsors. All three reinforce each other: our media stories bring communities to life, communities trust our marketplace for transactions, and the sponsors we connect make community events bigger.</p>
    </div>
  </div>
</section>`,
    ],
  ];
  for (const [from, to] of metaSwaps) {
    if (!html.includes(from)) { console.warn(`WARN: meta swap source not found, skipping: ${from.slice(0, 60)}...`); continue; }
    html = html.split(from).join(to);
  }

  const assetSwaps = [
    ['src="logo.png"', 'src="../logo.png"'],
    ['src="jsp_landscape.mp4"', 'src="../jsp_landscape.mp4"'],
    ['href="vespakita-media-kit.pdf"', 'href="../vespakita-media-kit.pdf"'],
  ];
  for (const [from, to] of assetSwaps) html = html.split(from).join(to);

  html = html.replace(
    '<a href="/" class="active" onclick="localStorage.setItem(\'lang_pref\', \'id\')">ID</a>',
    '<a href="/" onclick="localStorage.setItem(\'lang_pref\', \'id\')">ID</a>'
  );
  html = html.replace(
    '<a href="/en/" onclick="localStorage.setItem(\'lang_pref\', \'en\')">EN</a>',
    '<a href="/en/" class="active" onclick="localStorage.setItem(\'lang_pref\', \'en\')">EN</a>'
  );

  const { html: translated, missing } = applyDictionaries(html, [DICT_PATH]);
  fs.writeFileSync(OUT, translated);
  console.log(`Wrote ${OUT} (${translated.length} bytes) from ${SRC}`);
  if (missing.length) {
    console.warn(`WARN: ${missing.length} dictionary entries had no match in index.html (may be stale):`);
    missing.forEach((m) => console.warn(`  - ${m.slice(0, 80)}`));
  }
}

// Generic builder for every other page: swaps lang attr + canonical/og URLs,
// rewrites relative asset paths for the extra directory depth, applies the
// dictionaries, writes the output.
function buildPage({ src, out, dicts, canonicalPath, assetSwaps = [], metaSwaps = [] }) {
  const SRC = path.join(ROOT, src);
  const OUT = path.join(ROOT, "en", out);

  let html = fs.readFileSync(SRC, "utf8");

  html = html.replace('<html lang="id">', '<html lang="en">');
  html = html.replace('<meta property="og:locale" content="id_ID">', '<meta property="og:locale" content="en_US">');

  // Scoped to exactly the canonical <link> and og:url <meta> tags — NOT a
  // bare href="X"/content="X" match, which would also catch (and wrongly
  // rewrite) hreflang="id"/"x-default" <link> tags that happen to share the
  // same ID-language URL string but must keep pointing at the ID version
  // regardless of which language build is being generated.
  const canonicalFrom = `https://www.vespakita.com${canonicalPath}`;
  const canonicalTo = `https://www.vespakita.com/en${canonicalPath}`;
  html = html.split(`<link rel="canonical" href="${canonicalFrom}" />`).join(`<link rel="canonical" href="${canonicalTo}" />`);
  html = html.split(`<meta property="og:url" content="${canonicalFrom}">`).join(`<meta property="og:url" content="${canonicalTo}">`);

  for (const [from, to] of metaSwaps) {
    if (!html.includes(from)) { console.warn(`WARN: meta swap source not found in ${src}, skipping: ${from.slice(0, 60)}...`); continue; }
    html = html.split(from).join(to);
  }

  // Nav language switcher: swap which link is "active" (mirrors buildHomepage()).
  html = html.replace(
    `<a href="${canonicalPath}" class="active" onclick="localStorage.setItem('lang_pref', 'id')">ID</a>`,
    `<a href="${canonicalPath}" onclick="localStorage.setItem('lang_pref', 'id')">ID</a>`
  );
  html = html.replace(
    `<a href="/en${canonicalPath}" onclick="localStorage.setItem('lang_pref', 'en')">EN</a>`,
    `<a href="/en${canonicalPath}" class="active" onclick="localStorage.setItem('lang_pref', 'en')">EN</a>`
  );

  // Every en/ page lives one directory deeper than its .id counterpart, so
  // relative asset paths need one extra ../ — explicit list (like the
  // homepage's own assetSwaps) rather than a generic regex, since a handful
  // of paths (JS template vars, absolute /... paths) must NOT be touched.
  for (const [from, to] of assetSwaps) {
    if (!html.includes(from)) { console.warn(`WARN: asset swap source not found in ${src}, skipping: ${from}`); continue; }
    html = html.split(from).join(to);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const { html: translated, missing } = applyDictionaries(html, dicts);
  fs.writeFileSync(OUT, translated);
  console.log(`Wrote ${OUT} (${translated.length} bytes) from ${SRC}`);
  if (missing.length) {
    console.warn(`WARN: ${missing.length} dictionary entries had no match in ${src} (may be stale):`);
    missing.forEach((m) => console.warn(`  - ${m.slice(0, 80)}`));
  }
}

buildHomepage();

buildPage({
  src: "marketplace/index.html",
  out: "marketplace/index.html",
  dicts: [path.join(ROOT, "i18n", "common-en.json"), path.join(ROOT, "i18n", "marketplace-en.json")],
  canonicalPath: "/marketplace/",
  assetSwaps: [
    ['href="../favicon.png"', 'href="../../favicon.png"'],
    ['src="../logo.png"', 'src="../../logo.png"'],
  ],
  metaSwaps: [
    ['<title>Marketplace Vespa Terkurasi | VespaKita</title>', '<title>Curated Vespa Marketplace | VespaKita</title>'],
    [
      '<meta name="description" content="Jual beli Vespa tanpa takut kena tipu. Setiap listing di Marketplace VespaKita dicek manual oleh tim kami sebelum tayang, hubungi penjual langsung lewat WhatsApp.">',
      '<meta name="description" content="Buy and sell Vespas without fear of scams. Every listing on the VespaKita Marketplace is manually checked by our team before going live — contact sellers directly via WhatsApp.">',
    ],
    ['<meta property="og:title" content="Marketplace Vespa Terkurasi | VespaKita">', '<meta property="og:title" content="Curated Vespa Marketplace | VespaKita">'],
    [
      '<meta property="og:description" content="Jual beli Vespa tanpa takut kena tipu. Setiap listing dicek manual oleh tim VespaKita sebelum tayang, hubungi penjual langsung lewat WhatsApp.">',
      '<meta property="og:description" content="Buy and sell Vespas without fear of scams. Every listing is manually checked by the VespaKita team before going live — contact sellers directly via WhatsApp.">',
    ],
  ],
});

buildPage({
  src: "komunitas/index.html",
  out: "komunitas/index.html",
  dicts: [path.join(ROOT, "i18n", "common-en.json"), path.join(ROOT, "i18n", "komunitas-en.json")],
  canonicalPath: "/komunitas/",
  assetSwaps: [
    ['href="../favicon.png"', 'href="../../favicon.png"'],
    ['src="../logo.png"', 'src="../../logo.png"'],
    ['src="../60s-yogyakarta/sponsor-hs.jpg"', 'src="../../60s-yogyakarta/sponsor-hs.jpg"'],
    ['src="../60s-yogyakarta/sponsor-kenanga.jpg"', 'src="../../60s-yogyakarta/sponsor-kenanga.jpg"'],
    ['src="../60s-yogyakarta/sponsor-unlock.png"', 'src="../../60s-yogyakarta/sponsor-unlock.png"'],
    ['src="../60s-yogyakarta/sponsor-northy.png"', 'src="../../60s-yogyakarta/sponsor-northy.png"'],
  ],
  metaSwaps: [
    ['Cari Sponsor untuk Event Komunitas Vespa | VespaKita', 'Get a Sponsor for Your Vespa Community Event | VespaKita'],
    [
      'VespaKita bantu komunitas Vespa dapatkan sponsor untuk event kalian — touring, gathering, atau jambore. Sudah terbukti membantu komunitas dapat dukungan brand. Ajukan event kamu, gratis.',
      'VespaKita helps Vespa communities get sponsors for their events — touring, gatherings, or jamborees. Already proven to help communities land brand support. Submit your event, free.',
    ],
  ],
});

buildPage({
  src: "komunitas/daftar/index.html",
  out: "komunitas/daftar/index.html",
  dicts: [path.join(ROOT, "i18n", "common-en.json"), path.join(ROOT, "i18n", "komunitas-daftar-en.json")],
  canonicalPath: "/komunitas/daftar/",
  assetSwaps: [
    ['href="../../favicon.png"', 'href="../../../favicon.png"'],
    ['src="../../logo.png"', 'src="../../../logo.png"'],
  ],
  metaSwaps: [
    ['Daftarkan Komunitas Kamu | VespaKita', 'Register Your Community | VespaKita'],
    [
      'Daftarkan komunitas Vespa kamu dan dapat halaman profil resmi di direktori — gratis, gampang, nggak perlu punya event dulu.',
      'Register your Vespa community and get an official profile page in the directory — free, easy, no need to have an event first.',
    ],
  ],
});

buildPage({
  src: "komunitas/tongkrongan/index.html",
  out: "komunitas/tongkrongan/index.html",
  dicts: [
    path.join(ROOT, "i18n", "common-en.json"),
    path.join(ROOT, "i18n", "komunitas-en.json"),
    path.join(ROOT, "i18n", "tongkrongan-en.json"),
  ],
  canonicalPath: "/komunitas/tongkrongan/",
  assetSwaps: [
    ['href="../../favicon.png"', 'href="../../../favicon.png"'],
    ['src="../../logo.png"', 'src="../../../logo.png"'],
  ],
  metaSwaps: [
    ['Tongkrongan - Ruang Obrolan Vespa | VespaKita', 'Tongkrongan - Vespa Chat Room | VespaKita'],
    [
      'Ruang obrolan komunitas Vespa se-Indonesia. Ngobrol soal touring, sparepart, modifikasi, sampai info bengkel — langsung dari sesama anak Vespa.',
      'A chat room for Vespa communities across Indonesia. Talk touring, spare parts, mods, or find a trusted workshop — straight from fellow Vespa riders.',
    ],
  ],
});
