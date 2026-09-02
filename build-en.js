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
    ['Direktori Komunitas Vespa | VespaKita', 'Vespa Community Directory | VespaKita'],
    [
      'Direktori komunitas Vespa di seluruh Indonesia — cari komunitas sesuai kotamu, lihat event & kegiatan mereka, atau daftarkan komunitasmu sendiri gratis.',
      'A directory of Vespa communities across Indonesia — find one in your city, see their events and activities, or register your own community for free.',
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
