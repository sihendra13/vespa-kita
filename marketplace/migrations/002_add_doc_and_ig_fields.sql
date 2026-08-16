-- Adds seller Instagram + document status fields, and makes video required.
-- Applied once via `wrangler d1 execute vespakita-marketplace --remote --file=...`.
-- video's NOT NULL can't be added retroactively via ALTER on SQLite without a
-- default; enforced at the application layer instead (marketplace-submit.js).

ALTER TABLE listings ADD COLUMN seller_ig TEXT NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN doc_surat TEXT NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN doc_pajak TEXT NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN doc_kepemilikan TEXT NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN minus_desc TEXT NOT NULL DEFAULT '';
