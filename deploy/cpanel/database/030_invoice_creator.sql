-- Optional invoice creator attribution for report parity. Safe to import repeatedly.
SET NAMES utf8mb4;

SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'created_by_user_id'
  ),
  'SELECT 1',
  'ALTER TABLE invoices ADD COLUMN created_by_user_id INT UNSIGNED NULL AFTER account_id'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'invoices_created_by_user_idx'
  ),
  'SELECT 1',
  'ALTER TABLE invoices ADD INDEX invoices_created_by_user_idx (created_by_user_id)'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.referential_constraints
    WHERE constraint_schema = DATABASE() AND table_name = 'invoices' AND constraint_name = 'invoices_created_by_user_fk'
  ),
  'SELECT 1',
  'ALTER TABLE invoices ADD CONSTRAINT invoices_created_by_user_fk FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;
