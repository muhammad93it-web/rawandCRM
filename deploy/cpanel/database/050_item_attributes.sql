-- Preserve the extra Kamal-style item form details without widening the core
-- inventory columns. Existing rows remain valid and serialize as an empty object.
SET NAMES utf8mb4;
ALTER TABLE items ADD COLUMN IF NOT EXISTS attributes JSON NULL AFTER unit;