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
  const post = body?.data?.[0] || {};
  const metrics = post.metrics || {};
  const media = post.media?.[0] || {};

  return new Response(
    JSON.stringify({
      likes: metrics.likes ?? null,
      comments: metrics.comments ?? null,
      shares: metrics.shares ?? null,
      views: metrics.views ?? null,
      thumbnailUrl: media.thumbnail_url ?? null,
      videoUrl: media.url ?? null,
      permalink: post.platform_url ?? null,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Media URLs are Instagram CDN links that expire after a few hours,
        // so this must not be cached long — keep it short, unlike the
        // metrics-only response this replaced.
        "cache-control": "public, max-age=300",
      },
    }
  );
}
