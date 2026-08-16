// Shared formsubmit.co email helper for marketplace Pages Functions.
// Reuses the same formsubmit.co/hendra@vespakita.com endpoint already wired up
// for the "Diskusikan Campaign Anda" lead form on the main site — no API key,
// no separate account to set up. Best-effort: callers should not let a
// failure here block the actual listing submission.

const ADMIN_EMAIL = "hendra@vespakita.com";
const ADMIN_URL = "https://www.vespakita.com/marketplace/admin/";

export async function sendAdminNotification(listing) {
  const fmtRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  const res = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      _subject: `Listing baru menunggu review: ${listing.title}`,
      _captcha: "false",
      Model: listing.title,
      Harga: fmtRupiah(listing.price),
      Tahun: String(listing.year),
      Kondisi: listing.condition,
      Lokasi: listing.location,
      Penjual: listing.sellerName,
      "No. WhatsApp Penjual": listing.sellerPhone,
      "Instagram Penjual": listing.sellerIg || "-",
      Surat: listing.docSurat || "-",
      Pajak: listing.docPajak || "-",
      Kepemilikan: listing.docKepemilikan || "-",
      Deskripsi: listing.description || "-",
      "Kekurangan/Minus": listing.minusDesc || "-",
      "Review & Approve": listing.adminLink || ADMIN_URL,
    }),
  });
  const bodyText = await res.text();
  console.log("formsubmit.co response:", res.status, bodyText.slice(0, 300));
}
