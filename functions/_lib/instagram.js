// Instagram Graph API (Instagram API with Instagram Login) — replaces Post For Me.
//
// Token lifecycle: a long-lived token lasts 60 days and can be refreshed once it's
// at least 24h old. The first token is seeded from the IG_ACCESS_TOKEN env secret;
// after that the current token lives in D1 (ig_token) and is refreshed lazily on
// any request once it's older than REFRESH_AFTER_MS, so no cron is needed as long
// as the site gets at least one visit every ~50 days. If the stored token ever
// dies, put a fresh one in IG_ACCESS_TOKEN — a token there that differs from the
// one it was last seeded from replaces the stored one.
//
// Last-good responses are kept in D1 (ig_cache) so an upstream failure serves the
// previous numbers instead of zeros.

const GRAPH = "https://graph.instagram.com/v23.0";
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS ig_token (id INTEGER PRIMARY KEY CHECK (id = 1), token TEXT NOT NULL, seed TEXT, refreshed_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS ig_cache (key TEXT PRIMARY KEY, body TEXT NOT NULL, updated_at INTEGER NOT NULL)"),
  ]);
  schemaReady = true;
}

async function getToken(env) {
  const db = env.DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT token, seed, refreshed_at FROM ig_token WHERE id = 1").first();
  const seed = env.IG_ACCESS_TOKEN || null;

  if (!row || (seed && row.seed !== seed)) {
    if (!seed) throw new Error("IG_ACCESS_TOKEN not configured");
    await db.prepare("INSERT OR REPLACE INTO ig_token (id, token, seed, refreshed_at) VALUES (1, ?, ?, ?)")
      .bind(seed, seed, Date.now()).run();
    return seed;
  }

  if (Date.now() - row.refreshed_at > REFRESH_AFTER_MS) {
    try {
      const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(row.token)}`);
      const body = await res.json();
      if (res.ok && body.access_token) {
        await db.prepare("UPDATE ig_token SET token = ?, refreshed_at = ? WHERE id = 1")
          .bind(body.access_token, Date.now()).run();
        return body.access_token;
      }
      console.error("IG token refresh failed:", JSON.stringify(body));
    } catch (err) {
      console.error("IG token refresh error:", err);
    }
  }
  return row.token;
}

// GET a Graph API path. Throws on HTTP/API errors so callers can fall back to cache.
export async function igGet(env, path, params = {}) {
  const token = await getToken(env);
  const url = new URL(`${GRAPH}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(`IG ${path}: ${body?.error?.message || res.status}`);
  }
  return body;
}

// Runs `compute`, caching its result under `key`. On failure, serves the last
// good result (flagged stale) instead of an error.
export async function cachedJson(env, key, maxAge, compute) {
  const headers = { "content-type": "application/json", "cache-control": `public, max-age=${maxAge}` };
  try {
    const data = await compute();
    await ensureSchema(env.DB);
    await env.DB.prepare("INSERT OR REPLACE INTO ig_cache (key, body, updated_at) VALUES (?, ?, ?)")
      .bind(key, JSON.stringify(data), Date.now()).run();
    return new Response(JSON.stringify({ ...data, updated_at: Date.now() }), { status: 200, headers });
  } catch (err) {
    console.error(`IG ${key} failed:`, err?.message || err);
    try {
      await ensureSchema(env.DB);
      const row = await env.DB.prepare("SELECT body, updated_at FROM ig_cache WHERE key = ?").bind(key).first();
      if (row) {
        return new Response(JSON.stringify({ ...JSON.parse(row.body), updated_at: row.updated_at, stale: true }), {
          status: 200,
          headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
        });
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: "instagram data unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

// Reads a user-insights metric value regardless of total_value vs values[] shape.
export function metricValue(data, name) {
  const m = (data || []).find((x) => x.name === name);
  if (!m) return null;
  if (m.total_value && typeof m.total_value.value === "number") return m.total_value.value;
  if (Array.isArray(m.values)) return m.values.reduce((s, v) => s + (typeof v.value === "number" ? v.value : 0), 0);
  return null;
}
