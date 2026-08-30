// Cloudflare Pages Function — GET/POST /api/community-admin
// Admin-only, same shared-secret pattern as marketplace-admin.js. GET returns
// every community (all statuses) with its events nested. POST applies an
// approve/reject/unpublish/delete action against a community_id — since a
// submission always creates one community + one event together, approving a
// community cascades the same status to any of its still-pending events, so
// the admin only needs one click per submission. Delete also removes the
// Cloudinary assets (logo/cover) so approved-then-deleted entries don't leave
// orphaned media.

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

function rowToCommunity(row) {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    city: row.city,
    description: row.description,
    memberEstimate: row.member_estimate,
    ig: row.ig,
    wa: row.wa,
    adminEmail: row.admin_email,
    logoUrl: row.logo_url,
    coverPhotoUrl: row.cover_photo_url,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    publishedAt: row.published_at,
    events: [],
  };
}

function rowToEvent(row) {
  return {
    id: row.id,
    communityId: row.community_id,
    status: row.status,
    title: row.title,
    eventDateText: row.event_date_text,
    participantEstimate: row.participant_estimate,
    supportType: row.support_type,
    description: row.description,
    sponsorLogos: JSON.parse(row.sponsor_logos || "[]").map((s) => s.url),
    detailUrl: row.detail_url || "",
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    publishedAt: row.published_at,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  const [{ results: communityRows }, { results: eventRows }] = await Promise.all([
    env.DB.prepare(`SELECT * FROM communities ORDER BY submitted_at DESC`).all(),
    env.DB.prepare(`SELECT * FROM community_events ORDER BY submitted_at DESC`).all(),
  ]);

  const communities = (communityRows || []).map(rowToCommunity);
  const byId = new Map(communities.map((c) => [c.id, c]));
  for (const eventRow of eventRows || []) {
    const community = byId.get(eventRow.community_id);
    if (community) community.events.push(rowToEvent(eventRow));
  }

  return new Response(JSON.stringify(communities), {
    headers: { "content-type": "application/json" },
  });
}

const VALID_ACTIONS = ["approve", "reject", "unpublish", "delete"];

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

  const { id, action } = body || {};
  if (!id || !VALID_ACTIONS.includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  }

  const community = await env.DB.prepare(`SELECT * FROM communities WHERE id = ?`).bind(id).first();
  if (!community) return new Response(JSON.stringify({ error: "Community not found" }), { status: 404 });

  const now = new Date().toISOString();

  if (action === "delete") {
    const cloudinaryEnv = parseCloudinaryUrl(env.CLOUDINARY_URL);
    if (cloudinaryEnv) {
      if (community.logo_public_id) await cloudinaryDestroy(community.logo_public_id, "image", cloudinaryEnv).catch(() => {});
      if (community.cover_photo_public_id && community.cover_photo_public_id !== community.logo_public_id) {
        await cloudinaryDestroy(community.cover_photo_public_id, "image", cloudinaryEnv).catch(() => {});
      }
    }
    await env.DB.prepare(`DELETE FROM community_events WHERE community_id = ?`).bind(id).run();
    await env.DB.prepare(`DELETE FROM communities WHERE id = ?`).bind(id).run();
  } else if (action === "approve") {
    await env.DB.prepare(`UPDATE communities SET status = 'published', reviewed_at = ?, published_at = ? WHERE id = ?`)
      .bind(now, now, id)
      .run();
    await env.DB.prepare(`UPDATE community_events SET status = 'published', reviewed_at = ?, published_at = ? WHERE community_id = ? AND status = 'pending'`)
      .bind(now, now, id)
      .run();
  } else if (action === "reject") {
    await env.DB.prepare(`UPDATE communities SET status = 'rejected', reviewed_at = ? WHERE id = ?`).bind(now, id).run();
    await env.DB.prepare(`UPDATE community_events SET status = 'rejected', reviewed_at = ? WHERE community_id = ? AND status = 'pending'`).bind(now, id).run();
  } else if (action === "unpublish") {
    await env.DB.prepare(`UPDATE communities SET status = 'unpublished', reviewed_at = ? WHERE id = ?`).bind(now, id).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
