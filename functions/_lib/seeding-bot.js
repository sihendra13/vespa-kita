export const BOT_TOPICS = [
  { author: "Rizky_PX", content: "Suhu, numpang nanya. Kalau buat persiapan touring jarak jauh, mending mesin standaran atau bore-up tipis ya biar aman di tanjakan?" },
  { author: "Kang_VBB", content: "Ada yang pernah nyobain rute Pantai Selatan Jabar pake klasik baru-baru ini? Aman gak tuh aspalnya buat Vespa tua?" },
  { author: "BimaSprint", content: "Tim ban tubeless atau ban dalem nih kalau buat harian? Kemaren bocor di jalan lumayan PR juga dorongnya." },
  { author: "Deni_Excel", content: "Minta saran oli samping yang wanginya asik tapi gak bikin kerak numpuk di ruang bakar dong ngab." },
  { author: "Agus_Super", content: "Menurut kalian, modifikasi apa sih yang paling 'mubazir' atau gak kerasa banget efeknya buat Vespa klasik?" },
  { author: "VespaBoy99", content: "Lagi nyari helm half face yang cocok buat gaya retro tapi tetep SNI/DOT. Ada rekomendasi merk yang harganya masuk akal?" },
  { author: "Tyo_Exclusive", content: "Tanya dong, wajar gak sih kalau mesin cepet panas pas dipake macet-macetan jam pulang kerja? Atau ada settingan karbu yang kurang pas?" },
  { author: "Rangga_Pts", content: "Spill dong aksesoris pertama yang kalian pasang waktu baru angkat Vespa! Buat referensi nih baru angkat PTS." },
  { author: "Yoga_Strada", content: "Mending mana nih suhu: ngecat ulang full body (siramin) atau biarin cat ori tapi belel (patina look)? Lagi galau." },
  { author: "Fajar_Spartan", content: "Saran busi yang awet buat harian dong. Pake merk X kok gampang mati ya kalau sering kena macet." }
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
      VALUES (?, NULL, ?, 'bot-seeder', 'bot@vespakita.com', '', ?, 'visible', ?, 0)
    `).bind(postId, topic.author, topic.content, nowISO).run();

    return true; // Bot just posted
  } catch (err) {
    console.error("Bot Error:", err);
    return false;
  }
}
