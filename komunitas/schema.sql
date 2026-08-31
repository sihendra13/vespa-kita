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

-- ==========================================
-- FITUR TONGKRONGAN (GLOBAL FEED)
-- ==========================================

CREATE TABLE IF NOT EXISTS tongkrongan_posts (
  id TEXT PRIMARY KEY,
  parent_id TEXT, -- NULL = post utama; diisi id post utama kalau ini reply (1 level saja)
  author_name TEXT NOT NULL, -- payload.name || payload.email dari Google ID token, bukan input bebas
  google_sub TEXT NOT NULL, -- Google account id (payload.sub) — identitas asli, dipakai buat moderasi/rate-limit
  user_email TEXT NOT NULL,
  user_avatar_url TEXT, -- payload.picture, nullable
  content TEXT NOT NULL,
  image_url TEXT, -- Cloudinary secure_url, nullable
  image_public_id TEXT, -- Cloudinary public_id
  likes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'visible', -- 'visible' | 'hidden'
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tongkrongan_google_sub ON tongkrongan_posts(google_sub);

CREATE INDEX IF NOT EXISTS idx_tongkrongan_parent ON tongkrongan_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_tongkrongan_created ON tongkrongan_posts(created_at);

-- Rate limiting sederhana per-IP
CREATE TABLE IF NOT EXISTS tongkrongan_rate_limit (
  ip TEXT PRIMARY KEY,
  last_post_at TEXT NOT NULL
);
