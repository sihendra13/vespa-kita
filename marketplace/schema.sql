-- VespaKita Marketplace — D1 schema
-- Run once when setting up the D1 database (see setup guide from Claude for the
-- exact `wrangler d1 execute` / dashboard console command).

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | published | rejected | unpublished
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  year INTEGER NOT NULL,
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photos TEXT NOT NULL DEFAULT '[]', -- JSON array of Cloudinary {url, publicId} objects
  video TEXT, -- JSON Cloudinary {url, publicId} object, or NULL
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
