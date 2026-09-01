// Cloudflare Pages Function — POST /api/marketplace-shipping-rates
// Public endpoint: given a listing + buyer destination address, returns
// courier options with the price actually shown to the buyer.
//
// The shown price is padded slightly above Biteship's raw courier rate to
// invisibly cover Biteship's own per-request cost and Xendit's QRIS cut
// (0.7%) — buyer-facing checkout only ever shows "Ongkir" and a flat
// "Biaya Aplikasi: Rp2.000", never a separate payment-gateway line item.

import { searchArea, getRates } from "../_lib/biteship.js";

const XENDIT_QRIS_RATE = 0.007; // 0.7% — pads the shown shipping cost enough to cover Xendit's cut
const BITESHIP_COST_PADDING = 60; // ~1 rates call (Rp5) + ~5 tracking calls (Rp10 each) rounded up

function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { listingId, destinationAddress } = body || {};
  if (!listingId || typeof listingId !== "string") return badRequest("listingId is required");
  if (!destinationAddress || typeof destinationAddress !== "string" || destinationAddress.trim().length < 3) {
    return badRequest("destinationAddress is required");
  }

  const listing = await env.DB.prepare(
    `SELECT id, price, location, category, status FROM listings WHERE id = ?`
  ).bind(listingId).first();
  if (!listing) return badRequest("Listing not found");
  if (listing.category !== "sparepart") return badRequest("Checkout is only available for sparepart/aksesoris listings");
  if (listing.status !== "published") return badRequest("Listing is not available");

  let originAreas, destinationAreas;
  try {
    [originAreas, destinationAreas] = await Promise.all([
      searchArea(env, listing.location),
      searchArea(env, destinationAddress),
    ]);
  } catch (err) {
    console.error("Biteship area search failed:", err);
    return new Response(JSON.stringify({ error: "Gagal mencari lokasi, coba tulis alamat lebih lengkap." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  if (!originAreas.length) return badRequest("Lokasi penjual tidak ditemukan, hubungi admin.");
  if (!destinationAreas.length) return badRequest("Alamat tujuan tidak ditemukan, coba tulis lebih lengkap (termasuk kota).");

  const originAreaId = originAreas[0].id;
  const destinationAreaId = destinationAreas[0].id;

  let couriers;
  try {
    couriers = await getRates(env, {
      originAreaId,
      destinationAreaId,
      weightGrams: 1000, // flat estimate for sparepart/aksesoris — small parts, safe default
      itemValue: listing.price,
    });
  } catch (err) {
    console.error("Biteship rates failed:", err);
    return new Response(JSON.stringify({ error: "Gagal cek ongkir, coba lagi." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const options = couriers.map((c) => {
    const rawCost = c.price;
    const shownCost = Math.ceil((rawCost + BITESHIP_COST_PADDING) / (1 - XENDIT_QRIS_RATE));
    return {
      courierCode: c.courier_code,
      courierService: c.courier_service_code,
      courierName: `${c.courier_name} ${c.courier_service_name}`,
      shippingCost: shownCost,
      etaText: c.duration || null,
    };
  });

  return new Response(
    JSON.stringify({ destinationAreaId, options }),
    { headers: { "content-type": "application/json" } }
  );
}
