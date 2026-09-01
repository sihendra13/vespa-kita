// Cloudflare Pages Function — GET /komunitas/c/:id (and, via the thin
// wrapper at functions/en/komunitas/c/[id].js, GET /en/komunitas/c/:id)
// Full, shareable, SEO-indexable profile page for one published community —
// same pattern as functions/marketplace/l/[id].js: server-rendered HTML with
// real OG tags, sourced from D1 instead of a hand-written file per community.
//
// Community content (name, description, event titles/descriptions, member
// comments) is whatever the organizer/members typed and is never translated
// on the /en/ route — only this file's own UI chrome (labels, buttons, nav)
// is.

import { escapeHtml } from "../../_lib/html.js";

const SITE_URL = "https://www.vespakita.com";

// UI chrome strings. t(lang, id, en) picks the right one — every other
// static label in the template below goes through this instead of being
// hardcoded, so the /en/ wrapper doesn't need its own copy of the file.
function t(lang, id, en) {
  return lang === "en" ? en : id;
}

function notFoundPage(lang) {
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t(lang, "Komunitas Tidak Ditemukan", "Community Not Found")} | VespaKita</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" href="/favicon.png">
<style>
  body{font-family:'Work Sans',sans-serif; background:#15171A; color:#F1E8D6; min-height:100vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px;}
  a{color:#6FA89A;}
</style>
</head>
<body>
  <div>
    <h1 style="font-size:24px; margin-bottom:12px;">${t(lang, "Komunitas tidak ditemukan", "Community not found")}</h1>
    <p style="opacity:0.75; margin-bottom:20px;">${t(lang, "Mungkin belum di-approve, sudah dihapus, atau linknya salah.", "It may not be approved yet, was removed, or the link is wrong.")}</p>
    <a href="${lang === "en" ? "/en/komunitas/" : "/komunitas/"}">&larr; ${t(lang, "Kembali ke Direktori Komunitas", "Back to Community Directory")}</a>
  </div>
</body>
</html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=UTF-8" } });
}

export async function renderCommunityPage(context, lang) {
  const { env, params } = context;
  if (!env.DB) return new Response("DB not bound", { status: 500 });

  const id = params.id;
  const community = await env.DB.prepare(`SELECT * FROM communities WHERE id = ? AND status = 'published'`).bind(id).first();
  if (!community) return notFoundPage(lang);

  const { results: eventRows } = await env.DB
    .prepare(`SELECT * FROM community_events WHERE community_id = ? AND status = 'published' ORDER BY submitted_at DESC`)
    .bind(id)
    .all();

  const langPrefix = lang === "en" ? "/en" : "";
  const canonicalUrl = `${SITE_URL}${langPrefix}/komunitas/c/${id}`;
  const ogImage = community.cover_photo_url || community.logo_url || `${SITE_URL}/logo-share.png`;
  const ogDescription = community.description
    ? community.description.slice(0, 160)
    : t(lang, `Profil komunitas ${community.name} di VespaKita.`, `${community.name}'s community profile on VespaKita.`);

  const waHref = `https://wa.me/${community.wa}`;
  const igHref = `https://instagram.com/${community.ig}`;

  const eventsHtml = (eventRows || [])
    .map((e) => {
      const sponsorLogos = JSON.parse(e.sponsor_logos || "[]").map((s) => s.url);
      const mainSponsors = sponsorLogos.filter(url => !url.toLowerCase().includes("northy"));
      const apparelSponsors = sponsorLogos.filter(url => url.toLowerCase().includes("northy"));
      const sponsorBlock = sponsorLogos.length
        ? `<div style="margin-top:24px; padding:24px; background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-radius:16px; border:1px solid rgba(255,255,255,0.06); box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            ${mainSponsors.length ?
              `<div style="font-family:var(--mono); font-size:13px; letter-spacing:0.15em; color:#f1e8d6; text-transform:uppercase; font-weight:600; margin-bottom:16px;">
                SUPPORTED BY
                <div style="width:60px; height:1px; background:rgba(255,255,255,0.2); margin-top:8px;"></div>
              </div>
              <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:${apparelSponsors.length ? 24 : 0}px;">
                ${mainSponsors.map((url) => {
                  const isUnlock = url.toLowerCase().includes("unlock");
                  const imgStyle = isUnlock ? "height:44px; width:auto; object-fit:contain; mix-blend-mode:multiply; transform:scale(1.2);" : "height:44px; width:auto; object-fit:contain; mix-blend-mode:multiply;";
                  return `<div style="background:#ffffff; border-radius:12px; padding:10px 14px; height:68px; min-width:80px; display:flex; align-items:center; justify-content:center; overflow:hidden;"><img src="${escapeHtml(url)}" style="${imgStyle}"></div>`;
                }).join("")}
              </div>`
            : ""}
            ${apparelSponsors.length ?
              `<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <span style="font-family:var(--mono); font-size:11.5px; letter-spacing:0.1em; color:#4ade80; text-transform:uppercase; font-weight:600;">Apparel Partner:</span>
                ${apparelSponsors.map(url => `<img src="${escapeHtml(url)}" style="height:24px; width:auto; object-fit:contain; filter:brightness(0) invert(1) drop-shadow(0 0 6px rgba(255,255,255,0.5));">`).join("")}
              </div>`
            : ""}
          </div>`
        : "";
      const statusBadge = sponsorLogos.length
        ? `<div class="event-status" style="background:rgba(212,175,55,0.12); color:var(--emas); border:1px solid rgba(212,175,55,0.35);">&#10003; ${t(lang, "Sponsor Berhasil Didapat VespaKita", "Sponsorship Secured via VespaKita")}</div>`
        : `<div class="event-status open">${t(lang, "Terbuka Kolaborasi", "Open for Collaboration")}</div>`;
      const detailLink = e.detail_url
        ? `<a href="${escapeHtml(e.detail_url)}" class="btn btn-outline btn-sm" style="margin-top:16px;">${t(lang, "Lihat Detail Lengkap", "View Full Details")}</a>`
        : "";
      return `
      <div class="event-card">
        <div class="event-body" style="flex:1;">
          ${statusBadge}
          <div class="event-title">${escapeHtml(e.title)}</div>
          <div class="event-meta">${escapeHtml(e.event_date_text || "-")} &middot; ~${e.participant_estimate || "?"} ${t(lang, "peserta", "participants")}</div>
          ${e.description ? `<div class="event-desc" style="margin-top:8px;">${escapeHtml(e.description)}</div>` : ""}
          ${sponsorBlock}
          ${detailLink}
        </div>
      </div>`;
    })
    .join("");

  const eventsSection = eventRows && eventRows.length
    ? `<div class="divider"></div>
       <section class="dark" id="kegiatan">
         <div class="wrap">
           <div class="section-head">
             <div class="eyebrow">${t(lang, "Event &amp; Kegiatan", "Events &amp; Activities")}</div>
             <h2>${t(lang, "Kegiatan", "Activities")}</h2>
           </div>
           <div class="event-grid">${eventsHtml}</div>
         </div>
       </section>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${lang}">
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
<title>${escapeHtml(community.name)} | ${t(lang, "Komunitas VespaKita", "VespaKita Community")}</title>
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
<meta property="og:locale" content="${lang === "en" ? "en_US" : "id_ID"}">
<meta property="og:title" content="${escapeHtml(community.name)} | ${t(lang, "Komunitas VespaKita", "VespaKita Community")}">
<meta property="og:description" content="${escapeHtml(ogDescription)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(community.name)} | ${t(lang, "Komunitas VespaKita", "VespaKita Community")}">
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

  .profile-cover{margin-top:68px; width:100%; height:400px; background:var(--ink) center 30%/cover no-repeat; position:relative;}
  .profile-cover::after{content:""; position:absolute; inset:0; background:linear-gradient(to top, var(--aspal) 0%, rgba(21,23,26,0.2) 60%, rgba(21,23,26,0.1) 100%);}
  .profile-head{display:flex; align-items:flex-end; gap:28px; margin-top:-76px; position:relative; z-index:2; flex-wrap:wrap;}
  .profile-logo{width:144px; height:144px; border-radius:50%; border:6px solid var(--aspal); background:#ffffff center/70% no-repeat; box-shadow: 0 4px 24px rgba(0,0,0,0.4); flex-shrink:0;}
  .profile-info{flex:1; padding-bottom:8px; min-width:240px;}
  .profile-name{font-size:clamp(28px,5vw,42px); font-weight: 500; display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
  .profile-badge{width:24px; height:24px; color:var(--emas); flex-shrink:0;}
  .profile-meta{font-family:var(--mono); font-size:13px; color:var(--chrome); text-transform:uppercase; letter-spacing:0.04em; margin-top:8px; display:flex; gap:16px; flex-wrap:wrap;}
  .profile-actions{display:flex; gap:12px; padding-bottom:8px; flex-wrap:wrap;}
  .about-text{color:rgba(239,233,216,0.85); font-size:16.5px; max-width:800px; margin-top:24px; line-height:1.8; white-space:pre-line; letter-spacing:0.01em;}

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
  .comment-composer{display:none; gap:14px; align-items:flex-start; margin-bottom:24px;}
  .comment-composer.active{display:flex;}
  .avatar{width:38px; height:38px; border-radius:50%; background:var(--merah) center/cover no-repeat; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:13px; color:var(--krem);}
  .composer-input{flex:1;}
  .composer-input textarea{width:100%; background:var(--aspal); color:var(--krem); border:1px solid rgba(241,232,214,0.18); border-radius:4px; padding:12px 14px; font-size:14px; resize:vertical; min-height:60px;}
  .composer-input textarea:focus{outline:2px solid var(--mint); outline-offset:1px;}
  .composer-actions{display:flex; justify-content:space-between; align-items:center; margin-top:10px;}
  .composer-msg{font-size:12px; color:var(--merah);}
  .comment-list{display:flex; flex-direction:column; gap:20px; margin-top:8px;}
  .comment-item{display:flex; gap:14px; align-items:flex-start;}
  .comment-content{flex:1; max-width:65ch;}
  .comment-head{display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
  .comment-name{font-weight:700; font-size:13.5px;}
  .admin-badge{font-family:var(--mono); font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; background:rgba(212,175,55,0.12); color:var(--emas); border:1px solid rgba(212,175,55,0.35); padding:2px 7px; border-radius:9px;}
  .comment-time{font-family:var(--mono); font-size:11px; color:var(--chrome);}
  .comment-text{font-size:14px; color:var(--krem-2); margin-top:4px; line-height:1.55; white-space:pre-line;}
  .comment-empty{color:var(--chrome); font-size:13.5px; text-align:center; padding:20px 0;}

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
    <a href="${lang === "en" ? "/en/" : "/"}" class="logo"><img src="/logo.png" alt="VespaKita Logo"></a>
    <div class="navlinks">
      <a href="${lang === "en" ? "/en/" : "/"}">${t(lang, "Beranda", "Home")}</a>
      <a href="${langPrefix}/marketplace/">Marketplace</a>
      <a href="${langPrefix}/komunitas/">${t(lang, "Komunitas", "Community")}</a>
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
          <svg class="profile-badge" viewBox="0 0 24 24" fill="currentColor" title="${t(lang, "Terverifikasi", "Verified")}"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.46 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>
        </div>
        <div class="profile-meta">
          <span>&#128205; ${escapeHtml(community.city)}</span>
          ${community.member_estimate ? `<span>${escapeHtml(community.member_estimate)} ${t(lang, "Anggota", "Members")}</span>` : ""}
        </div>
      </div>
      <div class="profile-actions">
        ${community.ig ? `<a href="${escapeHtml(igHref)}" target="_blank" rel="noopener" class="btn btn-outline" style="display:flex; align-items:center; gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> Instagram</a>` : ""}
        ${community.wa ? `<a href="${escapeHtml(waHref)}" target="_blank" rel="noopener" class="btn btn-primary">${t(lang, "Hubungi via WA", "Contact via WA")}</a>` : ""}
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
      <div class="eyebrow">${t(lang, "Komentar", "Comments")}</div>
      <h2>${t(lang, "Diskusi", "Discussion")}</h2>
      <p style="margin-top:10px; color:var(--chrome); font-size:14px;">${t(lang, "Tanya soal event, ajak gabung, atau kasih testimoni. Login diperlukan supaya komentar bukan dari akun palsu.", "Ask about events, invite others to join, or leave a testimonial. Login is required so comments can't come from fake accounts.")}</p>
    </div>
    <div class="comment-box">
      <div class="login-gate" id="login-gate">
        <p>${t(lang, "Login untuk ikut berkomentar di halaman komunitas ini.", "Log in to join the discussion on this community page.")}</p>
        <div id="google-signin-btn"></div>
      </div>

      <div class="comment-composer" id="composer">
        <div class="avatar" id="my-avatar"></div>
        <div class="composer-input">
          <textarea id="comment-input" placeholder="${t(lang, "Tulis komentar...", "Write a comment...")}" maxlength="500"></textarea>
          <div class="composer-actions">
            <span class="composer-msg" id="composer-msg"></span>
            <button class="btn btn-primary btn-sm" id="btn-post-comment">${t(lang, "Kirim", "Send")}</button>
          </div>
        </div>
      </div>

      <div class="comment-list" id="comment-list"><div class="comment-empty">${t(lang, "Memuat komentar...", "Loading comments...")}</div></div>
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
      <a href="${lang === "en" ? "/en/" : "/"}">${t(lang, "Beranda", "Home")}</a>
      <a href="${langPrefix}/komunitas/">${t(lang, "Komunitas", "Community")}</a>
    </div>
  </div>
</footer>

<nav class="bottom-nav">
  <a href="${lang === "en" ? "/en/" : "/"}" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    <span>${t(lang, "Beranda", "Home")}</span>
  </a>
  <a href="${langPrefix}/marketplace/" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
    <span>${t(lang, "Jual Beli", "Marketplace")}</span>
  </a>
  <a href="${lang === "en" ? "/en/" : "/"}#next-events" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    <span>${t(lang, "Event", "Events")}</span>
  </a>
  <a href="${langPrefix}/komunitas/" class="bnav-item active">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M12 3.5a4 4 0 0 1 0 7"></path></svg>
    <span>${t(lang, "Komunitas", "Community")}</span>
  </a>
  <a href="${lang === "en" ? "/en/" : "/"}#kolaborasi" class="bnav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    <span>${t(lang, "Kolaborasi", "Collaborate")}</span>
  </a>
</nav>

<script src="https://accounts.google.com/gsi/client" async defer></script>
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', { item_id: ${JSON.stringify(id)}, item_name: ${JSON.stringify(community.name)}, content_type: 'community_profile' });
  }

  // ---------- Komentar (login Google + verifikasi server-side di /api/comments) ----------
  (function(){
    var COMMUNITY_ID = ${JSON.stringify(id)};
    var GOOGLE_CLIENT_ID = '214234294300-esr7idh546oipvt66hs8nti9b7oi476s.apps.googleusercontent.com';
    var STORAGE_KEY = 'vk_google_id_token';
    var IS_EN = ${JSON.stringify(lang === "en")};

    function escapeHtml(s){
      return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
      });
    }
    function fmtTime(iso){
      try{ return new Date(iso).toLocaleString(IS_EN ? 'en-US' : 'id-ID', {dateStyle:'medium', timeStyle:'short'}); }catch(e){ return ''; }
    }
    function decodeJwtPayload(token){
      try{
        var payload = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
        return JSON.parse(decodeURIComponent(atob(payload).split('').map(function(c){
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
      }catch(e){ return null; }
    }

    var commentList = document.getElementById('comment-list');
    var loginGate = document.getElementById('login-gate');
    var composer = document.getElementById('composer');
    var myAvatar = document.getElementById('my-avatar');
    var commentInput = document.getElementById('comment-input');
    var composerMsg = document.getElementById('composer-msg');
    var postBtn = document.getElementById('btn-post-comment');

    function renderComments(comments){
      if(!comments || comments.length === 0){
        commentList.innerHTML = '<div class="comment-empty">' + (IS_EN ? 'No comments yet. Be the first!' : 'Belum ada komentar. Jadi yang pertama!') + '</div>';
        return;
      }
      commentList.innerHTML = comments.map(function(c){
        var avatar = c.userAvatarUrl
          ? '<div class="avatar" style="background-image:url(\\'' + escapeHtml(c.userAvatarUrl) + '\\')"></div>'
          : '<div class="avatar">' + escapeHtml((c.userName || '?').charAt(0)) + '</div>';
        var adminBadge = c.isAdminReply
          ? '<span class="admin-badge">' + (IS_EN ? 'Community Admin' : 'Admin Komunitas') + '</span>'
          : '';
        return '<div class="comment-item">' + avatar +
          '<div class="comment-content">' +
            '<div class="comment-head"><span class="comment-name">' + escapeHtml(c.userName) + '</span>' + adminBadge +
            '<span class="comment-time">' + fmtTime(c.createdAt) + '</span></div>' +
            '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
          '</div></div>';
      }).join('');
    }

    function loadComments(){
      fetch('/api/comments?targetType=community&targetId=' + encodeURIComponent(COMMUNITY_ID))
        .then(function(r){ return r.json(); })
        .then(renderComments)
        .catch(function(){ commentList.innerHTML = '<div class="comment-empty">' + (IS_EN ? 'Failed to load comments.' : 'Gagal memuat komentar.') + '</div>'; });
    }
    loadComments();

    function showLoggedIn(payload){
      loginGate.style.display = 'none';
      composer.classList.add('active');
      myAvatar.style.backgroundImage = payload.picture ? 'url(' + payload.picture + ')' : '';
      myAvatar.textContent = payload.picture ? '' : (payload.name || '?').charAt(0);
    }

    function handleCredentialResponse(response){
      localStorage.setItem(STORAGE_KEY, response.credential);
      var payload = decodeJwtPayload(response.credential);
      if(payload) showLoggedIn(payload);
    }

    if(window.google && google.accounts && google.accounts.id){
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
      google.accounts.id.renderButton(document.getElementById('google-signin-btn'), { theme: 'outline', size: 'medium', text: 'signin_with' });
    } else {
      window.addEventListener('load', function(){
        if(window.google && google.accounts && google.accounts.id){
          google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
          google.accounts.id.renderButton(document.getElementById('google-signin-btn'), { theme: 'outline', size: 'medium', text: 'signin_with' });
        }
      });
    }

    var existingToken = localStorage.getItem(STORAGE_KEY);
    if(existingToken){
      var existingPayload = decodeJwtPayload(existingToken);
      if(existingPayload && existingPayload.exp * 1000 > Date.now()){
        showLoggedIn(existingPayload);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    postBtn.addEventListener('click', function(){
      var text = commentInput.value.trim();
      if(!text) return;
      var idToken = localStorage.getItem(STORAGE_KEY);
      if(!idToken){
        composerMsg.textContent = IS_EN ? 'Your login session has expired, please log in again.' : 'Sesi login habis, silakan login lagi.';
        return;
      }
      postBtn.disabled = true;
      composerMsg.textContent = '';
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken: idToken, targetType: 'community', targetId: COMMUNITY_ID, text: text })
      })
        .then(function(r){ return r.json().then(function(data){ return { ok: r.ok, status: r.status, data: data }; }); })
        .then(function(res){
          postBtn.disabled = false;
          if(!res.ok){
            if(res.status === 401){
              localStorage.removeItem(STORAGE_KEY);
              loginGate.style.display = 'flex';
              composer.classList.remove('active');
            }
            composerMsg.textContent = res.data.error || (IS_EN ? 'Failed to submit comment.' : 'Gagal mengirim komentar.');
            return;
          }
          commentInput.value = '';
          loadComments();
        })
        .catch(function(){
          postBtn.disabled = false;
          composerMsg.textContent = IS_EN ? 'Failed to submit comment, please try again.' : 'Gagal mengirim komentar, coba lagi.';
        });
    });
  })();
</script>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=UTF-8" } });
}

export async function onRequestGet(context) {
  return renderCommunityPage(context, "id");
}
