// Shared Web Push helper — @mmmike/web-push implements RFC 8291 (aes128gcm),
// the encoding modern browsers actually require (PushManager.supportedContentEncodings
// only lists "aes128gcm" now — the older "aesgcm" draft encoding several other
// "Workers-compatible" push libraries still ship is silently undecryptable).
// Best-effort: callers should not let a failed/missing subscription block the
// actual action (e.g. approving a listing).

// Public key — not a secret, meant to be embedded in frontend code too
// (see VAPID_PUBLIC_KEY in marketplace/index.html, which must match this exactly).
export const VAPID_PUBLIC_KEY = "BCsFAxSwFcOd07KOfY8bPOp5QihhEI3JUBEY6tsBnQeuI173ll39_hSp3aThAgSAa4vrlS7c4wq0vHM8tL2PT5E";

// Imported dynamically (rather than a static top-level import) so that if this
// first-ever npm dependency in the project ever fails to resolve in a
// Cloudflare Pages build, only push notifications degrade — it can't take
// down marketplace-admin.js's approve/reject/delete actions with it.
//
// Returns true if delivered, false if the subscription is gone/invalid
// (caller should delete that row), throws on other push-service errors.
export async function sendPush(env, subscriptionRow, { title, body, url }) {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    console.error("VAPID_PRIVATE_KEY/VAPID_SUBJECT not configured — skipping push send");
    return true; // not a subscription problem — don't let the caller delete the row
  }

  const { sendPushNotification } = await import("@mmmike/web-push");

  const subscription = {
    endpoint: subscriptionRow.endpoint,
    keys: { p256dh: subscriptionRow.p256dh, auth: subscriptionRow.auth },
  };

  return sendPushNotification(
    subscription,
    { title, body, url },
    {
      subject: env.VAPID_SUBJECT,
      publicKey: VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    },
    { topic: "listing-approved", ttl: 86400, urgency: "high" }
  );
}
