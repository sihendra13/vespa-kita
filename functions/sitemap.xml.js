// Cloudflare Pages Function — GET /sitemap.xml
// Replaces a hand-maintained static sitemap.xml (which only ever listed 5
// URLs and never included a single marketplace listing, community profile,
// or the Tongkrongan/Komunitas pages) with one generated fresh on every
// request: hand-authored pages plus every published listing and community
// pulled live from D1, in both languages. Keeps itself correct as listings
// and communities get approved/removed — no separate build step to forget.

const SITE_URL = "https://www.vespakita.com";

function urlBlock({ loc, idLoc, enLoc, changefreq, priority, lastmod }) {
  const alternates =
    idLoc && enLoc
      ? `
    <xhtml:link rel="alternate" hreflang="id" href="${idLoc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${idLoc}" />`
      : "";
  const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${loc}</loc>${alternates}${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function bilingualPair(idPath, enPath, { changefreq, idPriority, enPriority }) {
  const idLoc = `${SITE_URL}${idPath}`;
  const enLoc = `${SITE_URL}${enPath}`;
  return [
    urlBlock({ loc: idLoc, idLoc, enLoc, changefreq, priority: idPriority }),
    urlBlock({ loc: enLoc, idLoc, enLoc, changefreq, priority: enPriority }),
  ];
}

export async function onRequestGet(context) {
  const { env } = context;
  const urls = [];

  // Hand-authored pages
  urls.push(...bilingualPair("/", "/en/", { changefreq: "weekly", idPriority: "1.0", enPriority: "0.8" }));
  urls.push(
    urlBlock({ loc: `${SITE_URL}/60s-yogyakarta/`, changefreq: "monthly", priority: "0.6" }),
    urlBlock({ loc: `${SITE_URL}/vw-yogyakarta/`, changefreq: "monthly", priority: "0.6" })
  );
  urls.push(...bilingualPair("/marketplace/", "/en/marketplace/", { changefreq: "daily", idPriority: "0.9", enPriority: "0.7" }));
  urls.push(...bilingualPair("/komunitas/", "/en/komunitas/", { changefreq: "weekly", idPriority: "0.8", enPriority: "0.6" }));
  urls.push(...bilingualPair("/komunitas/tongkrongan/", "/en/komunitas/tongkrongan/", { changefreq: "hourly", idPriority: "0.8", enPriority: "0.6" }));
  urls.push(...bilingualPair("/komunitas/daftar/", "/en/komunitas/daftar/", { changefreq: "monthly", idPriority: "0.4", enPriority: "0.3" }));

  // Dynamic: every published marketplace listing + community, live from D1.
  if (env.DB) {
    try {
      const { results: listings } = await env.DB
        .prepare(`SELECT id, published_at, submitted_at FROM listings WHERE status = 'published'`)
        .all();
      for (const l of listings || []) {
        const lastmod = (l.published_at || l.submitted_at || "").slice(0, 10) || undefined;
        const idLoc = `${SITE_URL}/marketplace/l/${l.id}`;
        const enLoc = `${SITE_URL}/en/marketplace/l/${l.id}`;
        urls.push(
          urlBlock({ loc: idLoc, idLoc, enLoc, changefreq: "weekly", priority: "0.7", lastmod }),
          urlBlock({ loc: enLoc, idLoc, enLoc, changefreq: "weekly", priority: "0.5", lastmod })
        );
      }

      const { results: communities } = await env.DB
        .prepare(`SELECT id, published_at, submitted_at FROM communities WHERE status = 'published'`)
        .all();
      for (const c of communities || []) {
        const lastmod = (c.published_at || c.submitted_at || "").slice(0, 10) || undefined;
        const idLoc = `${SITE_URL}/komunitas/c/${c.id}`;
        const enLoc = `${SITE_URL}/en/komunitas/c/${c.id}`;
        urls.push(
          urlBlock({ loc: idLoc, idLoc, enLoc, changefreq: "weekly", priority: "0.6", lastmod }),
          urlBlock({ loc: enLoc, idLoc, enLoc, changefreq: "weekly", priority: "0.4", lastmod })
        );
      }
    } catch (err) {
      // D1 hiccup — still serve the hand-authored portion rather than a 500.
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=UTF-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
