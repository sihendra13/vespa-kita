import { parseCloudinaryUrl, cloudinaryUpload } from "../_lib/cloudinary.js";
import { verifyGoogleIdToken } from "../_lib/google-auth.js";

// Same client ID used by the community comments login (functions/api/comments.js)
// — not a secret, Google OAuth Client IDs are meant to be embedded in frontend code.
const GOOGLE_CLIENT_ID = "214234294300-esr7idh546oipvt66hs8nti9b7oi476s.apps.googleusercontent.com";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { "content-type": "application/json" } });
}
function serverError(msg) {
  return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "content-type": "application/json" } });
}
function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return serverError("DB not bound");

  // FORCE FIX: reset bot avatars on every load (temporary)
  try {
    await env.DB.prepare('UPDATE tongkrongan_posts SET user_avatar_url = "" WHERE google_sub = "bot-seeder"').run();
  } catch (e) {}


  // Get all visible posts
  const { results } = await env.DB.prepare(
    `SELECT * FROM tongkrongan_posts WHERE status = 'visible' ORDER BY created_at ASC`
  ).all();

  // Group by parent
  const posts = [];
  const replies = {};

  for (const row of (results || [])) {
    if (row.parent_id) {
      if (!replies[row.parent_id]) replies[row.parent_id] = [];
      replies[row.parent_id].push(row);
    } else {
      posts.push(row);
    }
  }

  // Sort posts by created_at DESC (newest main posts first)
  posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach replies
  for (const p of posts) {
    p.replies = replies[p.id] || [];
  }

  return new Response(JSON.stringify({ posts }), { headers: { "content-type": "application/json" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return serverError("DB not bound");

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const now = new Date();
  const rateRow = await env.DB.prepare(`SELECT last_post_at FROM tongkrongan_rate_limit WHERE ip = ?`).bind(ip).first();
  if (rateRow) {
    const diff = now.getTime() - new Date(rateRow.last_post_at).getTime();
    if (diff < 10000) {
      return new Response(JSON.stringify({ error: "Tunggu 10 detik sebelum memposting lagi." }), {
        status: 429,
        headers: { "content-type": "application/json" }
      });
    }
    await env.DB.prepare(`UPDATE tongkrongan_rate_limit SET last_post_at = ? WHERE ip = ?`).bind(now.toISOString(), ip).run();
  } else {
    await env.DB.prepare(`INSERT INTO tongkrongan_rate_limit (ip, last_post_at) VALUES (?, ?)`).bind(ip, now.toISOString()).run();
  }

  const fd = await request.formData().catch(() => null);
  if (!fd) return badRequest("Invalid form data");

  const content = fd.get("content");
  const idToken = fd.get("idToken");
  const parentId = fd.get("parent_id") || null;
  const photo = fd.get("photo");

  if (!isNonEmptyString(content) || content.length > 500) return badRequest("Konten tidak valid atau terlalu panjang (maks 500 karakter).");

  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Login sudah kedaluwarsa, silakan login lagi." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Stored raw — escaping happens once, client-side at render time (both the
  // public feed and the admin moderation page already escape on output).
  // Escaping here too would double-escape (e.g. "&" -> "&amp;amp;").
  const safeContent = content.trim();
  const authorName = payload.name || payload.email;
  const googleSub = payload.sub;
  const userEmail = payload.email;
  const userAvatarUrl = payload.picture || null;

  let imageUrl = null;
  let imagePublicId = null;

  // Handle Photo
  if (photo && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return badRequest("Ukuran foto maksimal 5MB.");
    if (!IMAGE_TYPES.has(photo.type)) return badRequest("Format foto harus JPG, PNG, atau WebP.");
    
    const cloudinaryEnv = parseCloudinaryUrl(env.CLOUDINARY_URL);
    if (!cloudinaryEnv) return serverError("Cloudinary belum dikonfigurasi.");

    const folder = "tongkrongan";
    const idSuffix = Math.random().toString(36).slice(2, 8);
    
    try {
      const result = await cloudinaryUpload(photo, { 
        ...cloudinaryEnv, 
        folder, 
        publicId: `t-${now.getTime()}-${idSuffix}`, 
        resourceType: "image" 
      });
      imageUrl = result.url;
      imagePublicId = result.publicId;
    } catch (e) {
      return serverError("Gagal mengunggah foto.");
    }
  }

  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO tongkrongan_posts (id, parent_id, author_name, google_sub, user_email, user_avatar_url, content, image_url, image_public_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    parentId,
    authorName,
    googleSub,
    userEmail,
    userAvatarUrl,
    safeContent,
    imageUrl,
    imagePublicId,
    now.toISOString()
  ).run();

  return new Response(JSON.stringify({ success: true, id, authorName, userAvatarUrl }), { headers: { "content-type": "application/json" } });
}
