-- Adds an optional link to a full external proposal page (itinerary, budget,
-- sponsor tiers, etc.) for events that already have one — e.g. the legacy
-- hand-built /60s-yogyakarta/ and /vw-yogyakarta/ pages. New submissions
-- through the form leave this blank; the profile page's own description
-- serves as the proposal for those.
ALTER TABLE community_events ADD COLUMN detail_url TEXT NOT NULL DEFAULT '';
