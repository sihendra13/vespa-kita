// Cloudflare Pages Function — POST /api/auth-session
// Exchanges a fresh Google ID token (short-lived, ~1hr) for a long-lived
// VespaKita session token (~180 days), minted server-side via
// functions/_lib/session.js. Called once right after Google Sign-In
// succeeds — the returned sessionToken is what the client stores and sends
// to /api/tongkrongan and /api/comments from then on, so users don't have
// to redo Google Sign-In every time Google's own token expires.

import { verifyGoogleIdToken } from "../_lib/google-auth.js";
import { mintSessionToken } from "../_lib/session.js";

// Same client ID used by tongkrongan.js and comments.js — not a secret,
// Google OAuth Client IDs are meant to be embedded in frontend code.
const GOOGLE_CLIENT_ID = "214234294300-esr7idh546oipvt66hs8nti9b7oi476s.apps.googleusercontent.com";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const { idToken } = body || {};

  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Login Google tidak valid, coba lagi." }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const profile = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };

  let sessionToken;
  try {
    sessionToken = await mintSessionToken(env, profile);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Gagal membuat sesi login." }), { status: 500, headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ sessionToken, ...profile }), { headers: { "content-type": "application/json" } });
}
