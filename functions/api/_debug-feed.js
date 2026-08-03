// TEMPORARY debug endpoint — lists recent feed items (permalink + platform_post_id)
// so we can find the platform_post_id for a specific post by matching its permalink.
// Delete this file after use.

const SOCIAL_ACCOUNT_ID = "spc_adDd2jBSSm5jGwhBO4jYM"; // ves_pakita (Instagram)

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.POSTFORME_API_KEY) {
    return new Response(JSON.stringify({ error: "POSTFORME_API_KEY not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(`https://api.postforme.dev/v1/social-account-feeds/${SOCIAL_ACCOUNT_ID}`);
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${env.POSTFORME_API_KEY}` },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "upstream failed", status: res.status }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await res.json();
  const items = (body?.data || []).slice(0, 5);

  return new Response(JSON.stringify({ items }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
