// Cloudflare Pages Function — GET/POST /api/comments
// GET is public read (?targetType=community&targetId=...), returns visible
// comments. POST requires a real Google ID token (verified server-side via
// functions/_lib/google-auth.js) — the token's own claims (name/email/picture)
// are used for attribution, never client-supplied values, so a comment can't
// be posted under someone else's name.

import { verifyGoogleIdToken } from "../_lib/google-auth.js";
import { verifySessionToken } from "../_lib/session.js";

// Not a secret — Google OAuth Client IDs are meant to be embedded in frontend code.
const GOOGLE_CLIENT_ID = "214234294300-esr7idh546oipvt66hs8nti9b7oi476s.apps.googleusercontent.com";

const MAX_TEXT = 500;
const MAX_COMMENTS_PER_TARGET = 2000; // abuse ceiling

function rowToComment(row, adminEmail) {
  return {
    id: row.id,
    userName: row.user_name,
    userAvatarUrl: row.user_avatar_url,
    text: row.text,
    createdAt: row.created_at,
    // Not "verified admin account" in a strong sense — just "this Google
    // account's email matches what the community gave us at signup". Good
    // enough for a lightweight badge, not for anything security-sensitive.
    isAdminReply: !!adminEmail && row.user_email.toLowerCase() === adminEmail,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  const url = new URL(request.url);
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  if (!targetType || !targetId) {
    return new Response(JSON.stringify({ error: "targetType and targetId required" }), { status: 400 });
  }

  const [{ results }, community] = await Promise.all([
    env.DB
      .prepare(`SELECT * FROM comments WHERE target_type = ? AND target_id = ? AND status = 'visible' ORDER BY created_at DESC`)
      .bind(targetType, targetId)
      .all(),
    targetType === "community"
      ? env.DB.prepare(`SELECT admin_email FROM communities WHERE id = ?`).bind(targetId).first()
      : Promise.resolve(null),
  ]);

  const adminEmail = (community?.admin_email || "").toLowerCase() || null;

  return new Response(JSON.stringify((results || []).map((r) => rowToComment(r, adminEmail))), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=30" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    return await handlePost(request, env);
  } catch (err) {
    console.error("comments POST error:", err);
    return new Response(JSON.stringify({ error: "Gagal mengirim komentar, coba lagi." }), { status: 500 });
  }
}

async function handlePost(request, env) {
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { idToken, sessionToken, targetType, targetId, text } = body || {};
  if (targetType !== "community") {
    return new Response(JSON.stringify({ error: "Invalid target" }), { status: 400 });
  }
  if (!targetId || typeof targetId !== "string") {
    return new Response(JSON.stringify({ error: "Invalid target" }), { status: 400 });
  }
  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT) {
    return new Response(JSON.stringify({ error: "Komentar tidak boleh kosong dan maksimal 500 karakter." }), { status: 400 });
  }

  let payload;
  try {
    payload = sessionToken
      ? await verifySessionToken(env, sessionToken)
      : await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Login sudah kedaluwarsa, silakan login lagi." }), { status: 401 });
  }

  const community = await env.DB.prepare(`SELECT id FROM communities WHERE id = ? AND status = 'published'`).bind(targetId).first();
  if (!community) return new Response(JSON.stringify({ error: "Komunitas tidak ditemukan" }), { status: 404 });

  const { count } = (await env.DB
    .prepare(`SELECT COUNT(*) as count FROM comments WHERE target_type = ? AND target_id = ?`)
    .bind(targetType, targetId)
    .first()) || { count: 0 };
  if (count >= MAX_COMMENTS_PER_TARGET) {
    return new Response(JSON.stringify({ error: "Kolom komentar sudah penuh." }), { status: 429 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO comments (id, target_type, target_id, google_sub, user_name, user_email, user_avatar_url, text, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'visible', ?)`
  )
    .bind(id, targetType, targetId, payload.sub, payload.name || payload.email, payload.email, payload.picture || "", text.trim(), now)
    .run();

  return new Response(JSON.stringify({ ok: true, id, userName: payload.name || payload.email, userAvatarUrl: payload.picture || "", createdAt: now }), {
    headers: { "content-type": "application/json" },
  });
}
