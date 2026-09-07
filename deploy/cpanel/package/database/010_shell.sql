CREATE TABLE IF NOT EXISTS currency_rates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  currency_id INT UNSIGNED NOT NULL,
  rate DECIMAL(18,4) NOT NULL,
  rate_date DATE NOT NULL,
  recorded_by_user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX currency_rates_currency_date_idx (currency_id, rate_date),
  CONSTRAINT currency_rates_currency_fk FOREIGN KEY (currency_id) REFERENCES currencies(id),
  CONSTRAINT currency_rates_user_fk FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_favorites (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  path VARCHAR(500) NOT NULL,
  title VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_favorites_user_path_uidx (user_id, path),
  INDEX user_favorites_user_order_idx (user_id, sort_order),
  CONSTRAINT user_favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;