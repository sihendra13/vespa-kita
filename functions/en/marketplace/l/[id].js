// Thin English wrapper — GET /en/marketplace/l/:id.
// Reuses the same renderer as functions/marketplace/l/[id].js, just with
// lang="en". See that file for the actual template and translation map.

import { renderListingPage } from "../../../marketplace/l/[id].js";

export async function onRequestGet(context) {
  return renderListingPage(context, "en");
}
