// Shared Resend email helper for marketplace Pages Functions.
// Best-effort admin notification — callers should not let a failure here
// block the actual listing submission.

const ADMIN_EMAIL = "hendra@vespakita.com";
const ADMIN_URL = "https://www.vespakita.com/marketplace/admin/";

export async function sendAdminNotification(apiKey, listing) {
  const fmtRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
  const isUnit = listing.category !== "sparepart";

  const text = `Ada listing baru masuk di Marketplace VespaKita, menunggu review.

Kategori: ${isUnit ? "Unit Vespa" : "Sparepart / Aksesoris"}
${isUnit ? "Model" : "Nama Barang"}: ${listing.title}
Harga: ${fmtRupiah(listing.price)}
${isUnit ? `Tahun: ${listing.year}\n` : ""}Kondisi: ${listing.condition}
Lokasi: ${listing.location}

Penjual: ${listing.sellerName}
WhatsApp: ${listing.sellerPhone}
Instagram: @${listing.sellerIg || "-"}

${isUnit
  ? `Surat: ${listing.docSurat || "-"}\nPajak: ${listing.docPajak || "-"}\nKepemilikan: ${listing.docKepemilikan || "-"}`
  : `Kecocokan Tipe Vespa: ${listing.compatibility || "-"}`}

Deskripsi: ${listing.description || "-"}
${isUnit ? `Kekurangan/Minus: ${listing.minusDesc || "-"}\n` : ""}
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

const COMMUNITY_ADMIN_URL = "https://www.vespakita.com/komunitas/admin/";

export async function sendCommunityAdminNotification(apiKey, submission) {
  const hasEvent = !!submission.eventTitle;
  const eventBlock = hasEvent
    ? `
Event: ${submission.eventTitle}
Tanggal: ${submission.eventDateText || "-"}
Estimasi peserta: ${submission.participantEstimate || "-"}
Dukungan dibutuhkan: ${submission.supportType || "-"}
Rencana event: ${submission.eventDescription || "-"}
`
    : `
(Belum mengisi detail event — cuma daftar jadi komunitas partner dulu.)
`;

  const text = `Ada pengajuan komunitas baru masuk, menunggu review.

Komunitas: ${submission.name}
Kota: ${submission.city}
Perkiraan anggota: ${submission.memberEstimate || "-"}
Instagram: @${submission.ig || "-"}
WhatsApp: ${submission.wa}
Deskripsi komunitas: ${submission.description || "-"}
${eventBlock}
Review & approve di: ${submission.adminLink || COMMUNITY_ADMIN_URL}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "VespaKita Komunitas <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: hasEvent
        ? `Pengajuan event baru: ${submission.eventTitle}`
        : `Komunitas baru daftar: ${submission.name}`,
      text,
    }),
  });

  const bodyText = await res.text();
  console.log("Resend response:", res.status, bodyText.slice(0, 300));
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${bodyText.slice(0, 300)}`);
}
