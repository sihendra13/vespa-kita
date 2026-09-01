export async function onRequestGet({ env }) {
  if (!env.DB) return new Response("DB not bound", { status: 500 });
  try {
    const postId = crypto.randomUUID();
    const nowISO = new Date().toISOString();
    const author = "Bagas_VBB";
    const content = "Halo dulur Jogja! Kemaren pas acara Jamnas papasan sama rombongan 60s Jogja di jalan, gila keren-keren banget yak klasik rapi semua. Trus iseng nyari-nyari di web, eh nemu web VespaKita ini dan ternyata ada profil komunitasnya juga! Info dong suhu, kalau mau ikutan nongkrong bareng 60s Jogja gimana syaratnya? Pengen nambah seduluran nih 🙏";
    
    // Cek apakah sudah ada biar nggak ke-double kalau ke-refresh
    const exists = await env.DB.prepare(`SELECT id FROM tongkrongan_posts WHERE content LIKE '%60s Jogja%'`).first();
    if (exists) {
        return new Response("Injection Success (Already injected previously)! Post is live.", { status: 200 });
    }

    await env.DB.prepare(`
      INSERT INTO tongkrongan_posts 
      (id, parent_id, author_name, google_sub, user_email, user_avatar_url, content, status, created_at, likes_count)
      VALUES (?, NULL, ?, 'bot-seeder', 'bot@vespakita.com', '', ?, 'visible', ?, 0)
    `).bind(postId, author, content, nowISO).run();
    
    return new Response("Injection Success! Post 60s Jogja is now live.", { status: 200 });
  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
