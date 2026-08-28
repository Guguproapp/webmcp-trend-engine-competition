PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS trend_topics (
  id TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  score_json TEXT NOT NULL,
  status TEXT NOT NULL,
  tier TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trend_signals (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  original_content_id TEXT NOT NULL,
  original_title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  original_url TEXT NOT NULL UNIQUE,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  report_count INTEGER,
  engagement_count INTEGER,
  growth_delta REAL,
  growth_status TEXT NOT NULL,
  taiwan_relevant INTEGER NOT NULL,
  confidence INTEGER NOT NULL,
  provider_state TEXT NOT NULL,
  heat_history_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trend_topic_signals (
  topic_id TEXT NOT NULL REFERENCES trend_topics(id) ON DELETE CASCADE,
  signal_id TEXT NOT NULL REFERENCES trend_signals(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, signal_id)
);

CREATE TABLE IF NOT EXISTS trend_snapshots (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES trend_topics(id) ON DELETE CASCADE,
  captured_at TEXT NOT NULL,
  provider_count INTEGER NOT NULL,
  signal_count INTEGER NOT NULL,
  report_count INTEGER NOT NULL,
  view_count INTEGER NOT NULL,
  like_count INTEGER NOT NULL,
  comment_count INTEGER NOT NULL,
  heat_value INTEGER NOT NULL,
  growth_rate REAL,
  UNIQUE (topic_id, captured_at)
);

CREATE TABLE IF NOT EXISTS trend_provider_runs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  state TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  completed_at TEXT,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  merged_count INTEGER NOT NULL DEFAULT 0,
  error_type TEXT,
  error_message TEXT,
  next_retry_at TEXT
);

CREATE TABLE IF NOT EXISTS trend_refresh_locks (
  lock_name TEXT PRIMARY KEY,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trend_topics_score ON trend_topics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_signals_provider ON trend_signals(provider, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_topic ON trend_snapshots(topic_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_provider_runs_provider ON trend_provider_runs(provider, attempted_at DESC);
