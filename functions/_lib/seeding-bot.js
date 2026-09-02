export const BOT_TOPICS = [
  { author: "Irawan", content: "Suhu-suhu Jakarta Raya, kalau weekend pagi enaknya sunmori ke mana ya yang aspalnya mulus dan parkirannya aman buat Vespa tua?" },
  { author: "Rahmadi", content: "Warga Depok merapat! Kasih info dong tempat ngopi di daerah Margonda atau GDC yang enak buat kopdar Vespa klasik." },
  { author: "Wahyu Nugroho", content: "Dulur Jogja, ada yang sering riding ke arah Kaliurang? Share dong spot foto yang keren dan sepi buat Vespa." },
  { author: "Fajar", content: "Jalur Depok - Bogor kalau sore macet parah gak sih? Mau bawa Excel harian tapi takut overheat nyiksa kopling." },
  { author: "Tyo", content: "Nyuwun info bengkel spesialis mesin Vespa di area Jogja kota atau Bantul yang pengerjaannya cepet dan jujur dong suhu." },
  { author: "Rangga Aditya", content: "Ada rekomendasi bengkel cat body Vespa di area Jakarta Selatan/Timur yang hasilnya rapi tapi harga bersahabat?" },
  { author: "Agus Santoso", content: "Menurut kalian, aksesoris apa sih yang wajib banget dipasang pertama kali waktu baru angkat Vespa klasik?" },
  { author: "Yoga", content: "Tim ban tubeless atau ban dalem nih kalau buat harian di Jakarta yang banyak lubang? Kemaren bocor PR banget dorongnya." },
  { author: "Dimas", content: "Suhu, minta saran dong. Kalau buat persiapan touring lintas pantura, mending mesin standaran atau bore-up tipis ya?" },
  { author: "Hendro", content: "Share tempat beli sparepart ori yang lengkap di Jakarta dong, lagi nyari printilan body buat restorasi nih." }
];

export async function checkAndRunBot(env) {
  try {
    // Determine current time in WIB (Asia/Jakarta)
    const formatterDate = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    const formatterTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', minute: 'numeric', hour12: false });
    
    // Format gives "MM/DD/YYYY"
    const dateParts = formatterDate.format(new Date()).split('/');
    const todayStr = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`; // YYYY-MM-DD
    
    const timeParts = formatterTime.format(new Date()).split(':');
    const hour = parseInt(timeParts[0], 10);

    // Define time slots
    let currentSlot = null;
    if (hour >= 10 && hour < 14) currentSlot = 'pagi';
    else if (hour >= 16 && hour < 19) currentSlot = 'sore';
    else if (hour >= 20 && hour < 23) currentSlot = 'malam';

    if (!currentSlot) return false; // Not in a bot time slot

    // Check if we already posted in this slot today
    // We use a special google_sub format to identify bot posts: 'bot-seeder'
    const lastBotPost = await env.DB.prepare(`
      SELECT created_at FROM tongkrongan_posts 
      WHERE google_sub = 'bot-seeder' 
      ORDER BY created_at DESC LIMIT 1
    `).first();

    if (lastBotPost) {
      const lastPostWIB = new Date(new Date(lastBotPost.created_at).getTime() + (7 * 60 * 60 * 1000));
      const lpDate = lastPostWIB.toISOString().split('T')[0];
      const lpHour = lastPostWIB.getUTCHours(); // This is the WIB hour because we shifted it
      
      // Calculate what slot the last post was in
      let lpSlot = null;
      if (lpHour >= 10 && lpHour < 14) lpSlot = 'pagi';
      else if (lpHour >= 16 && lpHour < 19) lpSlot = 'sore';
      else if (lpHour >= 20 && lpHour < 23) lpSlot = 'malam';

      // If we already posted today in the current slot, do nothing
      if (lpDate === todayStr && lpSlot === currentSlot) {
        return false;
      }
    }

    // WE NEED TO POST!
    // Pick a random topic
    const topic = BOT_TOPICS[Math.floor(Math.random() * BOT_TOPICS.length)];
    
    // Generate UUID (polyfill for Cloudflare Workers if crypto.randomUUID is available, else fallback)
    const postId = crypto.randomUUID();
    const nowISO = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO tongkrongan_posts 
      (id, parent_id, author_name, google_sub, user_email, user_avatar_url, content, status, created_at, likes_count)
      VALUES (?, NULL, ?, 'bot-seeder', 'bot@vespakita.com', ?, ?, 'visible', ?, 0)
    `).bind(postId, topic.author, '', topic.content, nowISO).run();

    return true; // Bot just posted
  } catch (err) {
    console.error("Bot Error:", err);
    return false;
  }
}

