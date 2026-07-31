#!/usr/bin/env node
// Generates en/index.html from index.html so the two language versions never
// drift apart in structure/logic again — only i18n/en.json needs upkeep.
//
// index.html is the only file anyone should hand-edit. Run this script (or let
// the deploy pipeline run it) after every change to index.html, then commit
// both files.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "index.html");
const OUT = path.join(ROOT, "en", "index.html");
const DICT_PATH = path.join(ROOT, "i18n", "en.json");

let html = fs.readFileSync(SRC, "utf8");

// ---------- structural transforms specific to the /en/ page ----------

// 1. <html lang="id"> -> <html lang="en">
html = html.replace('<html lang="id">', '<html lang="en">');

// 2. Drop the head language-redirect script entirely — /en/ doesn't redirect
//    away from itself. Matches the exact block that lives in index.html's <head>.
html = html.replace(
  /<script>\s*\(function\(\) \{\s*\/\/ If user previously chose Indonesian manually, do not redirect[\s\S]*?<\/script>\n/,
  ""
);

// 3. Meta tags: title, description, og:* — hardcoded per-language since these
//    are structural (URLs, canonical paths), not plain text translations.
const metaSwaps = [
  [
    '<title>VespaKita - Vespa Untuk Kita Semua</title>',
    '<title>VespaKita - Vespa For Us All</title>',
  ],
  [
    '<meta name="description" content="Media independen yang mendokumentasikan perjalanan, budaya, dan komunitas di Indonesia melalui konten, podcast, dan liputan event. Menghubungkan brand untuk menjangkau berbagai komunitas.">',
    '<meta name="description" content="An independent media documenting the journey, culture, and communities in Indonesia through content, podcasts, and event coverage. Connecting brands to reach various communities.">',
  ],
  [
    '<meta property="og:url" content="https://www.vespakita.com/">',
    '<meta property="og:url" content="https://www.vespakita.com/en/">',
  ],
  [
    '<meta property="og:title" content="VespaKita - Vespa Untuk Kita Semua">',
    '<meta property="og:title" content="VespaKita - Vespa For Us All">',
  ],
  [
    '<meta property="og:description" content="Media independen yang mendokumentasikan perjalanan, budaya, dan komunitas di Indonesia melalui konten, podcast, dan liputan event. Menghubungkan brand untuk menjangkau berbagai komunitas.">',
    '<meta property="og:description" content="An independent media documenting the journey, culture, and communities in Indonesia through content, podcasts, and event coverage. Connecting brands to reach various communities.">',
  ],
  [
    '<meta property="og:image" content="https://vespa-kita.pages.dev/logo.png">',
    '<meta property="og:image" content="https://www.vespakita.com/logo.png">',
  ],
];
for (const [from, to] of metaSwaps) {
  if (!html.includes(from)) {
    console.warn(`WARN: meta swap source not found, skipping: ${from.slice(0, 60)}...`);
    continue;
  }
  html = html.split(from).join(to);
}

// 4. Asset paths need a ../ prefix since en/index.html lives one directory deeper.
const assetSwaps = [
  ['src="logo.png"', 'src="../logo.png"'],
  ['src="jsp_landscape.mp4"', 'src="../jsp_landscape.mp4"'],
  ['href="vespakita-media-kit.pdf"', 'href="../vespakita-media-kit.pdf"'],
];
for (const [from, to] of assetSwaps) {
  html = html.split(from).join(to);
}

// 5. Nav language switcher: swap which link is "active".
html = html.replace(
  '<a href="/" class="active" onclick="localStorage.setItem(\'lang_pref\', \'id\')">ID</a>',
  '<a href="/" onclick="localStorage.setItem(\'lang_pref\', \'id\')">ID</a>'
);
html = html.replace(
  '<a href="/en/" onclick="localStorage.setItem(\'lang_pref\', \'en\')">EN</a>',
  '<a href="/en/" class="active" onclick="localStorage.setItem(\'lang_pref\', \'en\')">EN</a>'
);

// ---------- text translations ----------

const dict = JSON.parse(fs.readFileSync(DICT_PATH, "utf8"));
const entries = Object.entries(dict)
  .filter(([k]) => !k.startsWith("_"))
  // Longest keys first so a short string can't accidentally consume part of a
  // longer one that contains it (e.g. "Nama" vs "Nama Brand / Organisasi").
  .sort((a, b) => b[0].length - a[0].length);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let missing = [];
for (const [id, en] of entries) {
  // Single "word" keys (letters/digits only, no spaces/punctuation) are the
  // dangerous case: a plain substring replace can corrupt unrelated code that
  // happens to contain that word, e.g. "Event" inside "addEventListener".
  // Require word boundaries for those. Multi-word phrases are specific enough
  // that a plain replace is safe and simpler.
  const isSingleWord = /^[A-Za-z0-9]+$/.test(id);
  let matched = false;
  if (isSingleWord) {
    const re = new RegExp(`\\b${escapeRegExp(id)}\\b`, "g");
    html = html.replace(re, () => {
      matched = true;
      return en;
    });
  } else {
    matched = html.includes(id);
    if (matched) html = html.split(id).join(en);
  }
  if (!matched) missing.push(id);
}

fs.writeFileSync(OUT, html);
console.log(`Wrote ${OUT} (${html.length} bytes) from ${SRC}`);
if (missing.length) {
  console.warn(`WARN: ${missing.length} dictionary entries had no match in index.html (may be stale):`);
  missing.forEach((m) => console.warn(`  - ${m.slice(0, 80)}`));
}
