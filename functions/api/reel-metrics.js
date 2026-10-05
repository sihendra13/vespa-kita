// Cloudflare Pages Function — GET /api/reel-metrics?postId=<IG media id>
// Per-reel counters + media URLs from the Instagram Graph API.
// The token never reaches the browser; see functions/_lib/instagram.js.

import { igGet, cachedJson, metricValue } from "../_lib/instagram.js";

const DEFAULT_POST_ID = "17878485828504906"; // reel: SEMUA ANAKNYA DINAMAI NAMA VESPA

export async function onRequestGet({ env, request }) {
  const postId = new URL(request.url).searchParams.get("postId") || DEFAULT_POST_ID;
  if (!/^\d+$/.test(postId)) {
    return new Response(JSON.stringify({ error: "invalid postId" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Media URLs are Instagram CDN links that expire after a few hours, so this
  // must not be cached long.
  return cachedJson(env, `reel:${postId}`, 300, async () => {
    const [media, insights] = await Promise.all([
      igGet(env, postId, { fields: "like_count,comments_count,permalink,media_url,thumbnail_url" }),
      // Insights can be unavailable for some media; counters above still work then.
      igGet(env, `${postId}/insights`, { metric: "views,shares" }).catch(() => ({ data: [] })),
    ]);

    return {
      likes: media.like_count ?? null,
      comments: media.comments_count ?? null,
      shares: metricValue(insights.data, "shares"),
      views: metricValue(insights.data, "views"),
      thumbnailUrl: media.thumbnail_url ?? null,
      videoUrl: media.media_url ?? null,
      permalink: media.permalink ?? null,
    };
  });
}
