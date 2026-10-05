// Cloudflare Pages Function — GET /api/audience
// Follower demographics (gender, age, top countries) as percentages, from the
// Instagram Graph API's follower_demographics metric. Instagram only returns
// these for accounts with 100+ followers and refreshes them roughly daily, so
// this is cached for 12 hours.

import { igGet, cachedJson } from "../_lib/instagram.js";

async function breakdown(env, dim, keep) {
  const body = await igGet(env, "me/insights", {
    metric: "follower_demographics",
    period: "lifetime",
    metric_type: "total_value",
    breakdown: dim,
  });
  const results = (body?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [])
    .filter((r) => !keep || keep.includes(r.dimension_values?.[0]));
  const total = results.reduce((s, r) => s + (r.value || 0), 0);
  if (!total) return [];
  return results
    .map((r) => ({ key: r.dimension_values?.[0], pct: Math.round((r.value / total) * 1000) / 10 }))
    .filter((r) => r.key)
    .sort((a, b) => b.pct - a.pct);
}

export async function onRequestGet({ env }) {
  return cachedJson(env, "audience", 43200, async () => {
    const [gender, age, country] = await Promise.all([
      // "U" (unknown) is dropped so male + female add up to 100%.
      breakdown(env, "gender", ["M", "F"]),
      breakdown(env, "age"),
      breakdown(env, "country"),
    ]);
    if (!gender.length && !age.length && !country.length) {
      throw new Error("no demographics returned");
    }
    return {
      gender,
      age,
      country: country.slice(0, 5),
    };
  });
}
