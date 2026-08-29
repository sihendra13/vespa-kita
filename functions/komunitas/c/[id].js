// Cloudflare Pages Function — GET /komunitas/c/:id
// Full, shareable, SEO-indexable profile page for one published community —
// same pattern as functions/marketplace/l/[id].js: server-rendered HTML with
// real OG tags, sourced from D1 instead of a hand-written file per community.

import { escapeHtml } from "../../_lib/html.js";

const SITE_URL = "https://www.vespakita.com";

function notFoundPage() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Komunitas Tidak Ditemukan | VespaKita</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" href="/favicon.png">
<style>
  body{font-family:'Work Sans',sans-serif; background:#15171A; color:#F1E8D6; min-height:100vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px;}
  a{color:#6FA89A;}
</style>
</head>
<body>
  <div>
    <h1 style="font-size:24px; margin-bottom:12px;">Komunitas tidak ditemukan</h1>
    <p style="opacity:0.75; margin-bottom:20px;">Mungkin belum di-approve, sudah dihapus, atau linknya salah.</p>
    <a href="/komunitas/">&larr; Kembali ke Direktori Komunitas</a>
  </div>
</body>
</html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=UTF-8" } });
}

export async function onRequestGet(context) {
  const { env, params } = context;
  if (!env.DB) return new Response("DB not bound", { status: 500 });

  const id = params.id;
  const community = await env.DB.prepare(`SELECT * FROM communities WHERE id = ? AND status = 'published'`).bind(id).first();
  if (!community) return notFoundPage();

  const { results: eventRows } = await env.DB
    .prepare(`SELECT * FROM community_events WHERE community_id = ? AND status = 'published' ORDER BY submitted_at DESC`)
    .bind(id)
    .all();

  const canonicalUrl = `${SITE_URL}/komunitas/c/${id}`;
  const ogImage = community.cover_photo_url || community.logo_url || `${SITE_URL}/logo-share.png`;
  const ogDescription = community.description
    ? community.description.slice(0, 160)
    : `Profil komunitas ${community.name} di VespaKita.`;

  const waHref = `https://wa.me/${community.wa}`;
  const igHref = `https://instagram.com/${community.ig}`;

  const eventsHtml = (eventRows || [])
    .map((e) => {
      const sponsorLogos = JSON.parse(e.sponsor_logos || "[]").map((s) => s.url);
      const sponsorBlock = sponsorLogos.length
        ? `<div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-top:16px; padding-top:16px; border-top:1px solid rgba(241,232,214,0.08);">
            ${sponsorLogos.map((url) => `<img src="${escapeHtml(url)}" alt="Sponsor" style="height:22px; width:auto; object-fit:contain;">`).join("")}
          </div>`
        : "";
      const statusBadge = sponsorLogos.length
        ? `<div class="event-status" style="background:rgba(212,175,55,0.12); color:var(--emas); border:1px solid rgba(212,175,55,0.35);">&#10003; Sponsor Berhasil Didapat VespaKita</div>`
        : `<div class="event-status open">Terbuka Kolaborasi</div>`;
      return `
      <div class="event-card">
        <div class="event-body" style="flex:1;">
          ${statusBadge}
          <div class="event-title">${escapeHtml(e.title)}</div>
          <div class="event-meta">${escapeHtml(e.event_date_text || "-")} &middot; ~${e.participant_estimate || "?"} peserta</div>
          ${e.description ? `<div class="event-desc" style="margin-top:8px;">${escapeHtml(e.description)}</div>` : ""}
          ${sponsorBlock}
        </div>
      </div>`;
    })
    .join("");

  const eventsSection = eventRows && eventRows.length
    ? `<div class="divider"></div>
       <section class="dark" id="kegiatan">
         <div class="wrap">
           <div class="section-head">
             <div class="eyebrow">Event &amp; Kegiatan</div>
             <h2>Kegiatan</h2>
           </div>
           <div class="event-grid">${eventsHtml}</div>
         </div>
       </section>`
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
<title>${escapeHtml(community.name)} | Komunitas VespaKita</title>
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#15171A">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
<meta name="description" content="${escapeHtml(ogDescription)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonicalUrl}" />

<meta property="og:type" content="profile">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="VespaKita">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="${escapeHtml(community.name)} | Komunitas VespaKita">
<meta property="og:description" content="${escapeHtml(ogDescription)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(community.name)} | Komunitas VespaKita">
<meta name="twitter:description" content="${escapeHtml(ogDescription)}">
<meta name="twitter:image" content="${escapeHtml(ogImage)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{
    --aspal:#15171A; --aspal-2:#1E2124; --krem:#F1E8D6; --krem-2:#E7DBC2;
    --merah:#C2272D; --merah-dark:#8F1B20; --mint:#6FA89A; --chrome:#A9A49B; --ink:#15171A; --emas:#D4AF37;
    --display:'Anton', sans-serif; --body:'Work Sans', sans-serif; --mono:'Space Mono', monospace;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:var(--body); background:var(--aspal); color:var(--krem); line-height:1.5; overflow-x:hidden;}
  img{max-width:100%; display:block;}
  a{color:inherit; text-decoration:none;}
  button{font-family:inherit; cursor:pointer;}
  textarea{font-family:inherit;}
  .wrap{max-width:1120px; margin:0 auto; padding:0 24px;}
  .narrow{max-width:760px;}
  .eyebrow{font-family:var(--mono); font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:var(--mint); display:flex; align-items:center; gap:10px; margin-bottom:16px;}
  .eyebrow::before{content:""; width:22px; height:2px; background:var(--merah); display:inline-block;}
  h1,h2,h3{font-family:var(--display); font-weight:400; text-transform:uppercase; letter-spacing:0.01em; line-height:0.98;}
  section{position:relative; padding:64px 0;}
  .dark{background:var(--aspal); color:var(--krem);}

  nav.top{position:fixed; top:0; left:0; right:0; z-index:50; background:rgba(21,23,26,0.78); backdrop-filter:blur(6px); border-bottom:1px solid rgba(241,232,214,0.1);}
  nav.top .wrap{display:flex; align-items:center; justify-content:space-between; padding-top:14px; padding-bottom:14px;}
  .logo img{height:44px; width:auto; display:block;}
  .navlinks{display:flex; gap:28px; font-size:13px; letter-spacing:0.04em; text-transform:uppercase; font-family:var(--mono);}
  .navlinks a{opacity:0.75; transition:opacity .2s;}
  .navlinks a:hover{opacity:1; color:var(--mint);}
  @media (max-width:760px){ .navlinks{display:none;} }

  .btn{display:inline-block; padding:14px 24px; font-family:var(--mono); font-size:13px; letter-spacing:0.05em; text-transform:uppercase; border-radius:2px; transition:transform .15s ease, background .15s ease; border:none;}
  .btn:hover{transform:translateY(-2px);}
  .btn-primary{background:var(--merah); color:var(--krem);}
  .btn-primary:hover{background:#D6363C;}
  .btn-outline{border:1.5px solid var(--krem); color:var(--krem); background:transparent;}
  .btn-outline:hover{background:var(--krem); color:var(--aspal);}
  .btn-sm{padding:10px 16px; font-size:12px;}

  .profile-cover{margin-top:68px; width:100%; height:260px; background:var(--ink) center/cover no-repeat; position:relative;}
  .profile-cover::after{content:""; position:absolute; inset:0; background:linear-gradient(to top, var(--aspal) 0%, rgba(21,23,26,0.2) 60%, rgba(21,23,26,0.1) 100%);}
  .profile-head{display:flex; align-items:flex-end; gap:24px; margin-top:-64px; position:relative; z-index:2; flex-wrap:wrap;}
  .profile-logo{width:112px; height:112px; border-radius:50%; border:4px solid var(--aspal); background:var(--aspal-2) center/contain no-repeat; flex-shrink:0;}
  .profile-info{flex:1; padding-bottom:8px; min-width:240px;}
  .profile-name{font-size:clamp(22px,4vw,34px); display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
  .profile-badge{width:24px; height:24px; color:var(--emas); flex-shrink:0;}
  .profile-meta{font-family:var(--mono); font-size:12px; color:var(--chrome); text-transform:uppercase; letter-spacing:0.04em; margin-top:8px; display:flex; gap:16px; flex-wrap:wrap;}
  .profile-actions{display:flex; gap:12px; padding-bottom:8px; flex-wrap:wrap;}
  .about-text{color:var(--krem-2); font-size:15px; max-width:720px; margin-top:16px; line-height:1.7; white-space:pre-line;}

  .section-head{max-width:640px; margin-bottom:28px;}
  .section-head h2{font-size:clamp(24px,3.4vw,32px);}
  .divider{height:1px; background:rgba(241,232,214,0.1); margin:0;}

  .event-grid{display:grid; grid-template-columns:1fr; gap:16px;}
  .event-card{background:var(--aspal-2); border:1px solid rgba(241,232,214,0.1); border-radius:6px; padding:24px;}
  .event-title{font-weight:700; font-size:16px; margin-top:8px;}
  .event-meta{font-family:var(--mono); font-size:10.5px; color:var(--chrome); text-transform:uppercase; margin-top:6px;}
  .event-desc{color:var(--chrome); font-size:13.5px; line-height:1.6;}
  .event-status{font-family:var(--mono); font-size:10px; text-transform:uppercase; letter-spacing:0.05em; padding:3px 9px; border-radius:10px; display:inline-block;}
  .event-status.open{background:rgba(111,168,154,0.12); color:var(--mint); border:1px solid rgba(111,168,154,0.35);}

  .comment-box{background:var(--aspal-2); border:1px solid rgba(241,232,214,0.1); border-radius:6px; padding:28px;}
  .login-gate{display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px; background:var(--aspal); border:1px dashed rgba(241,232,214,0.2); border-radius:6px; flex-wrap:wrap;}
  .login-gate p{font-size:13.5px; color:var(--chrome); max-width:360px;}
  .btn-google{display:inline-flex; align-items:center; gap:10px; background:var(--krem); color:var(--ink); padding:12px 20px; border-radius:2px; font-family:var(--mono); font-size:12.5px; text-transform:uppercase; letter-spacing:0.03em; border:none;}

  footer{background:var(--aspal); padding:50px 0 34px; border-top:1px solid rgba(241,232,214,0.08);}
  .footer-grid{display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:24px;}
  footer p{color:var(--chrome); font-size:13px;}
  .foot-links{display:flex; gap:18px; font-family:var(--mono); font-size:12px; text-transform:uppercase; letter-spacing:0.05em;}

  .bottom-nav{display:none; position:fixed; top:auto; bottom:0; left:0; right:0; background:rgba(23,25,27,0.95); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-top:1px solid rgba(255,255,255,0.1); z-index:1000; padding-bottom:env(safe-area-inset-bottom, 0px);}
  .bnav-item{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px 0 10px; color:var(--chrome); text-decoration:none; font-size:10px; font-family:var(--mono); text-transform:uppercase; transition:all 0.2s;}
  .bnav-item svg{margin-bottom:4px; width:22px; height:22px; opacity:0.7; transition:all 0.2s;}
  .bnav-item:hover, .bnav-item.active{color:var(--krem);}
  .bnav-item:hover svg, .bnav-item.active svg{opacity:1; color:var(--merah);}
  @media (max-width:768px){
    .bottom-nav{display:flex;}
    body{padding-bottom:70px;}
  }
</style>
</head>
<body>

<nav class="top">
  <div class="wrap">
    <a href="/" class="logo"><img src="/logo.png" alt="VespaKita Logo"></a>
    <div class="navlinks">
      <a href="/">Beranda</a>
      <a href="/marketplace/">Marketplace</a>
      <a href="/komunitas/">Komunitas</a>
    </div>
  </div>
</nav>

<div class="profile-cover" style="background-image:url('${escapeHtml(community.cover_photo_url || community.logo_url || "")}')"></div>

<section class="dark" style="padding-top:0;">
  <div class="wrap">
    <div class="profile-head">
      <div class="profile-logo" style="background-image:url('${escapeHtml(community.logo_url || "")}')"></div>
      <div class="profile-info">
        <div class="profile-name">
          ${escapeHtml(community.name)}
          <svg class="profile-badge" viewBox="0 0 24 24" fill="currentColor" title="Terverifikasi"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.46 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>
        </div>
        <div class="profile-meta">
          <span>&#128205; ${escapeHtml(community.city)}</span>
          ${community.member_estimate ? `<span>${escapeHtml(community.member_estimate)} Anggota</span>` : ""}
        </div>
      </div>
      <div class="profile-actions">
        ${community.ig ? `<a href="${escapeHtml(igHref)}" target="_blank" rel="noopener" class="btn btn-outline">Instagram</a>` : ""}
        ${community.wa ? `<a href="${escapeHtml(waHref)}" target="_blank" rel="noopener" class="btn btn-primary">Hubungi via WA</a>` : ""}
      </div>
    </div>

    ${community.description ? `<p class="about-text">${escapeHtml(community.description)}</p>` : ""}
  </div>
</section>

${eventsSection}

<div class="divider"></div>

<section class="dark" id="komentar">
  <div class="wrap narrow">
    <div class="section-head">
      <div class="eyebrow">Komentar</div>
      <h2>Diskusi</h2>
      <p style="margin-top:10px; color:var(--chrome); font-size:14px;">Fitur komentar segera hadir — login diperlukan supaya komentar bukan dari akun palsu.</p>
    </div>
    <div class="comment-box">
      <div class="login-gate">
        <p>Login untuk ikut berkomentar di halaman komunitas ini.</p>
        <button class="btn-google" disabled style="opacity:0.6; cursor:not-allowed;">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09Z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"/></svg>
          Login dengan Google (segera)
        </button>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap footer-grid">
    <div>
      <div class="logo" style="font-size:18px;"><img src="/logo.png" alt="VespaKita Logo" style="height:48px;"></div>
      <p style="margin-top:8px;">Yogyakarta - Indonesia</p>
    </div>
    <div class="foot-links">
      <a href="/">Beranda</a>
      <a href="/komunitas/">Komunitas</a>
    </div>
  </div>
</footer>

<nav class="bottom-nav">
  <a href="/" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    <span>Beranda</span>
  </a>
  <a href="/marketplace/" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
    <span>Jual Beli</span>
  </a>
  <a href="/komunitas/" class="bnav-item active">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M12 3.5a4 4 0 0 1 0 7"></path></svg>
    <span>Komunitas</span>
  </a>
  <a href="/#kolaborasi" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    <span>Kolaborasi</span>
  </a>
</nav>

<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', { item_id: ${JSON.stringify(id)}, item_name: ${JSON.stringify(community.name)}, content_type: 'community_profile' });
  }
</script>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=UTF-8" } });
}
