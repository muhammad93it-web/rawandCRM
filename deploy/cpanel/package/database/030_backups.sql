CREATE TABLE IF NOT EXISTS backup_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  frequency ENUM('daily','weekly','monthly','custom') NOT NULL DEFAULT 'daily',
  local_time CHAR(5) NOT NULL DEFAULT '02:00',
  day_of_week TINYINT UNSIGNED NULL,
  day_of_month TINYINT UNSIGNED NULL,
  custom_cron VARCHAR(100) NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Baghdad',
  retention_count SMALLINT UNSIGNED NOT NULL DEFAULT 14,
  telegram_bot_token_encrypted TEXT NULL,
  telegram_chat_id VARCHAR(100) NULL,
  telegram_daily_report_enabled TINYINT(1) NOT NULL DEFAULT 0,
  telegram_daily_report_times JSON NULL,
  telegram_monthly_report_enabled TINYINT(1) NOT NULL DEFAULT 0,
  telegram_attach_backup TINYINT(1) NOT NULL DEFAULT 1,
  telegram_backup_send_times JSON NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT backup_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backup_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('manual','scheduled','pre_restore') NOT NULL,
  status ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  scheduled_for DATETIME(3) NULL,
  requested_by BIGINT UNSIGNED NULL,
  archive_path VARCHAR(1024) NULL,
  checksum_sha256 CHAR(64) NULL,
  archive_bytes BIGINT UNSIGNED NULL,
  encryption JSON NULL,
  error VARCHAR(1000) NULL,
  started_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY backup_jobs_scheduled_uidx (scheduled_for),
  KEY backup_jobs_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS telegram_delivery_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  backup_job_id BIGINT UNSIGNED NOT NULL,
  attempt TINYINT UNSIGNED NOT NULL,
  status ENUM('sending','sent','retrying','failed','unconfigured') NOT NULL,
  error VARCHAR(1000) NULL,
  telegram_message_id VARCHAR(100) NULL,
  attempted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  next_retry_at DATETIME(3) NULL,
  UNIQUE KEY telegram_delivery_job_attempt_uidx (backup_job_id, attempt),
  CONSTRAINT telegram_delivery_backup_fk FOREIGN KEY (backup_job_id) REFERENCES backup_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_locks (
  name VARCHAR(100) NOT NULL PRIMARY KEY,
  owner CHAR(36) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  acquired_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO backup_settings (id) VALUES (1);

-- Additive upgrade statements for installations that already have 030_backups.sql.
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_bot_token_encrypted TEXT NULL;
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100) NULL;
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_daily_report_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_daily_report_times JSON NULL;
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_monthly_report_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_attach_backup TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS telegram_backup_send_times JSON NULL;
UPDATE backup_settings SET telegram_daily_report_times = JSON_ARRAY() WHERE telegram_daily_report_times IS NULL;
UPDATE backup_settings SET telegram_backup_send_times = JSON_ARRAY() WHERE telegram_backup_send_times IS NULL;