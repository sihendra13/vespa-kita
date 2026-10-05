// Cloudflare Pages Function — GET /api/account-stats
// Last-30-day account insights for the hero "Panel Reach" panel, straight from the
// Instagram Graph API (see functions/_lib/instagram.js for token + cache handling).
//
// views_30d / reach_30d: Instagram's own account-level totals (reach is unique
// accounts, not a per-post sum like the old Post For Me approximation).
// engagement_rate_30d: total_interactions / views * 100 over the same window.
// followers / followers_gained_30d: current count and new follows over the window
// (follower_count is a daily time series; Instagram omits it under 100 followers).

import { igGet, cachedJson, metricValue } from "../_lib/instagram.js";

const DAY_S = 24 * 60 * 60;

export async function onRequestGet({ env }) {
  return cachedJson(env, "account-stats", 1800, async () => {
    const until = Math.floor(Date.now() / 1000);
    const since = until - 30 * DAY_S;

    const [profile, totals, follows] = await Promise.all([
      igGet(env, "me", { fields: "followers_count,media_count,username" }),
      igGet(env, "me/insights", {
        metric: "views,reach,total_interactions",
        period: "day",
        metric_type: "total_value",
        since,
        until,
      }),
      // Max window for follower_count is 30 days and it excludes the current day.
      igGet(env, "me/insights", { metric: "follower_count", period: "day", since: since + DAY_S, until })
        .catch(() => ({ data: [] })),
    ]);

    const views = metricValue(totals.data, "views");
    const reach = metricValue(totals.data, "reach");
    const interactions = metricValue(totals.data, "total_interactions");
    const gained = metricValue(follows.data, "follower_count");

    return {
      views_30d: views,
      reach_30d: reach,
      engagement_rate_30d: views > 0 && interactions !== null
        ? Math.round((interactions / views) * 1000) / 10
        : null,
      followers: profile.followers_count ?? null,
      followers_gained_30d: gained,
    };
  });
}
