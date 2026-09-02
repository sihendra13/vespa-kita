import { checkAndRunBot, checkAndReplyBot } from "../_lib/seeding-bot.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return new Response("DB not bound", { status: 500 });

  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  
  if (!since) return new Response(JSON.stringify({ hasUpdates: false }), { headers: { "content-type": "application/json" } });

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM tongkrongan_posts WHERE status = 'visible' AND created_at > ?`
  ).bind(since).first();

  let hasUpdates = (countRow?.count || 0) > 0;
  
  // --- BOT SEEDING HOOK ---
  const botPosted = await checkAndRunBot(env);
  if (botPosted) hasUpdates = true;
  
  // --- BOT AI REPLY HOOK ---
  const botReplied = await checkAndReplyBot(env);
  if (botReplied) hasUpdates = true;
  
  return new Response(JSON.stringify({ hasUpdates }), { headers: { "content-type": "application/json" } });
}
