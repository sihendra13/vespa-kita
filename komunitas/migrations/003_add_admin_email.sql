-- Optional Google account email for the community's official admin/pengurus.
-- When someone comments while logged in with a matching Google account, the
-- comment gets an "Admin Komunitas" badge — set at submission time, not a
-- separate identity/login system.
ALTER TABLE communities ADD COLUMN admin_email TEXT NOT NULL DEFAULT '';
