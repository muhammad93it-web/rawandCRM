-- Normalize an existing USD currency without replacing its saved rate.
UPDATE currencies
SET name = 'dolar', symbol = '$', status = 'active'
WHERE UPPER(code) = 'USD';

-- Seed the confirmed default only when no USD currency exists.
INSERT INTO currencies (code, name, rate, decimals, symbol, status)
SELECT 'USD', 'dolar', 1560, 2, '$', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM currencies WHERE UPPER(code) = 'USD'
);