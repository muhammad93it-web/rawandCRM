<?php
/**
 * Shared posting helpers — PHP mirror of artifacts/api-server/src/lib/posting.ts.
 * The only code that may change warehouse_stock quantities or account_ledger_entries.
 * Call these inside the transaction that persists the document (db()->beginTransaction()).
 *
 * Sign conventions (identical to the Node version):
 *  - Stock: quantity is positive, $direction is 'in' or 'out'; balance may not go negative unless
 *    $allowNegative is true.
 *  - Ledger: debit = the account owes us more, credit = it owes us less; balance = Σdebit − Σcredit.
 */

final class InsufficientStockException extends RuntimeException
{
    public function __construct(public readonly int $itemId, public readonly int $warehouseId, public readonly float $available, public readonly float $requested)
    {
        parent::__construct("Insufficient stock for item {$itemId} in warehouse {$warehouseId}: {$available} available, {$requested} requested");
    }
}

/**
 * @param array{warehouseId:int,itemId:int,direction:'in'|'out',quantity:float,date:string,referenceType:string,referenceId:int,note?:string,movementType?:string,allowNegative?:bool} $p
 */
function posting_post_stock(array $p): void
{
    $quantity = (float)$p['quantity'];
    if ($quantity <= 0) {
        throw new InvalidArgumentException('Stock posting quantity must be positive');
    }
    $signed = $p['direction'] === 'in' ? $quantity : -$quantity;
    $pdo = db();
    $stmt = $pdo->prepare('SELECT quantity FROM warehouse_stock WHERE warehouse_id = ? AND item_id = ? FOR UPDATE');
    $stmt->execute([(int)$p['warehouseId'], (int)$p['itemId']]);
    $current = $stmt->fetchColumn();
    $available = $current === false ? 0.0 : (float)$current;
    if (empty($p['allowNegative']) && $available + $signed < 0) {
        throw new InsufficientStockException((int)$p['itemId'], (int)$p['warehouseId'], $available, $quantity);
    }
    $pdo->prepare('INSERT INTO stock_movements (warehouse_id, item_id, movement_date, type, quantity, reference_type, reference_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([
            (int)$p['warehouseId'],
            (int)$p['itemId'],
            $p['date'],
            $p['movementType'] ?? $p['direction'],
            $signed,
            $p['referenceType'],
            (int)$p['referenceId'],
            (string)($p['note'] ?? ''),
        ]);
    $pdo->prepare('INSERT INTO warehouse_stock (warehouse_id, item_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = CURRENT_TIMESTAMP(3)')
        ->execute([(int)$p['warehouseId'], (int)$p['itemId'], $signed]);
}

function posting_reverse_stock(string $referenceType, int $referenceId): void
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT warehouse_id, item_id, quantity FROM stock_movements WHERE reference_type = ? AND reference_id = ?');
    $stmt->execute([$referenceType, $referenceId]);
    $update = $pdo->prepare('UPDATE warehouse_stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP(3) WHERE warehouse_id = ? AND item_id = ?');
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $movement) {
        $update->execute([(float)$movement['quantity'], (int)$movement['warehouse_id'], (int)$movement['item_id']]);
    }
    $pdo->prepare('DELETE FROM stock_movements WHERE reference_type = ? AND reference_id = ?')->execute([$referenceType, $referenceId]);
}

function posting_item_stock(int $warehouseId, int $itemId): float
{
    $stmt = db()->prepare('SELECT quantity FROM warehouse_stock WHERE warehouse_id = ? AND item_id = ?');
    $stmt->execute([$warehouseId, $itemId]);
    $value = $stmt->fetchColumn();
    return $value === false ? 0.0 : (float)$value;
}

/**
 * @param array{accountId:int,date:string,referenceType:string,referenceId:int,debit?:float,credit?:float,currency:string,description?:string} $p
 */
function posting_post_ledger(array $p): void
{
    $debit = (float)($p['debit'] ?? 0);
    $credit = (float)($p['credit'] ?? 0);
    if ($debit < 0 || $credit < 0 || ($debit == 0 && $credit == 0)) {
        throw new InvalidArgumentException('Ledger posting needs a positive debit or credit');
    }
    db()->prepare('INSERT INTO account_ledger_entries (account_id, entry_date, reference_type, reference_id, debit, credit, currency, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([(int)$p['accountId'], $p['date'], $p['referenceType'], (int)$p['referenceId'], $debit, $credit, $p['currency'], (string)($p['description'] ?? '')]);
}

function posting_remove_ledger(string $referenceType, int $referenceId): void
{
    db()->prepare('DELETE FROM account_ledger_entries WHERE reference_type = ? AND reference_id = ?')->execute([$referenceType, $referenceId]);
}

/** @return list<array{currency:string,debit:float,credit:float,balance:float}> */
function posting_account_balances(int $accountId): array
{
    $stmt = db()->prepare('SELECT currency, COALESCE(SUM(debit), 0) AS debit, COALESCE(SUM(credit), 0) AS credit FROM account_ledger_entries WHERE account_id = ? GROUP BY currency');
    $stmt->execute([$accountId]);
    $result = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $debit = (float)$row['debit'];
        $credit = (float)$row['credit'];
        $result[] = ['currency' => (string)$row['currency'], 'debit' => $debit, 'credit' => $credit, 'balance' => $debit - $credit];
    }
    return $result;
}

function posting_account_balance(int $accountId, string $currency): float
{
    foreach (posting_account_balances($accountId) as $balance) {
        if ($balance['currency'] === $currency) {
            return $balance['balance'];
        }
    }
    return 0.0;
}
