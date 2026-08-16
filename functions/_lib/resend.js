// Shared Resend email helper for marketplace Pages Functions.
// Best-effort admin notification — callers should not let a failure here
// block the actual listing submission.

const ADMIN_EMAIL = "hendra@vespakita.com";
const ADMIN_URL = "https://www.vespakita.com/marketplace/admin/";

export async function sendAdminNotification(apiKey, listing) {
  const fmtRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  const text = `Ada listing baru masuk di Marketplace VespaKita, menunggu review.

Model: ${listing.title}
Harga: ${fmtRupiah(listing.price)}
Tahun: ${listing.year}
Kondisi: ${listing.condition}
Lokasi: ${listing.location}

Penjual: ${listing.sellerName}
WhatsApp: ${listing.sellerPhone}
Instagram: @${listing.sellerIg || "-"}

Surat: ${listing.docSurat || "-"}
Pajak: ${listing.docPajak || "-"}
Kepemilikan: ${listing.docKepemilikan || "-"}

Deskripsi: ${listing.description || "-"}
Kekurangan/Minus: ${listing.minusDesc || "-"}

Review & approve di: ${listing.adminLink || ADMIN_URL}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "VespaKita Marketplace <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `Listing baru menunggu review: ${listing.title}`,
      text,
    }),
  });

  const bodyText = await res.text();
  console.log("Resend response:", res.status, bodyText.slice(0, 300));
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${bodyText.slice(0, 300)}`);
}
