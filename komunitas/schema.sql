-- VespaKita Komunitas — D1 schema
-- Run once when setting up the D1 database (same DB binding "DB" as marketplace).
-- Comments intentionally NOT included yet — that table lands once Google Sign-In
-- is wired up, since a comment without verified identity defeats the point of it.

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | published | rejected | unpublished
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  member_estimate INTEGER,
  ig TEXT NOT NULL DEFAULT '',
  wa TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  logo_public_id TEXT NOT NULL DEFAULT '',
  cover_photo_url TEXT NOT NULL DEFAULT '',
  cover_photo_public_id TEXT NOT NULL DEFAULT '',
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_communities_status ON communities(status);

CREATE TABLE IF NOT EXISTS community_events (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | published | rejected
  title TEXT NOT NULL,
  event_date_text TEXT NOT NULL DEFAULT '',
  participant_estimate INTEGER,
  support_type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sponsor_logos TEXT NOT NULL DEFAULT '[]', -- JSON array of {url, publicId} — filled in by admin once sponsors are secured
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_community_events_community_id ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_status ON community_events(status);
