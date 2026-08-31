ALTER TABLE listings ADD COLUMN category TEXT NOT NULL DEFAULT 'unit'; -- 'unit' | 'sparepart'
ALTER TABLE listings ADD COLUMN compatibility TEXT NOT NULL DEFAULT ''; -- sparepart only: which Vespa models it fits
