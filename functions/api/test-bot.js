import { checkAndReplyBot } from "../_lib/seeding-bot.js";

export async function onRequestGet(context) {
  try {
    const result = await checkAndReplyBot(context.env);
    return new Response(JSON.stringify({ success: result }), { headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
