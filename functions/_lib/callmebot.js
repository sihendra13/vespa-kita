// CallMeBot WhatsApp API — sends a WhatsApp message to a single pre-activated
// number via a plain HTTP GET. Free, no business verification, but unofficial
// (not a Meta/WhatsApp product) — treat as best-effort, not guaranteed uptime.
// Activation (one-time, done by the recipient's own WhatsApp): add
// +34 694 23 41 84 as a contact, message it "I allow callmebot to send me
// messages", get an APIKEY back. See https://www.callmebot.com/blog/free-api-whatsapp-messages/

export async function sendAdminWhatsApp(phone, apiKey, message) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const bodyText = await res.text();
  console.log("CallMeBot response:", res.status, bodyText);
  if (!res.ok) throw new Error(`CallMeBot request failed: ${res.status} ${bodyText}`);
  return bodyText;
}
