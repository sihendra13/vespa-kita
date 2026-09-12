// Cloudflare Pages Function — GET /
// The homepage's "HIGHLIGHT EVENT" widget (#next-events-grid) was an empty
// shell populated only via client fetch('/api/communities') — flagged by the
// Technical/SXO/GEO SEO audit passes alongside /komunitas/ and
// /marketplace/semua/. Rather than duplicate this ~2300-line static page
// into a JS template (the approach used for those two, much smaller pages),
// this fetches the real static asset via env.ASSETS and does a single
// targeted string replace of the loading placeholder with server-rendered
// event cards — every other part of the page (nav, scripts, sections) stays
// byte-for-byte whatever's in the static build. Card markup mirrors the
// client-side script that follows it in index.html exactly, so the client
// re-render on load is visually a no-op.

import { escapeHtml } from "./_lib/html.js";

const GRID_OPEN =
  '    <div id="next-events-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; margin-top: 20px;">\n' +
  '      <p style="color: var(--chrome); font-size: 14px;">Memuat event...</p>\n' +
  "    </div>";

function eventCardHtml(c, e) {
  const hasSponsor = (e.sponsorLogos || []).length > 0;
  const badge = hasSponsor
    ? '<div style="padding: 4px 10px; font-family: var(--mono); font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #f4c871; background: rgba(244, 200, 113, 0.15); border: 1px solid rgba(244, 200, 113, 0.4); border-radius: 20px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: default; white-space: nowrap;">' +
      '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>SPONSOR DIDAPAT</div>'
    : "";
  const logo = c.logoUrl
    ? `<img loading="lazy" src="${escapeHtml(c.logoUrl)}" style="height: 24px; width: auto; object-fit: contain; display: block;" alt="${escapeHtml(c.name)} Logo">`
    : "";
  return (
    '<div class="next-event-card">' +
      '<div style="padding: 32px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">' +
        "<div>" +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 8px;">' +
            '<div style="display: flex; align-items: center; gap: 8px;">' + logo +
              '<span style="font-family: var(--mono); font-size: 11px; color: var(--mint); text-transform: uppercase; letter-spacing: 0.1em; background: rgba(111,168,154,0.1); padding: 4px 10px; border-radius: 4px;">' + escapeHtml(c.name) + "</span>" +
            "</div>" +
            '<span style="font-family: var(--mono); font-size: 11px; color: var(--krem); opacity: 0.7;">' + escapeHtml(e.eventDateText || "-") + "</span>" +
          "</div>" +
          '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">' +
            '<h3 style="font-family: var(--display); font-size: 2rem; line-height: 1.1; color: var(--krem); margin-bottom: 0;">' + escapeHtml(e.title) + "</h3>" + badge +
          "</div>" +
          '<p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 24px;">' + escapeHtml(e.description || "") + "</p>" +
        "</div>" +
        '<div style="display: flex; gap: 12px; margin-top: auto;">' +
          '<a href="/komunitas/c/' + encodeURIComponent(c.id) + '" class="btn" style="flex: 1; background: var(--merah); color: #ffffff; padding: 12px 16px; border-radius: 6px; font-family: var(--mono); font-size: 12px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s;" onmouseover="this.style.background=\'var(--merah-dark)\';" onmouseout="this.style.background=\'var(--merah)\';">Lihat Detail</a>' +
          '<a href="#kolaborasi" class="btn" style="flex: 1; border: 1px solid rgba(255,255,255,0.15); color: var(--krem); padding: 12px 16px; border-radius: 6px; font-family: var(--mono); font-size: 12px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\'; this.style.borderColor=\'rgba(255,255,255,0.3)\';" onmouseout="this.style.background=\'transparent\'; this.style.borderColor=\'rgba(255,255,255,0.15)\';">Mari Kolaborasi</a>' +
        "</div>" +
      "</div>" +
    "</div>"
  );
}

export async function onRequestGet(context) {
  const { env, next } = context;
  const assetResponse = await next();
  if (!env.DB) return assetResponse;

  const contentType = assetResponse.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return assetResponse;

  let html = await assetResponse.text();
  if (!html.includes(GRID_OPEN)) return new Response(html, assetResponse);

  let gridHtml;
  try {
    const [{ results: communityRows }, { results: eventRows }] = await Promise.all([
      env.DB.prepare(`SELECT id, name, logo_url FROM communities WHERE status = 'published' ORDER BY published_at DESC`).all(),
      env.DB.prepare(`SELECT * FROM community_events WHERE status = 'published' ORDER BY published_at DESC`).all(),
    ]);

    const communities = (communityRows || []).map((row) => ({
      id: row.id,
      name: row.name,
      logoUrl: row.logo_url,
      events: [],
    }));
    const byId = new Map(communities.map((c) => [c.id, c]));
    for (const row of eventRows || []) {
      const community = byId.get(row.community_id);
      if (!community) continue;
      community.events.push({
        title: row.title,
        eventDateText: row.event_date_text,
        description: row.description,
        sponsorLogos: JSON.parse(row.sponsor_logos || "[]").map((s) => s.url),
      });
    }

    const cards = [];
    for (const c of communities) {
      for (const e of c.events) cards.push(eventCardHtml(c, e));
    }

    gridHtml = cards.length
      ? cards.join("")
      : '<p style="color: var(--chrome); font-size: 14px;">Belum ada event komunitas yang tayang.</p>';
  } catch (e) {
    return new Response(html, assetResponse);
  }

  const replacement =
    '    <div id="next-events-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; margin-top: 20px;">\n' +
    gridHtml +
    "\n    </div>";

  html = html.replace(GRID_OPEN, replacement);

  const headers = new Headers(assetResponse.headers);
  headers.delete("content-length");
  return new Response(html, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
}
