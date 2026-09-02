export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`SELECT author_name, google_sub FROM tongkrongan_posts ORDER BY created_at DESC LIMIT 10`).all();
  return new Response(JSON.stringify(results), { headers: { "content-type": "application/json" } });
}
