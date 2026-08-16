// Cloudflare Pages Function — POST /api/marketplace-submit
// Public endpoint: seller self-service listing submission (multipart/form-data).
// Photos/video are uploaded to Cloudinary (free tier, no card required); metadata
// + Cloudinary URLs land in D1 with status "pending" — only visible on the public
// /marketplace/ page once an admin approves via /api/marketplace-admin.

import { cloudinaryUpload } from "../_lib/cloudinary.js";
import { sendAdminNotification } from "../_lib/formsubmit.js";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // 6MB — safety net above the ~1600px/JPEG-80% client compression target
const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30MB. Duration (max 60s) is enforced client-side only —
// Workers has no video-parsing primitive to check duration server-side without a heavy dependency.
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 800;
const MAX_TOTAL_LISTINGS = 500; // abuse ceiling for the whole table

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

function isNonEmptyString(v, max) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  try {
    return await handlePost(context);
  } catch (err) {
    // TEMPORARY diagnostic scaffolding — surfaces the real server error directly
    // in the response so it can be read without needing Cloudflare's log viewer.
    // Revert to a generic message once the 502 root cause is found.
    return new Response(
      JSON.stringify({ error: "Internal error", debugMessage: err && err.message, debugStack: err && err.stack }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

async function handlePost(context) {
  const { request, env, waitUntil } = context;

  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });
  const cloudinaryEnv = {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
  if (!cloudinaryEnv.cloudName || !cloudinaryEnv.apiKey || !cloudinaryEnv.apiSecret) {
    return new Response(JSON.stringify({ error: "Cloudinary not configured" }), { status: 500 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Form tidak valid.");
  }

  const title = String(form.get("title") || "");
  const sellerName = String(form.get("sellerName") || "");
  const location = String(form.get("location") || "");
  const condition = String(form.get("condition") || "");
  const priceRaw = form.get("price");
  const yearRaw = form.get("year");
  const sellerPhoneRaw = String(form.get("sellerPhone") || "");
  const description = String(form.get("description") || "");

  if (!isNonEmptyString(title, MAX_TITLE)) return badRequest("Model & tahun Vespa wajib diisi.");
  if (!isNonEmptyString(sellerName, 100)) return badRequest("Nama wajib diisi.");
  if (!isNonEmptyString(location, 100)) return badRequest("Lokasi wajib diisi.");
  if (!["Original", "Restorasi"].includes(condition)) return badRequest("Kondisi tidak valid.");

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || !(price > 0) || price > 1_000_000_000) return badRequest("Harga tidak valid.");

  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 1946 || year > new Date().getFullYear() + 1) return badRequest("Tahun tidak valid.");

  const phoneDigits = sellerPhoneRaw.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) return badRequest("No. WhatsApp tidak valid.");
  const sellerPhone = phoneDigits.startsWith("62") ? phoneDigits : "62" + phoneDigits.replace(/^0/, "");

  if (description.length > MAX_DESCRIPTION) return badRequest("Deskripsi terlalu panjang.");

  const photoFiles = form.getAll("photos").filter((f) => f instanceof File && f.size > 0);
  if (photoFiles.length > MAX_PHOTOS) return badRequest(`Maksimal ${MAX_PHOTOS} foto.`);
  for (const f of photoFiles) {
    if (!IMAGE_TYPES.has(f.type)) return badRequest("Format foto harus JPG, PNG, atau WebP.");
    if (f.size > MAX_PHOTO_BYTES) return badRequest(`Ukuran foto maksimal ${MAX_PHOTO_BYTES / 1024 / 1024}MB.`);
  }

  const videoFile = form.get("video");
  const hasVideo = videoFile instanceof File && videoFile.size > 0;
  if (hasVideo) {
    if (!VIDEO_TYPES.has(videoFile.type)) return badRequest("Format video harus MP4, MOV, atau WebM.");
    if (videoFile.size > MAX_VIDEO_BYTES) return badRequest(`Ukuran video maksimal ${MAX_VIDEO_BYTES / 1024 / 1024}MB.`);
  }

  const { count } = (await env.DB.prepare("SELECT COUNT(*) as count FROM listings").first()) || { count: 0 };
  if (count >= MAX_TOTAL_LISTINGS) {
    return new Response(JSON.stringify({ error: "Kuota listing penuh, hubungi tim VespaKita langsung." }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  const id = crypto.randomUUID();
  const folder = `listings/${id}`;

  const photoResults = [];
  let i = 0;
  for (const f of photoFiles) {
    i += 1;
    try {
      const result = await cloudinaryUpload(f, { ...cloudinaryEnv, folder, publicId: `photo-${i}`, resourceType: "image" });
      photoResults.push(result);
    } catch {
      return new Response(JSON.stringify({ error: "Gagal upload foto, coba lagi." }), { status: 502, headers: { "content-type": "application/json" } });
    }
  }

  let videoResult = null;
  if (hasVideo) {
    try {
      videoResult = await cloudinaryUpload(videoFile, { ...cloudinaryEnv, folder, publicId: "video", resourceType: "video" });
    } catch {
      return new Response(JSON.stringify({ error: "Gagal upload video, coba lagi." }), { status: 502, headers: { "content-type": "application/json" } });
    }
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO listings (id, status, title, price, year, condition, location, seller_name, seller_phone, description, photos, video, submitted_at, reviewed_at, published_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
  )
    .bind(
      id,
      title.trim(),
      price,
      year,
      condition,
      location.trim(),
      sellerName.trim(),
      sellerPhone,
      description.trim(),
      JSON.stringify(photoResults),
      videoResult ? JSON.stringify(videoResult) : null,
      now
    )
    .run();

  waitUntil(
    sendAdminNotification({
      title: title.trim(),
      price,
      year,
      condition,
      location: location.trim(),
      sellerName: sellerName.trim(),
      sellerPhone,
      description: description.trim(),
    }).catch(() => {})
  );

  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { "content-type": "application/json" },
  });
}
