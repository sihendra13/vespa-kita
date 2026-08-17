// Cloudflare Pages Function — POST /api/marketplace-track
// Public endpoint: increments a published listing's view or click counter.
// Called client-side (not server-rendered) so bot/crawler hits — WhatsApp,
// Facebook, Google fetching the page for a link preview or index — don't
// inflate the numbers, since those don't execute JS.

const VALID_TYPES = ["view", "click"];

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { id, type } = body || {};
  if (!id || !VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const column = type === "view" ? "views" : "clicks";
  await env.DB.prepare(
    `UPDATE listings SET ${column} = ${column} + 1 WHERE id = ? AND status = 'published'`
  ).bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
