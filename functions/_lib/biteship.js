// Shared Biteship helper — shipping cost + tracking, pay-per-request (no
// monthly subscription). API reference: https://biteship.com/en/docs/api
// Auth header is the raw key, no "Bearer" prefix.

const BASE_URL = "https://api.biteship.com/v1";

async function biteshipFetch(env, path, options = {}) {
  if (!env.BITESHIP_API_KEY) throw new Error("BITESHIP_API_KEY not configured");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      authorization: env.BITESHIP_API_KEY,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(`Biteship API error (${res.status}): ${body?.error || body?.message || "unknown error"}`);
  }
  return body;
}

// Free-text address search -> list of {id, name, postal_code, ...}. The
// buyer picks one; its id is what every other Biteship call needs.
export async function searchArea(env, query) {
  const body = await biteshipFetch(
    env,
    `/maps/areas?countries=ID&input=${encodeURIComponent(query)}&type=single`
  );
  return body.areas || [];
}

// Courier options + prices for a given origin/destination area + package.
export async function getRates(env, { originAreaId, destinationAreaId, weightGrams, itemValue }) {
  const body = await biteshipFetch(env, "/rates/couriers", {
    method: "POST",
    body: JSON.stringify({
      origin_area_id: originAreaId,
      destination_area_id: destinationAreaId,
      couriers: "jne,jnt,sicepat,anteraja,ninja,pos", // widen later if a courier gets requested often
      items: [
        {
          name: "Sparepart Vespa",
          value: itemValue,
          weight: weightGrams,
          quantity: 1,
        },
      ],
    }),
  });
  return body.pricing || [];
}

// Returns the current delivery status + history for a tracking number.
export async function trackPackage(env, { courierCode, trackingNumber }) {
  const body = await biteshipFetch(
    env,
    `/trackings/${encodeURIComponent(trackingNumber)}/couriers/${encodeURIComponent(courierCode)}`
  );
  return body;
}
