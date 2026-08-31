// Cloudflare Pages Function — POST /api/marketplace-push-subscribe
// Public endpoint: called right after a seller submits a listing, if they opted
// in to push notifications. Stores their browser's PushSubscription so we can
// notify them the moment an admin approves the listing (see marketplace-admin.js).

function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { listingId, subscription } = body || {};
  if (!listingId || typeof listingId !== "string") return badRequest("listingId is required");
  if (!subscription || typeof subscription.endpoint !== "string" || !subscription.keys) {
    return badRequest("Invalid push subscription");
  }
  const { p256dh, auth } = subscription.keys;
  if (typeof p256dh !== "string" || typeof auth !== "string") return badRequest("Invalid push subscription keys");

  const listing = await env.DB.prepare(`SELECT id FROM listings WHERE id = ?`).bind(listingId).first();
  if (!listing) return badRequest("Listing not found");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // A seller re-subscribing (e.g. re-submitting the form, or a stale subscription
  // getting refreshed) should replace the old row, not accumulate duplicates.
  await env.DB.prepare(
    `INSERT INTO push_subscriptions (id, listing_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(listing_id) DO UPDATE SET endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth, created_at = excluded.created_at`
  )
    .bind(id, listingId, subscription.endpoint, p256dh, auth, now)
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
