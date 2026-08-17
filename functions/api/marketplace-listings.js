// Cloudflare Pages Function — GET /api/marketplace-listings
// Public endpoint: returns only published marketplace listings, newest first.
// Photos/video are stored as Cloudinary {url, publicId} JSON — only the URL is
// exposed here.

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  const { results } = await env.DB.prepare(
    `SELECT id, title, price, year, condition, location, seller_name, seller_phone, seller_ig, doc_surat, doc_pajak, doc_kepemilikan, minus_desc, description, photos, video, views, clicks
     FROM listings WHERE status = 'published' ORDER BY published_at DESC`
  ).all();

  const listings = (results || []).map((row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    year: row.year,
    condition: row.condition,
    location: row.location,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    sellerIg: row.seller_ig,
    docSurat: row.doc_surat,
    docPajak: row.doc_pajak,
    docKepemilikan: row.doc_kepemilikan,
    minusDesc: row.minus_desc,
    description: row.description,
    photos: JSON.parse(row.photos || "[]").map((p) => p.url),
    video: row.video ? JSON.parse(row.video).url : null,
    views: row.views,
    clicks: row.clicks,
  }));

  return new Response(JSON.stringify(listings), {
    headers: { "content-type": "application/json" },
  });
}
