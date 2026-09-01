export async function onRequestGet({ env }) {
  if (!env.DB) return new Response("DB not bound", { status: 500 });
  
  try {
    // Update all bot posts that have empty avatars
    await env.DB.prepare(`
      UPDATE tongkrongan_posts 
      SET user_avatar_url = 'https://i.pravatar.cc/150?u=' || author_name 
      WHERE google_sub = 'bot-seeder' AND (user_avatar_url = '' OR user_avatar_url IS NULL)
    `).run();
    
    return new Response("Avatars updated successfully!", { status: 200 });
  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
