-- PostgreSQL: additive backup/Telegram administration settings.
-- Creates missing tables and extends existing installations without data loss.
BEGIN;

CREATE TABLE IF NOT EXISTS backup_settings (
  id serial PRIMARY KEY CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  local_time text NOT NULL DEFAULT '02:00',
  day_of_week integer,
  day_of_month integer,
  custom_cron text,
  timezone text NOT NULL DEFAULT 'Asia/Baghdad',
  retention_count integer NOT NULL DEFAULT 14 CHECK (retention_count BETWEEN 1 AND 365),
  updated_by integer REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS backup_jobs (
  id serial PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('manual', 'scheduled', 'pre_restore')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  scheduled_for timestamptz UNIQUE,
  requested_by integer REFERENCES users(id),
  archive_path text, checksum_sha256 text, archive_bytes bigint, encryption jsonb, error text,
  started_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS backup_jobs_created_idx ON backup_jobs(created_at);
CREATE TABLE IF NOT EXISTS telegram_delivery_attempts (
  id serial PRIMARY KEY, backup_job_id integer NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
  attempt integer NOT NULL, status text NOT NULL CHECK (status IN ('sending', 'sent', 'retrying', 'failed', 'unconfigured')),
  error text, telegram_message_id text, attempted_at timestamptz NOT NULL DEFAULT now(), next_retry_at timestamptz,
  UNIQUE (backup_job_id, attempt)
);
CREATE TABLE IF NOT EXISTS maintenance_locks (
  name text PRIMARY KEY, owner text NOT NULL, reason text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
INSERT INTO backup_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE backup_settings
  ADD COLUMN IF NOT EXISTS telegram_bot_token_encrypted text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS telegram_daily_report_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_daily_report_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS telegram_monthly_report_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_attach_backup boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_backup_send_times jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;