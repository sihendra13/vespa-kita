// IndexNow ping — tells Bing/Yandex (and anyone else on the shared protocol)
// about a URL the moment it's published, instead of waiting for their next
// sitemap re-crawl. Google doesn't consume IndexNow, but Bing results feed
// Copilot/Bing Chat citations, so this still matters for AI-search visibility.
// Fire-and-forget: call via `waitUntil(pingIndexNow(urls))` from an admin
// action handler so a slow/failed ping never blocks the admin's response.

const INDEXNOW_KEY = "acbc14c1f01f6fbddf462177a31d54c3";
const HOST = "www.vespakita.com";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

export async function pingIndexNow(urls) {
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (!urlList.length) return;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList }),
    });
  } catch (err) {
    console.error("IndexNow ping failed:", err);
  }
}
