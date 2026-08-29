// Cloudflare Pages Function — POST /api/community-submit
// Public endpoint: community self-service event/sponsorship-request submission
// (multipart/form-data). Logo + photos upload to Cloudinary; a communities row
// and its first community_events row are inserted together with status
// "pending" — only visible on the public /komunitas/ page once an admin
// approves via /api/community-admin.

import { cloudinaryUpload, parseCloudinaryUrl } from "../_lib/cloudinary.js";
import { sendCommunityAdminNotification } from "../_lib/resend.js";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_DESCRIPTION = 800;
const MAX_TOTAL_COMMUNITIES = 500; // abuse ceiling, same pattern as marketplace

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const SUPPORT_TYPE_OPTIONS = ["Sponsor Dana", "Sponsor Barang / Merchandise", "Media Coverage / Dokumentasi", "Kombinasi"];

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
    console.error("community-submit error:", err);
    return new Response(JSON.stringify({ error: "Gagal mengirim pengajuan, coba lagi." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

async function handlePost(context) {
  const { request, env, waitUntil } = context;

  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });
  const cloudinaryEnv = parseCloudinaryUrl(env.CLOUDINARY_URL);
  if (!cloudinaryEnv) {
    return new Response(JSON.stringify({ error: "Cloudinary not configured" }), { status: 500 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Form tidak valid.");
  }

  const name = String(form.get("name") || "");
  const city = String(form.get("city") || "");
  const description = String(form.get("description") || "");
  const memberEstimateRaw = form.get("memberEstimate");
  const igRaw = String(form.get("ig") || "");
  const waRaw = String(form.get("wa") || "");

  const eventTitle = String(form.get("eventTitle") || "");
  const eventDateText = String(form.get("eventDateText") || "");
  const participantEstimateRaw = form.get("participantEstimate");
  const supportType = String(form.get("supportType") || "");
  const eventDescription = String(form.get("eventDescription") || "");

  if (!isNonEmptyString(name, 120)) return badRequest("Nama komunitas wajib diisi.");
  if (!isNonEmptyString(city, 100)) return badRequest("Kota basis wajib diisi.");
  if (!isNonEmptyString(description, MAX_DESCRIPTION)) return badRequest("Deskripsi komunitas wajib diisi.");
  if (!isNonEmptyString(igRaw, 100)) return badRequest("Instagram komunitas wajib diisi.");
  if (!isNonEmptyString(eventTitle, 150)) return badRequest("Nama event wajib diisi.");
  if (!isNonEmptyString(eventDescription, MAX_DESCRIPTION)) return badRequest("Rencana event wajib diisi.");
  if (supportType && !SUPPORT_TYPE_OPTIONS.includes(supportType)) return badRequest("Jenis dukungan tidak valid.");

  const ig = igRaw.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "");

  const waDigits = waRaw.replace(/\D/g, "");
  if (waDigits.length < 9 || waDigits.length > 15) return badRequest("No. WhatsApp tidak valid.");
  const wa = waDigits.startsWith("62") ? waDigits : "62" + waDigits.replace(/^0/, "");

  const memberEstimate = memberEstimateRaw ? Number(memberEstimateRaw) : null;
  if (memberEstimate !== null && (!Number.isInteger(memberEstimate) || memberEstimate < 0)) {
    return badRequest("Perkiraan jumlah anggota tidak valid.");
  }
  const participantEstimate = participantEstimateRaw ? Number(participantEstimateRaw) : null;
  if (participantEstimate !== null && (!Number.isInteger(participantEstimate) || participantEstimate < 0)) {
    return badRequest("Estimasi jumlah peserta tidak valid.");
  }

  const logoFile = form.get("logo");
  const hasLogo = logoFile instanceof File && logoFile.size > 0;
  if (hasLogo) {
    if (!IMAGE_TYPES.has(logoFile.type)) return badRequest("Format logo harus JPG, PNG, atau WebP.");
    if (logoFile.size > MAX_PHOTO_BYTES) return badRequest(`Ukuran logo maksimal ${MAX_PHOTO_BYTES / 1024 / 1024}MB.`);
  }

  const photoFiles = form.getAll("photos").filter((f) => f instanceof File && f.size > 0);
  if (photoFiles.length > MAX_PHOTOS) return badRequest(`Maksimal ${MAX_PHOTOS} foto.`);
  for (const f of photoFiles) {
    if (!IMAGE_TYPES.has(f.type)) return badRequest("Format foto harus JPG, PNG, atau WebP.");
    if (f.size > MAX_PHOTO_BYTES) return badRequest(`Ukuran foto maksimal ${MAX_PHOTO_BYTES / 1024 / 1024}MB.`);
  }

  const { count } = (await env.DB.prepare("SELECT COUNT(*) as count FROM communities").first()) || { count: 0 };
  if (count >= MAX_TOTAL_COMMUNITIES) {
    return new Response(JSON.stringify({ error: "Kuota pengajuan penuh, hubungi tim VespaKita langsung." }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  const communityId = crypto.randomUUID();
  const folder = `communities/${communityId}`;

  let logoResult = null;
  if (hasLogo) {
    try {
      logoResult = await cloudinaryUpload(logoFile, { ...cloudinaryEnv, folder, publicId: "logo", resourceType: "image" });
    } catch (err) {
      console.error("Cloudinary logo upload failed:", err);
      return new Response(JSON.stringify({ error: "Gagal upload logo, coba lagi." }), { status: 500, headers: { "content-type": "application/json" } });
    }
  }

  // First uploaded event photo doubles as the community's cover photo — a
  // dedicated cover-photo field can be added later without a migration since
  // cover_photo_url is a plain column, not derived.
  let coverResult = null;
  const photoResults = [];
  let i = 0;
  for (const f of photoFiles) {
    i += 1;
    try {
      const result = await cloudinaryUpload(f, { ...cloudinaryEnv, folder, publicId: `photo-${i}`, resourceType: "image" });
      photoResults.push(result);
      if (!coverResult) coverResult = result;
    } catch (err) {
      console.error("Cloudinary photo upload failed:", err);
      return new Response(JSON.stringify({ error: "Gagal upload foto, coba lagi." }), { status: 500, headers: { "content-type": "application/json" } });
    }
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO communities (id, status, name, city, description, member_estimate, ig, wa, logo_url, logo_public_id, cover_photo_url, cover_photo_public_id, submitted_at, reviewed_at, published_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
  )
    .bind(
      communityId,
      name.trim(),
      city.trim(),
      description.trim(),
      memberEstimate,
      ig,
      wa,
      logoResult?.url || "",
      logoResult?.publicId || "",
      coverResult?.url || "",
      coverResult?.publicId || "",
      now
    )
    .run();

  const eventId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO community_events (id, community_id, status, title, event_date_text, participant_estimate, support_type, description, sponsor_logos, submitted_at, reviewed_at, published_at)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, '[]', ?, NULL, NULL)`
  )
    .bind(eventId, communityId, eventTitle.trim(), eventDateText.trim(), participantEstimate, supportType, eventDescription.trim(), now)
    .run();

  if (env.RESEND_API_KEY) {
    waitUntil(
      sendCommunityAdminNotification(env.RESEND_API_KEY, {
        name: name.trim(),
        city: city.trim(),
        memberEstimate,
        ig,
        wa,
        description: description.trim(),
        eventTitle: eventTitle.trim(),
        eventDateText: eventDateText.trim(),
        participantEstimate,
        supportType,
        eventDescription: eventDescription.trim(),
      }).catch((err) => console.error("sendCommunityAdminNotification failed:", err))
    );
  } else {
    console.error("RESEND_API_KEY not configured — skipping admin email notification");
  }

  return new Response(JSON.stringify({ ok: true, id: communityId }), {
    headers: { "content-type": "application/json" },
  });
}
