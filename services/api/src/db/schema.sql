-- castdown — SQLite schema
-- Idempotent. Applied at startup via migrations.ts.
-- WAL mode + foreign keys enabled at connection time.

CREATE TABLE IF NOT EXISTS api_keys (
  id           TEXT PRIMARY KEY,             -- ULID
  key_hash     TEXT NOT NULL UNIQUE,         -- sha256(key)
  name         TEXT NOT NULL,
  scopes       TEXT NOT NULL DEFAULT 'cast,crawl,render',
  rate_limit   INTEGER NOT NULL DEFAULT 60,  -- per minute
  created_at   INTEGER NOT NULL,             -- unix ms
  last_used_at INTEGER,
  revoked_at   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

CREATE TABLE IF NOT EXISTS jobs (
  id           TEXT PRIMARY KEY,             -- ULID
  kind         TEXT NOT NULL,                -- 'cast' | 'render' | 'crawl'
  status       TEXT NOT NULL,                -- 'queued' | 'running' | 'done' | 'error'
  api_key_id   TEXT,
  input_meta   TEXT,                         -- JSON
  output_path  TEXT,
  output_bytes INTEGER,
  error        TEXT,
  elapsed_ms   INTEGER,
  cleaners     TEXT,                         -- JSON array of applied cleaner names
  created_at   INTEGER NOT NULL,
  finished_at  INTEGER,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_api_key ON jobs(api_key_id, created_at);

CREATE TABLE IF NOT EXISTS files (
  id          TEXT PRIMARY KEY,              -- ULID
  sha256      TEXT NOT NULL,
  path        TEXT NOT NULL,                 -- relative to STORAGE_PATH
  size_bytes  INTEGER NOT NULL,
  mime        TEXT,
  original_name TEXT,
  job_id      TEXT,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_sha256 ON files(sha256);
CREATE INDEX IF NOT EXISTS idx_files_expires ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_files_job ON files(job_id);

-- Schema version sentinel
CREATE TABLE IF NOT EXISTS _meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO _meta (key, value) VALUES ('schema_version', '1');
