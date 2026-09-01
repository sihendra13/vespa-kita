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
  video TEXT, -- JSON Cloudinary {url, publicId} object — required for 'unit', optional for 'sparepart'
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT,
  views INTEGER NOT NULL DEFAULT 0, -- incremented client-side on detail page load (avoids bot/crawler inflation)
  clicks INTEGER NOT NULL DEFAULT 0, -- incremented client-side right before the WA redirect
  category TEXT NOT NULL DEFAULT 'unit', -- 'unit' | 'sparepart'
  compatibility TEXT NOT NULL DEFAULT '' -- sparepart only: which Vespa models it fits
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Web Push subscription, captured right after a seller submits a listing (opt-in).
-- One subscription per listing — used to notify the seller once an admin approves.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_listing ON push_subscriptions(listing_id);

-- Checkout orders — sparepart/aksesoris only, paid via Xendit (QRIS only, see
-- functions/_lib/xendit.js), shipped/tracked via Biteship (functions/_lib/biteship.js).
-- No login system exists, so buyer/seller each interact with their order only
-- through an unguessable order_token link (sent via WA), never by browsing a list.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  order_token TEXT NOT NULL UNIQUE, -- unguessable id for the no-login buyer/seller links

  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  buyer_area_id TEXT NOT NULL, -- Biteship area id for the destination, needed for rates + AWB

  shipping_courier_code TEXT, -- e.g. 'jne' — set once buyer picks a courier at checkout
  shipping_courier_service TEXT, -- e.g. 'reg'
  shipping_courier_name TEXT, -- display name, e.g. "JNE Reguler"
  shipping_cost INTEGER NOT NULL DEFAULT 0,

  item_price INTEGER NOT NULL, -- snapshot of listings.price at order time (listing price can change later)
  app_fee INTEGER NOT NULL DEFAULT 2000, -- flat "biaya aplikasi", paid by buyer, on top of item_price + shipping_cost
  total_amount INTEGER NOT NULL, -- item_price + shipping_cost + app_fee — what the buyer pays via Xendit
  payout_amount INTEGER NOT NULL, -- = item_price, in full — the seller is never charged the app_fee

  status TEXT NOT NULL DEFAULT 'pending_payment',
  -- pending_payment -> paid -> shipped -> released -> completed
  --                                          \-> disputed

  xendit_invoice_id TEXT,
  xendit_invoice_url TEXT,

  tracking_number TEXT,
  courier_delivered_at TEXT, -- set once Biteship tracking reports the package delivered
  auto_release_at TEXT, -- courier_delivered_at + buffer; past this, "delivered" is treated as confirmed

  buyer_acknowledged_risk_at TEXT, -- buyer ticked the pre-payment liability disclaimer
  released_at TEXT,
  disputed_at TEXT,
  dispute_reason TEXT,
  payout_completed_at TEXT, -- admin manually marked the seller as paid out

  created_at TEXT NOT NULL,
  paid_at TEXT,
  shipped_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(order_token);
