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
  seller_ig TEXT NOT NULL DEFAULT '',
  doc_surat TEXT NOT NULL DEFAULT '', -- 'Lengkap (BPKB + STNK)' | 'STNK Saja' | 'Tidak Ada'
  doc_pajak TEXT NOT NULL DEFAULT '', -- 'Hidup' | 'Mati'
  doc_kepemilikan TEXT NOT NULL DEFAULT '', -- 'Tangan Pertama' | 'Tangan Kedua' | 'Tangan Ketiga+'
  minus_desc TEXT NOT NULL DEFAULT '', -- optional seller-disclosed defects
  description TEXT NOT NULL DEFAULT '',
  photos TEXT NOT NULL DEFAULT '[]', -- JSON array of Cloudinary {url, publicId} objects
  video TEXT NOT NULL, -- JSON Cloudinary {url, publicId} object — required as of the doc/IG update
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT,
  views INTEGER NOT NULL DEFAULT 0, -- incremented client-side on detail page load (avoids bot/crawler inflation)
  clicks INTEGER NOT NULL DEFAULT 0 -- incremented client-side right before the WA redirect
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
