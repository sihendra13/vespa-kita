// Cloudflare Pages Function — GET/POST /api/marketplace-admin
// Admin-only: GET returns every listing (all statuses); POST applies an
// approve/reject/unpublish/delete action. Protected by a shared-secret
// password compared against env.ADMIN_PASSWORD (Pages secret in production;
// .dev.vars for local wrangler preview). Delete also removes the Cloudinary
// assets so approved-then-deleted listings don't leave orphaned media.

import { cloudinaryDestroy, parseCloudinaryUrl } from "../_lib/cloudinary.js";

function checkAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return !!env.ADMIN_PASSWORD && token === env.ADMIN_PASSWORD;
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function rowToListing(row) {
  return {
    id: row.id,
    status: row.status,
    category: row.category,
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
    compatibility: row.compatibility,
    description: row.description,
    photos: JSON.parse(row.photos || "[]").map((p) => p.url),
    video: row.video ? JSON.parse(row.video).url : null,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    publishedAt: row.published_at,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  const { results } = await env.DB.prepare(`SELECT * FROM listings ORDER BY submitted_at DESC`).all();

  return new Response(JSON.stringify((results || []).map(rowToListing)), {
    headers: { "content-type": "application/json" },
  });
}

const VALID_ACTIONS = ["approve", "reject", "unpublish", "delete", "edit-price"];

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { id, action, newPrice } = body || {};
  if (!id || !VALID_ACTIONS.includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  }

  const row = await env.DB.prepare(`SELECT * FROM listings WHERE id = ?`).bind(id).first();
  if (!row) return new Response(JSON.stringify({ error: "Listing not found" }), { status: 404 });

  const now = new Date().toISOString();

  if (action === "delete") {
    const cloudinaryEnv = parseCloudinaryUrl(env.CLOUDINARY_URL);
    if (cloudinaryEnv) {
      const photos = JSON.parse(row.photos || "[]");
      await Promise.all(photos.map((p) => cloudinaryDestroy(p.publicId, "image", cloudinaryEnv).catch(() => {})));
      if (row.video) {
        const v = JSON.parse(row.video);
        await cloudinaryDestroy(v.publicId, "video", cloudinaryEnv).catch(() => {});
      }
    }
    await env.DB.prepare(`DELETE FROM listings WHERE id = ?`).bind(id).run();
  } else if (action === "approve") {
    await env.DB.prepare(`UPDATE listings SET status = 'published', reviewed_at = ?, published_at = ? WHERE id = ?`)
      .bind(now, now, id)
      .run();
  } else if (action === "reject") {
    await env.DB.prepare(`UPDATE listings SET status = 'rejected', reviewed_at = ? WHERE id = ?`).bind(now, id).run();
  } else if (action === "unpublish") {
    await env.DB.prepare(`UPDATE listings SET status = 'unpublished', reviewed_at = ? WHERE id = ?`).bind(now, id).run();
  } else if (action === "edit-price") {
    if (typeof newPrice !== "number") {
      return new Response(JSON.stringify({ error: "Invalid price" }), { status: 400 });
    }
    await env.DB.prepare(`UPDATE listings SET price = ? WHERE id = ?`).bind(newPrice, id).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
