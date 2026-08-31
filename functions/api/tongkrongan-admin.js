import { parseCloudinaryUrl, cloudinaryDestroy } from "../_lib/cloudinary.js";

function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { "content-type": "application/json" } });
}
function serverError(msg) {
  return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "content-type": "application/json" } });
}

// Ensure Auth matching `marketplace-admin.js`
function checkAuth(request, env) {
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${env.ADMIN_PASSWORD}`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return new Response("Unauthorized", { status: 401 });
  if (!env.DB) return serverError("DB not bound");

  // Get ALL posts for admin review
  const { results } = await env.DB.prepare(
    `SELECT * FROM tongkrongan_posts ORDER BY created_at DESC`
  ).all();

  return new Response(JSON.stringify({ posts: results || [] }), { headers: { "content-type": "application/json" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return new Response("Unauthorized", { status: 401 });
  if (!env.DB) return serverError("DB not bound");

  const body = await request.json().catch(() => null);
  if (!body || !body.id || !body.action) return badRequest("Invalid payload");

  const { id, action } = body;

  if (action === "hide") {
    await env.DB.prepare(`UPDATE tongkrongan_posts SET status = 'hidden' WHERE id = ?`).bind(id).run();
  } else if (action === "unhide") {
    await env.DB.prepare(`UPDATE tongkrongan_posts SET status = 'visible' WHERE id = ?`).bind(id).run();
  } else if (action === "delete") {
    // Delete permanent + cleanup Cloudinary
    const row = await env.DB.prepare(`SELECT image_public_id FROM tongkrongan_posts WHERE id = ?`).bind(id).first();
    
    if (row && row.image_public_id) {
      const cloudinaryEnv = parseCloudinaryUrl(env.CLOUDINARY_URL);
      if (cloudinaryEnv) {
        try {
          await cloudinaryDestroy(row.image_public_id, "image", cloudinaryEnv);
        } catch(e) {
          console.error("Failed to delete from Cloudinary:", e);
        }
      }
    }
    
    await env.DB.prepare(`DELETE FROM tongkrongan_posts WHERE id = ?`).bind(id).run();
    // Also delete any replies attached to this post
    await env.DB.prepare(`DELETE FROM tongkrongan_posts WHERE parent_id = ?`).bind(id).run();
  } else {
    return badRequest("Invalid action");
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
}
