function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { "content-type": "application/json" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return new Response("DB not bound", { status: 500 });

  const body = await request.json().catch(() => null);
  if (!body || !body.id) return badRequest("Invalid payload");

  // Dedup happens on client (localStorage), server blindly accepts it to keep it fast and auth-less
  await env.DB.prepare(
    `UPDATE tongkrongan_posts SET likes_count = likes_count + 1 WHERE id = ? AND status = 'visible'`
  ).bind(body.id).run();

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
}
