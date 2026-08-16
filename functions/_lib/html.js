// Shared HTML-escaping helper. Listing content comes from public self-serve
// submissions, so anything server-rendered into HTML (unlike the client-side
// textContent-based rendering elsewhere) must be escaped to avoid XSS.
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
