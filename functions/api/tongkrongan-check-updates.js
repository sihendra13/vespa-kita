export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return new Response("DB not bound", { status: 500 });

  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  
  if (!since) return new Response(JSON.stringify({ hasUpdates: false }), { headers: { "content-type": "application/json" } });

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM tongkrongan_posts WHERE status = 'visible' AND created_at > ?`
  ).bind(since).first();

  const hasUpdates = (countRow?.count || 0) > 0;
  
  return new Response(JSON.stringify({ hasUpdates }), { headers: { "content-type": "application/json" } });
}
