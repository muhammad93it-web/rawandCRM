-- Seed the confirmed default USD currency while preserving any saved rate.
INSERT INTO currencies (code, name, rate, decimals, symbol, status)
VALUES ('USD', 'dolar', 1560, 2, '$', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  symbol = VALUES(symbol),
  status = VALUES(status);