export async function onRequestGet(context) {
  const { env } = context;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
