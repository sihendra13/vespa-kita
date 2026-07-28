// Cloudflare Pages Function — GET /api/reel-metrics
// Reads POSTFORME_API_KEY from Pages project environment variables (Settings -> Environment variables).
// Never expose that key to the browser; this function is the only place it's used.

const SOCIAL_ACCOUNT_ID = "spc_adDd2jBSSm5jGwhBO4jYM"; // ves_pakita (Instagram)
const PLATFORM_POST_ID = "17878485828504906"; // reel: SEMUA ANAKNYA DINAMAI NAMA VESPA

export async function onRequestGet(context) {
  const { env, request } = context;
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId") || PLATFORM_POST_ID;

  if (!env.POSTFORME_API_KEY) {
    return new Response(JSON.stringify({ error: "POSTFORME_API_KEY not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const url = `https://api.postforme.dev/v1/social-account-feeds/${SOCIAL_ACCOUNT_ID}?expand=metrics&platform_post_id=${postId}`;

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${env.POSTFORME_API_KEY}` },
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "upstream request failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await upstream.json();
  const metrics = body?.data?.[0]?.metrics || {};

  return new Response(
    JSON.stringify({
      likes: metrics.likes ?? null,
      comments: metrics.comments ?? null,
      shares: metrics.shares ?? null,
      views: metrics.views ?? null,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=3600",
      },
    }
  );
}
