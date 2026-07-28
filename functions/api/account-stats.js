// Cloudflare Pages Function — GET /api/account-stats
// Aggregates the last 30 days of the connected Instagram account's feed
// (via Post For Me) to power the hero "Panel Reach" numbers.
//
// views_30d: exact sum of per-post views (views are inherently additive, no double-count risk).
// reach_30d: sum of per-post reach — an approximation of "accounts reached," since a person
// who saw multiple posts is counted once per post here, not once at the account level.
// Instagram's own account-level unique reach isn't available through Post For Me's API.

const SOCIAL_ACCOUNT_ID = "spc_adDd2jBSSm5jGwhBO4jYM"; // ves_pakita (Instagram)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const PAGE_LIMIT = 50;
const MAX_PAGES = 10; // safety cap

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.POSTFORME_API_KEY) {
    return new Response(JSON.stringify({ error: "POSTFORME_API_KEY not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const cutoff = Date.now() - THIRTY_DAYS_MS;
  let viewsTotal = 0;
  let reachTotal = 0;
  let postCount = 0;
  let cursor = "";
  let reachedCutoff = false;

  try {
    for (let page = 0; page < MAX_PAGES && !reachedCutoff; page++) {
      const url = new URL(`https://api.postforme.dev/v1/social-account-feeds/${SOCIAL_ACCOUNT_ID}`);
      url.searchParams.set("expand", "metrics");
      url.searchParams.set("limit", String(PAGE_LIMIT));
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${env.POSTFORME_API_KEY}` },
      });
      if (!res.ok) break;

      const body = await res.json();
      const items = body?.data || [];

      for (const item of items) {
        const postedAt = new Date(item.posted_at).getTime();
        if (isNaN(postedAt) || postedAt < cutoff) {
          reachedCutoff = true;
          break;
        }
        const m = item.metrics || {};
        viewsTotal += typeof m.views === "number" ? m.views : 0;
        reachTotal += typeof m.reach === "number" ? m.reach : 0;
        postCount++;
      }

      if (!body?.meta?.has_more || !body?.meta?.next) break;
      cursor = body.meta.next;
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "failed to aggregate stats" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      views_30d: viewsTotal,
      reach_30d: reachTotal,
      post_count_30d: postCount,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=1800",
      },
    }
  );
}
