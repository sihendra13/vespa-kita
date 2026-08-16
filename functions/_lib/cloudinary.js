// Shared Cloudinary helpers for marketplace Pages Functions.
// Files/folders starting with "_" aren't routed by Cloudflare Pages Functions,
// so this is safely importable from ../api/*.js without becoming its own route.

// Parses the single CLOUDINARY_URL env var (cloudinary://API_KEY:API_SECRET@CLOUD_NAME) —
// using Cloudinary's own combined credential string avoids ever pasting the key
// and secret as two separate values that could end up mismatched.
export function parseCloudinaryUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) return null;
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(cloudinaryUrl.trim());
  if (!match) return null;
  const [, apiKey, apiSecret, cloudName] = match;
  return { apiKey, apiSecret, cloudName };
}

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
export async function cloudinaryUpload(file, { cloudName, apiKey, apiSecret, folder, publicId, resourceType }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sign({ folder, public_id: publicId, timestamp }, apiSecret);

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", folder);
  fd.append("public_id", publicId);
  fd.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
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
