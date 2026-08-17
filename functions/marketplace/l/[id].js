// Cloudflare Pages Function — GET /marketplace/l/:id
// Full, shareable, SEO-indexable detail page for one published listing —
// replaces the old JS modal so photos get native pinch-zoom (<img>, not a
// CSS background) and the URL carries real per-listing OG tags for link
// previews (WhatsApp, etc). Visual language (gold seal badge, IG row,
// white price) mirrors marketplace/index.html's card/modal styling.

import { escapeHtml } from "../../_lib/html.js";

const SITE_URL = "https://www.vespakita.com";

function fmtRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function notFoundPage() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Listing Tidak Ditemukan | VespaKita Marketplace</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" href="/favicon.png">
<style>
  body{font-family:'Work Sans',sans-serif; background:#15171A; color:#F1E8D6; min-height:100vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px;}
  a{color:#6FA89A;}
</style>
</head>
<body>
  <div>
    <h1 style="font-size:24px; margin-bottom:12px;">Listing tidak ditemukan</h1>
    <p style="opacity:0.75; margin-bottom:20px;">Mungkin sudah dihapus, belum di-approve, atau linknya salah.</p>
    <a href="/marketplace/">&larr; Kembali ke Marketplace</a>
  </div>
</body>
</html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=UTF-8" } });
}

export async function onRequestGet(context) {
  const { env, params } = context;
  if (!env.DB) return new Response("DB not bound", { status: 500 });

  const id = params.id;
  const row = await env.DB.prepare(`SELECT * FROM listings WHERE id = ? AND status = 'published'`).bind(id).first();
  if (!row) return notFoundPage();

  const photos = JSON.parse(row.photos || "[]").map((p) => p.url);
  const video = row.video ? JSON.parse(row.video).url : null;
  const title = row.title;
  const price = row.price;
  const canonicalUrl = `${SITE_URL}/marketplace/l/${id}`;
  const ogImage = photos[0] || `${SITE_URL}/logo-share.png`;
  const ogDescription = `${row.condition} · ${row.year} · ${row.location}. ${fmtRupiah(price)}. Dicek manual oleh tim VespaKita.`;

  const waMsg = `Halo, saya lihat listing ${title} di Marketplace VespaKita (${canonicalUrl}). Apakah unit ini masih tersedia?`;
  const waHref = `https://wa.me/${row.seller_phone}?text=${encodeURIComponent(waMsg)}`;

  const badges = [row.doc_surat, row.doc_pajak ? `Pajak ${row.doc_pajak}` : "", row.doc_kepemilikan]
    .filter(Boolean)
    .map((b) => `<span class="doc-badge">${escapeHtml(b)}</span>`)
    .join("");

  const thumbs = photos.length > 1
    ? `<div class="thumbs">${photos
        .map((p, i) => `<img src="${escapeHtml(p)}" class="thumb${i === 0 ? " active" : ""}" data-src="${escapeHtml(p)}" alt="Foto ${i + 1}">`)
        .join("")}</div>`
    : "";

  const igRow = row.seller_ig
    ? `<div class="ig-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        IG Penjual: <a href="https://instagram.com/${escapeHtml(row.seller_ig)}" target="_blank" rel="noopener">@${escapeHtml(row.seller_ig)}</a>
      </div>`
    : "";

  const minusBlock = row.minus_desc
    ? `<div class="minus-box">
        <div class="minus-label">Minus / Kekurangan (Info dari Penjual)</div>
        <div class="minus-text">${escapeHtml(row.minus_desc)}</div>
      </div>`
    : "";

  const videoBlock = video
    ? `<div class="video-wrap"><video src="${escapeHtml(video)}" controls playsinline></video></div>`
    : "";

  const descBlock = row.description
    ? `<div class="desc-text">${escapeHtml(row.description)}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6LLXWQ6MMM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-6LLXWQ6MMM');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} - ${escapeHtml(fmtRupiah(price))} | VespaKita Marketplace</title>
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
<meta name="description" content="${escapeHtml(ogDescription)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonicalUrl}" />

<meta property="og:type" content="product">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="VespaKita Marketplace">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="${escapeHtml(title)} - ${escapeHtml(fmtRupiah(price))}">
<meta property="og:description" content="${escapeHtml(ogDescription)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:image:alt" content="${escapeHtml(title)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)} - ${escapeHtml(fmtRupiah(price))}">
<meta name="twitter:description" content="${escapeHtml(ogDescription)}">
<meta name="twitter:image" content="${escapeHtml(ogImage)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{
    --aspal:#15171A; --aspal-2:#1E2124; --krem:#F1E8D6; --krem-2:#E7DBC2;
    --merah:#C2272D; --merah-dark:#8F1B20; --mint:#6FA89A; --chrome:#A9A49B; --ink:#15171A; --emas:#D4AF37;
    --display:'Anton',sans-serif; --body:'Work Sans',sans-serif; --mono:'Space Mono',monospace;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{font-family:var(--body); background:var(--aspal); color:var(--krem); line-height:1.5;}
  img{max-width:100%; display:block;}
  a{color:inherit; text-decoration:none;}
  h1{font-family:var(--display); font-weight:400; text-transform:uppercase; letter-spacing:0.01em; line-height:1.05;}
  .wrap{max-width:760px; margin:0 auto; padding:0 20px;}

  nav{position:fixed; top:0; left:0; right:0; z-index:50; background:rgba(21,23,26,0.9); backdrop-filter:blur(6px); border-bottom:1px solid rgba(241,232,214,0.1); padding:14px 0;}
  nav .wrap{display:flex; align-items:center; justify-content:space-between;}
  .logo img{height:44px; width:auto; display:block;}
  .navcta{background:var(--merah); color:var(--krem); padding:9px 16px; font-family:var(--mono); font-size:12px; letter-spacing:0.05em; text-transform:uppercase; border-radius:2px;}

  main{padding-top:96px; padding-bottom:64px;}
  .back-link{display:inline-flex; align-items:center; gap:6px; font-family:var(--mono); font-size:12px; letter-spacing:0.04em; text-transform:uppercase; color:var(--chrome); margin-bottom:20px;}
  .back-link:hover{color:var(--mint);}

  .main-photo-wrap{width:100%; border-radius:8px; overflow:hidden; background:var(--ink); margin-bottom:10px;}
  .main-photo-wrap img{width:100%; height:auto; aspect-ratio:4/3; object-fit:cover;}
  .thumbs{display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap;}
  .thumb{width:64px; height:64px; object-fit:cover; border-radius:4px; cursor:pointer; opacity:0.55; border:2px solid transparent;}
  .thumb.active{opacity:1; border-color:var(--mint);}

  h1{font-size:clamp(24px,4.5vw,34px); margin-bottom:14px;}
  .doc-badge{
    font-family:var(--mono); font-size:10.5px; letter-spacing:0.04em; text-transform:uppercase;
    background:rgba(111,168,154,0.12); color:var(--mint); border:1px solid rgba(111,168,154,0.35);
    padding:5px 10px; border-radius:12px; display:inline-block; margin:0 8px 8px 0;
  }
  .price{font-family:var(--mono); font-weight:700; font-size:26px; color:var(--krem); margin:14px 0 6px;}
  .stats-row{display:flex; gap:14px; font-family:var(--mono); font-size:11.5px; color:var(--chrome); margin-bottom:20px;}
  .stats-row span{display:inline-flex; align-items:center; gap:5px;}
  .spec-grid{display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; padding-bottom:24px; border-bottom:1px dashed rgba(241,232,214,0.18);}
  .spec-item .k{font-family:var(--mono); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:var(--chrome); margin-bottom:4px;}
  .spec-item .v{font-size:14px; color:var(--krem);}

  .curation-box{background:rgba(111,168,154,0.08); border:1px solid rgba(111,168,154,0.25); border-radius:4px; padding:12px 16px; margin-bottom:24px; font-size:13px;}
  .curation-row{display:flex; align-items:center; gap:7px; color:var(--mint);}
  .ig-row{display:flex; align-items:center; gap:7px; margin-top:8px; color:var(--krem);}
  .ig-row a{color:var(--mint); text-decoration:underline;}

  .desc-text{font-size:14px; color:var(--krem); opacity:0.9; line-height:1.6; margin-bottom:24px; white-space:pre-line;}

  .minus-box{background:rgba(194,39,45,0.08); border:1px solid rgba(194,39,45,0.3); border-radius:4px; padding:14px 16px; margin-bottom:24px;}
  .minus-label{font-family:var(--mono); font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--merah); margin-bottom:6px;}
  .minus-text{font-size:13.5px; color:var(--krem); white-space:pre-line;}

  .video-wrap{margin-bottom:24px;}
  .video-wrap video{width:100%; border-radius:6px; background:#000;}

  .btn{
    display:flex; align-items:center; justify-content:center; gap:8px; width:100%;
    padding:16px 0; font-family:var(--mono); font-size:13px; letter-spacing:0.05em; text-transform:uppercase;
    border-radius:2px; background:var(--merah); color:var(--krem); transition:transform .15s ease, background .15s ease;
  }
  .btn:hover{background:#D6363C; transform:translateY(-2px);}

  footer{background:var(--aspal); padding:40px 0; border-top:1px solid rgba(241,232,214,0.08); text-align:center;}
  footer p{color:var(--chrome); font-size:13px;}
</style>
</head>
<body>

<nav>
  <div class="wrap">
    <a href="/" class="logo"><img src="/logo.png" alt="VespaKita Logo"></a>
    <a href="/marketplace/#jual" class="navcta">Jual Vespa Kamu</a>
  </div>
</nav>

<main>
  <div class="wrap">
    <a href="/marketplace/" class="back-link">&larr; Kembali ke Listing</a>

    <div class="main-photo-wrap">
      <img id="main-photo" src="${escapeHtml(photos[0] || "")}" alt="${escapeHtml(title)}">
    </div>
    ${thumbs}

    <h1>${escapeHtml(title)}</h1>
    <div>${badges}</div>
    <div class="price">${escapeHtml(fmtRupiah(price))}</div>
    <div class="stats-row">
      <span>&#128065; <span id="views-count">${row.views}</span> Views</span>
      <span>&#128172; <span id="clicks-count">${row.clicks}</span> Chat WA</span>
    </div>

    <div class="spec-grid">
      <div class="spec-item"><div class="k">Tahun</div><div class="v">${escapeHtml(row.year)}</div></div>
      <div class="spec-item"><div class="k">Kondisi</div><div class="v">${escapeHtml(row.condition)}</div></div>
      <div class="spec-item"><div class="k">Lokasi</div><div class="v">${escapeHtml(row.location)}</div></div>
      <div class="spec-item"><div class="k">Penjual</div><div class="v">${escapeHtml(row.seller_name)}</div></div>
    </div>

    <div class="curation-box">
      <div class="curation-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.46 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>
        Dikurasi oleh Admin VespaKita
      </div>
      ${igRow}
    </div>

    ${descBlock}
    ${minusBlock}
    ${videoBlock}

    <a href="${waHref}" target="_blank" rel="noopener" class="btn" id="wa-cta">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.84.5 3.56 1.35 5.04L2 22l5.13-1.34A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18a7.94 7.94 0 0 1-4.06-1.11l-.29-.17-3.03.79.81-2.95-.19-.3A7.96 7.96 0 1 1 20 12a8 8 0 0 1-8 8Zm4.34-5.98c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.18-1.39-1.31-1.63-.14-.24-.02-.36.1-.48.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.75-1.79-.2-.47-.4-.41-.54-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z"></path></svg>
      Hubungi Penjual via WhatsApp
    </a>
  </div>
</main>

<footer>
  <p>VespaKita &middot; Yogyakarta - Indonesia</p>
</footer>

<script>
  document.querySelectorAll('.thumb').forEach((el) => {
    el.addEventListener('click', () => {
      document.getElementById('main-photo').src = el.dataset.src;
      document.querySelectorAll('.thumb').forEach((t) => t.classList.remove('active'));
      el.classList.add('active');
    });
  });
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', { item_id: ${JSON.stringify(id)}, item_name: ${JSON.stringify(title)} });
  }

  // Client-side only, so bot/crawler hits (WhatsApp/Facebook/Google fetching
  // this page for a link preview or index) don't inflate the counters.
  var listingId = ${JSON.stringify(id)};
  var viewedKey = 'vk_viewed_' + listingId;
  if (!sessionStorage.getItem(viewedKey)) {
    sessionStorage.setItem(viewedKey, '1');
    fetch('/api/marketplace-track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: listingId, type: 'view' }),
    }).then(function () {
      var el = document.getElementById('views-count');
      el.textContent = Number(el.textContent) + 1;
    }).catch(function () {});
  }

  document.getElementById('wa-cta').addEventListener('click', () => {
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { content_type: 'marketplace_contact_seller', item_id: ${JSON.stringify(id)} });
    fetch('/api/marketplace-track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: listingId, type: 'click' }),
    }).catch(function () {});
  });
</script>

</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=UTF-8" } });
}
