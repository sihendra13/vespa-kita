export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`
    SELECT * FROM tongkrongan_posts 
    WHERE content LIKE '%Desember Rabu%' OR author_name = 'Desember Rabu'
    ORDER BY created_at DESC LIMIT 10
  `).all();
  return new Response(JSON.stringify(results, null, 2), { headers: { "content-type": "application/json" } });
}
