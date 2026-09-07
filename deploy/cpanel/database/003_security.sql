-- Security foundation for authenticated cPanel API access.
SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_count INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS last_failed_login_at DATETIME(3) NULL;

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  succeeded TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at DATETIME(3) NOT NULL,
  KEY auth_login_attempts_lookup (username, ip_address, attempted_at),
  KEY auth_login_attempts_cleanup (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(64) NOT NULL,
  resource VARCHAR(64) NULL,
  resource_id INT UNSIGNED NULL,
  ip_address VARCHAR(45) NOT NULL,
  metadata JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  KEY audit_log_user_created (user_id, created_at),
  KEY audit_log_resource_created (resource, resource_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;