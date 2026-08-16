// Shared Cloudinary helpers for marketplace Pages Functions.
// Files/folders starting with "_" aren't routed by Cloudflare Pages Functions,
// so this is safely importable from ../api/*.js without becoming its own route.

async function sign(params, apiSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const data = new TextEncoder().encode(sorted + apiSecret);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// resourceType: "image" | "video"
// TEMPORARY diagStage param for binary-searching a platform-level 502 that
// bypasses try/catch: "sign" stops after the SHA-1 signature, "formdata"
// stops after building the outbound FormData, undefined/"fetch" does the
// real network call. Remove once diagnosed.
export async function cloudinaryUpload(file, { cloudName, apiKey, apiSecret, folder, publicId, resourceType, diagStage }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sign({ folder, public_id: publicId, timestamp }, apiSecret);
  if (diagStage === "sign") return { url: "https://example.com/diag-sign-ok.jpg", publicId: "diag-sign-ok" };

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", folder);
  fd.append("public_id", publicId);
  fd.append("signature", signature);
  if (diagStage === "formdata") return { url: "https://example.com/diag-formdata-ok.jpg", publicId: "diag-formdata-ok" };

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: fd,
  });
  if (diagStage === "fetch-only") return { url: "https://example.com/diag-fetch-ok-status-" + res.status, publicId: "diag-fetch-ok" };
  if (diagStage === "fetch-status") {
    const headerDump = [...res.headers.entries()].map(([k, v]) => `${k}=${v}`).join(";");
    throw new Error(`DIAG fetch-status status=${res.status} headers=${headerDump}`);
  }
  if (diagStage === "fetch-text") {
    const bodyText = await res.text();
    throw new Error(`DIAG fetch-text status=${res.status} body=${bodyText.slice(0, 800)}`);
  }
  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

export async function cloudinaryDestroy(publicId, resourceType, { cloudName, apiKey, apiSecret }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sign({ public_id: publicId, timestamp }, apiSecret);

  const fd = new FormData();
  fd.append("public_id", publicId);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
    method: "POST",
    body: fd,
  });
}
