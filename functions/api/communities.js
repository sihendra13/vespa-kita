// Cloudflare Pages Function — GET /api/communities
// Public, read-only: returns every published community with its published
// events nested inside. Mirrors marketplace-listings.js's shape/caching approach.

function rowToCommunity(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    description: row.description,
    memberEstimate: row.member_estimate,
    ig: row.ig,
    wa: row.wa,
    logoUrl: row.logo_url,
    coverPhotoUrl: row.cover_photo_url,
    events: [],
  };
}

function rowToEvent(row) {
  return {
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    eventDateText: row.event_date_text,
    participantEstimate: row.participant_estimate,
    supportType: row.support_type,
    description: row.description,
    sponsorLogos: JSON.parse(row.sponsor_logos || "[]").map((s) => s.url),
  };
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  const [{ results: communityRows }, { results: eventRows }] = await Promise.all([
    env.DB.prepare(`SELECT * FROM communities WHERE status = 'published' ORDER BY published_at DESC`).all(),
    env.DB.prepare(`SELECT * FROM community_events WHERE status = 'published' ORDER BY published_at DESC`).all(),
  ]);

  const communities = (communityRows || []).map(rowToCommunity);
  const byId = new Map(communities.map((c) => [c.id, c]));

  for (const eventRow of eventRows || []) {
    const community = byId.get(eventRow.community_id);
    if (community) community.events.push(rowToEvent(eventRow));
  }

  return new Response(JSON.stringify(communities), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=120" },
  });
}
