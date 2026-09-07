-- PostgreSQL migration: persist invoice creator attribution.
-- Safe to run repeatedly against an existing database.

BEGIN;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS created_by_user_id integer;

CREATE INDEX IF NOT EXISTS invoices_created_by_user_idx
  ON invoices (created_by_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass
      AND conname = 'invoices_created_by_user_id_users_id_fk'
  ) THEN
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_created_by_user_id_users_id_fk
      FOREIGN KEY (created_by_user_id)
      REFERENCES users (id)
      ON DELETE SET NULL;
  END IF;
END
$$;

COMMIT;