// Fitur AI Auto-Reply menggunakan Gemini
export async function checkAndReplyBot(env) {
  try {
    if (!env.GEMINI_API_KEY) return { error: "No GEMINI_API_KEY found" }; // Pastikan API Key ada
    
    // Cari 1 komentar user (minimal 2 menit lalu) yang belum dibalas bot
    const query = `
      SELECT 
        user_reply.id as reply_id, 
        user_reply.content as user_content, 
        user_reply.author_name as user_name,
        user_reply.parent_id as thread_id,
        bot_thread.author_name as bot_name,
        bot_thread.content as bot_content
      FROM tongkrongan_posts AS user_reply
      JOIN tongkrongan_posts AS bot_thread ON user_reply.parent_id = bot_thread.id
      WHERE bot_thread.google_sub = 'bot-seeder'
        AND user_reply.google_sub != 'bot-seeder'
        AND user_reply.created_at <= ?
        AND NOT EXISTS (
          SELECT 1 FROM tongkrongan_posts AS bot_response
          WHERE bot_response.parent_id = bot_thread.id
            AND bot_response.google_sub = 'bot-seeder'
            AND bot_response.content LIKE '%@' || user_reply.author_name || '%'
        )
      ORDER BY user_reply.created_at ASC
      LIMIT 1
    `;
    
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const candidate = await env.DB.prepare(query).bind(twoMinsAgo).first();
    if (!candidate) return { error: "No candidates found matching query" };

    // Meracik perintah ke Gemini
    const prompt = `Kamu adalah cowok anak Vespa bernama ${candidate.bot_name}.
Kamu membuat postingan ini di forum: "${candidate.bot_content}"
Lalu ada user asli bernama ${candidate.user_name} yang berkomentar: "${candidate.user_content}"
Balas komentar user tersebut.
Syarat:
- Bahasa santai, gaul, akrab seperti sesama anak motor/Vespa di tongkrongan Indonesia (mas, bro, ngab, suhu, dll).
- Wajib diawali dengan memanggil namanya: "@${candidate.user_name} "
- Maksimal 2 kalimat. Jangan kaku.
Tuliskan langsung balasanmu tanpa tanda kutip.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text(); console.error("Gemini Error:", errText); return { error: "Gemini API Error", details: errText };
    }
    
    const aiData = await aiResponse.json();
    if (!aiData.candidates || aiData.candidates.length === 0) return { error: "No candidates in Gemini response", data: aiData };
    
    let replyContent = aiData.candidates[0].content.parts[0].text.trim();
    // Bersihkan kutipan kalau AI nambahin
    if (replyContent.startsWith('"') && replyContent.endsWith('"')) {
        replyContent = replyContent.slice(1, -1);
    }
    
    // Simpan balasan bot ke database
    const replyId = crypto.randomUUID();
    const nowISO = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO tongkrongan_posts 
      (id, parent_id, author_name, google_sub, user_email, user_avatar_url, content, status, created_at, likes_count)
      VALUES (?, ?, ?, 'bot-seeder', 'bot@vespakita.com', '', ?, 'visible', ?, 0)
    `).bind(replyId, candidate.thread_id, candidate.bot_name, replyContent, nowISO).run();
    
    return { success: true, replyContent };
  } catch (err) {
    console.error("AI Reply Bot Error:", err);
    return false;
  }
}
