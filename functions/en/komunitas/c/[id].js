// Thin English wrapper — GET /en/komunitas/c/:id.
// Reuses the same renderer as functions/komunitas/c/[id].js, just with
// lang="en". See that file for the actual template and translation map.

import { renderCommunityPage } from "../../../komunitas/c/[id].js";

export async function onRequestGet(context) {
  return renderCommunityPage(context, "en");
}
