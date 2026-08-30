-- Comments table — gated behind real Google Sign-In verification (see
-- functions/_lib/google-auth.js), so every row is tied to a real, verified
-- Google account rather than a self-reported name.

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL, -- 'community' (only target for now — could extend to 'event' later)
  target_id TEXT NOT NULL,
  google_sub TEXT NOT NULL, -- Google's stable per-account user id, from the verified ID token
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_avatar_url TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible', -- visible | hidden (admin moderation)
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
