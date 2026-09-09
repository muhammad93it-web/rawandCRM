-- First cPanel migration slice. This file intentionally contains no seed data.
-- Import it into the cPanel MariaDB database before uploading the application.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS accounts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  phone VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(255) NOT NULL DEFAULT '',
  balance DECIMAL(16,2) NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'IQD',
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  deleted_at DATETIME(3) NULL,
  deleted_by_app TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY accounts_name_idx (name),
  KEY accounts_type_idx (type),
  KEY accounts_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL DEFAULT 'گشتی',
  brand VARCHAR(255) NOT NULL DEFAULT '',
  quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(14,2) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(16,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(16,2) NOT NULL DEFAULT 0,
  unit VARCHAR(64) NOT NULL DEFAULT 'دانە',
  attributes JSON NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  deleted_at DATETIME(3) NULL,
  deleted_by_app TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY items_barcode_uidx (barcode),
  KEY items_name_idx (name),
  KEY items_category_idx (category),
  KEY items_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(16) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  account_name VARCHAR(255) NOT NULL DEFAULT '',
  amount DECIMAL(16,2) NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'IQD',
  status VARCHAR(16) NOT NULL DEFAULT 'posted',
  deleted_at DATETIME(3) NULL,
  deleted_by_user_id INT UNSIGNED NULL,
  deletion_reason TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY transactions_type_date_idx (type, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  number VARCHAR(64) NOT NULL,
  type VARCHAR(16) NOT NULL,
  account_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  total DECIMAL(16,2) NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'IQD',
  payment_type VARCHAR(16) NOT NULL DEFAULT 'cash',
  status VARCHAR(16) NOT NULL DEFAULT 'completed',
  notes TEXT NOT NULL,
  discount DECIMAL(16,2) NOT NULL DEFAULT 0,
  tax DECIMAL(16,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY invoices_number_uidx (number),
  KEY invoices_type_date_idx (type, date),
  KEY invoices_account_idx (account_id),
  CONSTRAINT invoices_account_fk FOREIGN KEY (account_id) REFERENCES accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_lines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id INT UNSIGNED NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(14,2) NOT NULL,
  unit_price DECIMAL(16,2) NOT NULL,
  discount DECIMAL(16,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(16,2) NOT NULL,
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY invoice_lines_invoice_idx (invoice_id),
  KEY invoice_lines_item_idx (item_id),
  CONSTRAINT invoice_lines_invoice_fk FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
  CONSTRAINT invoice_lines_item_fk FOREIGN KEY (item_id) REFERENCES items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;