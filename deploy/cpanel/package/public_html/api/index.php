<?php

declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$origin = (string)app_config('app.allowed_origin', '');
if ($origin !== '') {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = preg_replace('#^/api#', '', $requestPath) ?: '/';
$path = rtrim($path, '/') ?: '/';

try {
    dispatch($method, $path);
} catch (PDOException $error) {
    error_log('[rawand-cpanel] database error: ' . $error->getMessage());
    error_response('A database error prevented this request from completing.', 500, 'database_error');
} catch (Throwable $error) {
    error_log('[rawand-cpanel] application error: ' . $error->getMessage());
    error_response('The request could not be completed.', 500, 'internal_error');
}

function dispatch(string $method, string $path): never
{
    if ($method === 'GET' && $path === '/healthz') {
        json_response(['status' => 'ok']);
    }
    if ($method === 'GET' && $path === '/accounts') {
        list_accounts();
    }
    if ($method === 'POST' && $path === '/accounts') {
        create_account();
    }
    if ($method === 'GET' && preg_match('#^/accounts/([1-9][0-9]*)$#', $path, $match)) {
        get_account((int)$match[1]);
    }
    if ($method === 'PATCH' && preg_match('#^/accounts/([1-9][0-9]*)$#', $path, $match)) {
        update_account((int)$match[1]);
    }
    if ($method === 'DELETE' && preg_match('#^/accounts/([1-9][0-9]*)$#', $path, $match)) {
        delete_account((int)$match[1]);
    }
    if ($method === 'GET' && $path === '/items') {
        list_items();
    }
    if ($method === 'POST' && $path === '/items') {
        create_item();
    }
    if ($method === 'GET' && preg_match('#^/items/([1-9][0-9]*)$#', $path, $match)) {
        get_item((int)$match[1]);
    }
    if ($method === 'GET' && $path === '/inventory/low-stock') {
        list_low_stock();
    }
    if ($method === 'PATCH' && preg_match('#^/items/([1-9][0-9]*)$#', $path, $match)) {
        update_item((int)$match[1]);
    }
    if ($method === 'DELETE' && preg_match('#^/items/([1-9][0-9]*)$#', $path, $match)) {
        delete_item((int)$match[1]);
    }
    if ($method === 'GET' && $path === '/transactions') {
        list_transactions();
    }
    if ($method === 'POST' && $path === '/transactions') {
        create_transaction();
    }
    if ($method === 'GET' && $path === '/sales') {
        list_invoices('sale');
    }
    if ($method === 'GET' && $path === '/purchases') {
        list_invoices('purchase');
    }
    if ($method === 'POST' && $path === '/sales') {
        create_invoice('sale');
    }
    if ($method === 'POST' && $path === '/purchases') {
        create_invoice('purchase');
    }
    if ($method === 'GET' && $path === '/dashboard/summary') {
        dashboard_summary();
    }
    if ($method === 'GET' && $path === '/activity') {
        activity();
    }

    if ($path === '/') {
        error_response('Use the web application or an /api endpoint.', 404);
    }
    if (generic_dispatch($method, $path)) {
        exit;
    }
    unsupported_response();
}

function account_row(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'type' => $row['type'],
        'phone' => $row['phone'],
        'city' => $row['city'],
        'balance' => row_number($row['balance']),
        'currency' => $row['currency'],
        'status' => $row['status'],
        'createdAt' => iso_timestamp($row['created_at']),
    ];
}

function item_row(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'barcode' => $row['barcode'],
        'category' => $row['category'],
        'brand' => $row['brand'],
        'quantity' => row_number($row['quantity']),
        'reorderLevel' => row_number($row['reorder_level']),
        'purchasePrice' => row_number($row['purchase_price']),
        'salePrice' => row_number($row['sale_price']),
        'unit' => $row['unit'],
        'status' => $row['status'],
        'createdAt' => iso_timestamp($row['created_at']),
    ];
}

function list_accounts(): never
{
    $sql = 'SELECT * FROM accounts WHERE deleted_at IS NULL';
    $params = [];
    if (($type = request_query('type')) !== null && $type !== '') {
        if (!in_array($type, ['customer', 'supplier', 'other'], true)) {
            error_response('Invalid account type.', 400);
        }
        $sql .= ' AND type = :type';
        $params['type'] = $type;
    }
    if (($search = trim((string)request_query('search', ''))) !== '') {
        $sql .= ' AND (name LIKE :search OR phone LIKE :search OR city LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }
    $sql .= ' ORDER BY name ASC';
    $statement = db()->prepare($sql);
    $statement->execute($params);
    json_response(array_map('account_row', $statement->fetchAll()));
}

function get_account(int $id): never
{
    $statement = db()->prepare('SELECT * FROM accounts WHERE id = :id AND deleted_at IS NULL');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    if (!$row) {
        error_response('Account not found.', 404);
    }
    json_response(account_row($row));
}

function create_account(): never
{
    $body = json_body();
    $name = required_string($body, 'name');
    $type = $body['type'] ?? null;
    if (!in_array($type, ['customer', 'supplier', 'other'], true)) {
        error_response('Invalid account type.', 400);
    }
    $phone = (string)($body['phone'] ?? '');
    $city = (string)($body['city'] ?? '');
    $balance = number_value($body['balance'] ?? null, 'balance');
    $currency = required_string($body, 'currency');

    $statement = db()->prepare(
        'INSERT INTO accounts (name, type, phone, city, balance, currency, status)
         VALUES (:name, :type, :phone, :city, :balance, :currency, "active")',
    );
    $statement->execute(compact('name', 'type', 'phone', 'city', 'balance', 'currency'));
    get_account((int)db()->lastInsertId());
}

function update_account(int $id): never
{
    $body = json_body();
    $allowed = ['name', 'type', 'phone', 'city', 'balance', 'currency', 'status'];
    $sets = [];
    $params = ['id' => $id];
    foreach ($allowed as $key) {
        if (!array_key_exists($key, $body)) {
            continue;
        }
        if ($key === 'name' || $key === 'currency') {
            $value = required_string($body, $key);
        } elseif ($key === 'type' && !in_array($body[$key], ['customer', 'supplier', 'other'], true)) {
            error_response('Invalid account type.', 400);
        } elseif ($key === 'status' && !in_array($body[$key], ['active', 'inactive'], true)) {
            error_response('Invalid account status.', 400);
        } elseif ($key === 'balance') {
            $value = number_value($body[$key], $key);
        } else {
            $value = (string)$body[$key];
        }
        $sets[] = "`{$key}` = :{$key}";
        $params[$key] = $value;
    }
    if ($sets === []) {
        error_response('At least one field is required.', 400);
    }
    $sets[] = 'updated_at = UTC_TIMESTAMP(3)';
    $statement = db()->prepare('UPDATE accounts SET ' . implode(', ', $sets) . ' WHERE id = :id AND deleted_at IS NULL');
    $statement->execute($params);
    if ($statement->rowCount() < 1) {
        get_account($id);
    }
    get_account($id);
}

function delete_account(int $id): never
{
    $statement = db()->prepare(
        'UPDATE accounts SET deleted_at = UTC_TIMESTAMP(3), deleted_by_app = 1, status = "inactive"
         WHERE id = :id AND deleted_at IS NULL',
    );
    $statement->execute(['id' => $id]);
    if ($statement->rowCount() < 1) {
        error_response('Account not found.', 404);
    }
    http_response_code(204);
    exit;
}

function list_items(): never
{
    $sql = 'SELECT * FROM items WHERE deleted_at IS NULL';
    $params = [];
    if (($search = trim((string)request_query('search', ''))) !== '') {
        $sql .= ' AND (name LIKE :search OR barcode LIKE :search OR category LIKE :search OR brand LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }
    if (filter_var(request_query('lowStock', false), FILTER_VALIDATE_BOOLEAN)) {
        $sql .= ' AND quantity <= reorder_level';
    }
    $sql .= ' ORDER BY name ASC';
    $statement = db()->prepare($sql);
    $statement->execute($params);
    json_response(array_map('item_row', $statement->fetchAll()));
}

function list_low_stock(): never
{
    $statement = db()->query(
        'SELECT * FROM items
         WHERE deleted_at IS NULL AND status = "active" AND quantity <= reorder_level
         ORDER BY quantity ASC',
    );
    json_response(array_map('item_row', $statement->fetchAll()));
}

function create_item(): never
{
    $body = json_body();
    $name = required_string($body, 'name');
    $barcode = (string)($body['barcode'] ?? '');
    $category = (string)($body['category'] ?? '');
    $brand = (string)($body['brand'] ?? '');
    $quantity = number_value($body['quantity'] ?? null, 'quantity');
    $reorderLevel = number_value($body['reorderLevel'] ?? null, 'reorderLevel', true);
    $purchasePrice = number_value($body['purchasePrice'] ?? null, 'purchasePrice', true);
    $salePrice = number_value($body['salePrice'] ?? null, 'salePrice', true);
    $unit = required_string($body, 'unit');

    $statement = db()->prepare(
        'INSERT INTO items
         (name, barcode, category, brand, quantity, reorder_level, purchase_price, sale_price, unit, status)
         VALUES (:name, :barcode, :category, :brand, :quantity, :reorder_level, :purchase_price, :sale_price, :unit, "active")',
    );
    $statement->execute([
        'name' => $name,
        'barcode' => $barcode,
        'category' => $category,
        'brand' => $brand,
        'quantity' => $quantity,
        'reorder_level' => $reorderLevel,
        'purchase_price' => $purchasePrice,
        'sale_price' => $salePrice,
        'unit' => $unit,
    ]);
    get_item((int)db()->lastInsertId());
}

function get_item(int $id): never
{
    $statement = db()->prepare('SELECT * FROM items WHERE id = :id AND deleted_at IS NULL');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    if (!$row) {
        error_response('Item not found.', 404);
    }
    json_response(item_row($row));
}

function update_item(int $id): never
{
    $body = json_body();
    $columns = [
        'name' => 'string',
        'barcode' => 'string',
        'category' => 'string',
        'brand' => 'string',
        'quantity' => 'number',
        'reorderLevel' => 'number',
        'purchasePrice' => 'number',
        'salePrice' => 'number',
        'unit' => 'string',
        'status' => 'status',
    ];
    $sets = [];
    $params = ['id' => $id];
    $map = [
        'reorderLevel' => 'reorder_level',
        'purchasePrice' => 'purchase_price',
        'salePrice' => 'sale_price',
    ];
    foreach ($columns as $key => $kind) {
        if (!array_key_exists($key, $body)) {
            continue;
        }
        if ($kind === 'string') {
            $value = (string)$body[$key];
        } elseif ($kind === 'number') {
            $value = number_value($body[$key], $key, $key !== 'quantity');
        } elseif ($kind === 'status' && in_array($body[$key], ['active', 'inactive'], true)) {
            $value = $body[$key];
        } else {
            error_response("Invalid {$key}.", 400);
        }
        $column = $map[$key] ?? $key;
        $sets[] = "`{$column}` = :{$key}";
        $params[$key] = $value;
    }
    if ($sets === []) {
        error_response('At least one field is required.', 400);
    }
    $sets[] = 'updated_at = UTC_TIMESTAMP(3)';
    $statement = db()->prepare('UPDATE items SET ' . implode(', ', $sets) . ' WHERE id = :id AND deleted_at IS NULL');
    $statement->execute($params);
    get_item($id);
}

function delete_item(int $id): never
{
    $statement = db()->prepare(
        'UPDATE items SET deleted_at = UTC_TIMESTAMP(3), deleted_by_app = 1, status = "inactive"
         WHERE id = :id AND deleted_at IS NULL',
    );
    $statement->execute(['id' => $id]);
    if ($statement->rowCount() < 1) {
        error_response('Item not found.', 404);
    }
    http_response_code(204);
    exit;
}

function transaction_row(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'type' => $row['type'],
        'date' => $row['date'],
        'category' => $row['category'],
        'description' => $row['description'],
        'accountName' => $row['account_name'],
        'amount' => row_number($row['amount']),
        'currency' => $row['currency'],
        'status' => $row['status'],
    ];
}

function list_transactions(): never
{
    $sql = 'SELECT * FROM transactions';
    $params = [];
    if (($type = request_query('type')) !== null && $type !== '') {
        if (!in_array($type, ['income', 'expense'], true)) {
            error_response('Invalid transaction type.', 400);
        }
        $sql .= ' WHERE type = :type';
        $params['type'] = $type;
    }
    $sql .= ' ORDER BY date DESC, id DESC';
    $statement = db()->prepare($sql);
    $statement->execute($params);
    json_response(array_map('transaction_row', $statement->fetchAll()));
}

function create_transaction(): never
{
    $body = json_body();
    $type = $body['type'] ?? null;
    if (!in_array($type, ['income', 'expense'], true)) {
        error_response('Invalid transaction type.', 400);
    }
    $date = date_value($body['date'] ?? null, 'date');
    $category = (string)($body['category'] ?? '');
    $description = (string)($body['description'] ?? '');
    $accountName = (string)($body['accountName'] ?? '');
    $amount = number_value($body['amount'] ?? null, 'amount', true);
    $currency = required_string($body, 'currency');
    $statement = db()->prepare(
        'INSERT INTO transactions
         (type, date, category, description, account_name, amount, currency, status)
         VALUES (:type, :date, :category, :description, :account_name, :amount, :currency, "posted")',
    );
    $statement->execute(compact('type', 'date', 'category', 'description', 'accountName', 'amount', 'currency'));
    $id = (int)db()->lastInsertId();
    $read = db()->prepare('SELECT * FROM transactions WHERE id = :id');
    $read->execute(['id' => $id]);
    json_response(transaction_row($read->fetch()), 201);
}

function invoice_row(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'number' => $row['number'],
        'type' => $row['type'],
        'accountName' => $row['account_name'],
        'date' => $row['date'],
        'total' => row_number($row['total']),
        'currency' => $row['currency'],
        'paymentType' => $row['payment_type'],
        'paidAmount' => row_number($row['paid_amount']),
        'status' => $row['status'],
        'itemsCount' => (int)$row['items_count'],
    ];
}

function list_invoices(string $type): never
{
    $statement = db()->prepare(
        'SELECT i.*, a.name AS account_name,
                (SELECT COUNT(*) FROM invoice_lines l WHERE l.invoice_id = i.id) AS items_count
         FROM invoices i
         INNER JOIN accounts a ON a.id = i.account_id
         WHERE i.type = :type
         ORDER BY i.date DESC, i.id DESC',
    );
    $statement->execute(['type' => $type]);
    json_response(array_map('invoice_row', $statement->fetchAll()));
}

function create_invoice(string $type): never
{
    $body = json_body();
    $accountId = integer_value($body['accountId'] ?? null, 'accountId');
    $date = date_value($body['date'] ?? null, 'date');
    $currency = required_string($body, 'currency');
    $paymentType = $body['paymentType'] ?? null;
    if (!in_array($paymentType, ['cash', 'credit'], true)) {
        error_response('Invalid payment type.', 400);
    }
    $lines = $body['lines'] ?? null;
    if (!is_array($lines) || count($lines) < 1) {
        error_response('At least one invoice line is required.', 400);
    }
    $discount = number_value($body['discount'] ?? 0, 'discount', true);
    $tax = number_value($body['tax'] ?? 0, 'tax', true);
    $notes = (string)($body['notes'] ?? '');
    $paidAmountProvided = array_key_exists('paidAmount', $body);
    $paidAmount = number_value($body['paidAmount'] ?? 0, 'paidAmount', true);
    $pdo = db();

    try {
        $pdo->beginTransaction();
        $accountStatement = $pdo->prepare('SELECT * FROM accounts WHERE id = :id AND deleted_at IS NULL FOR UPDATE');
        $accountStatement->execute(['id' => $accountId]);
        $account = $accountStatement->fetch();
        if (!$account) {
            throw new DomainException('Account not found.');
        }

        $prepared = [];
        $totalBeforeAdjustments = 0.0;
        foreach ($lines as $line) {
            if (!is_array($line)) {
                throw new DomainException('Invoice lines are invalid.');
            }
            $itemId = integer_value($line['itemId'] ?? null, 'itemId');
            $quantity = number_value($line['quantity'] ?? null, 'quantity', true);
            if ($quantity <= 0) {
                throw new DomainException('Invoice quantity must be greater than zero.');
            }
            $unitPrice = number_value($line['unitPrice'] ?? null, 'unitPrice', true);
            $lineDiscount = number_value($line['discount'] ?? 0, 'discount', true);
            $itemStatement = $pdo->prepare('SELECT * FROM items WHERE id = :id AND deleted_at IS NULL FOR UPDATE');
            $itemStatement->execute(['id' => $itemId]);
            $item = $itemStatement->fetch();
            if (!$item) {
                throw new DomainException('Item not found.');
            }
            if ($type === 'sale' && (float)$item['quantity'] < $quantity) {
                throw new DomainException('Insufficient stock.');
            }
            $lineTotal = max(0.0, $quantity * $unitPrice - $lineDiscount);
            $totalBeforeAdjustments += $lineTotal;
            $prepared[] = compact('itemId', 'quantity', 'unitPrice', 'lineDiscount', 'lineTotal');
        }
        $total = max(0.0, $totalBeforeAdjustments - $discount + $tax);
        $paidAmount = $paymentType === 'cash' && !$paidAmountProvided ? $total : $paidAmount;
        if ($paidAmount > $total) {
            throw new DomainException('Paid amount cannot exceed invoice total.');
        }
        $prefix = $type === 'sale' ? 'SAL' : 'PUR';
        $number = $prefix . '-' . gmdate('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $invoiceStatement = $pdo->prepare(
            'INSERT INTO invoices
             (number, type, account_id, date, total, currency, payment_type, status, notes, discount, tax, paid_amount)
             VALUES (:number, :type, :account_id, :date, :total, :currency, :payment_type, "completed", :notes, :discount, :tax, :paid_amount)',
        );
        $invoiceStatement->execute([
            'number' => $number,
            'type' => $type,
            'account_id' => $accountId,
            'date' => $date,
            'total' => $total,
            'currency' => $currency,
            'payment_type' => $paymentType,
            'notes' => $notes,
            'discount' => $discount,
            'tax' => $tax,
            'paid_amount' => $paidAmount,
        ]);
        $invoiceId = (int)$pdo->lastInsertId();
        $lineStatement = $pdo->prepare(
            'INSERT INTO invoice_lines
             (invoice_id, item_id, quantity, unit_price, discount, line_total)
             VALUES (:invoice_id, :item_id, :quantity, :unit_price, :discount, :line_total)',
        );
        $updateItem = $pdo->prepare(
            'UPDATE items SET quantity = quantity ' . ($type === 'sale' ? '-' : '+') . ' :quantity, updated_at = UTC_TIMESTAMP(3)
             WHERE id = :id',
        );
        foreach ($prepared as $line) {
            $lineStatement->execute([
                'invoice_id' => $invoiceId,
                'item_id' => $line['itemId'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unitPrice'],
                'discount' => $line['lineDiscount'],
                'line_total' => $line['lineTotal'],
            ]);
            $updateItem->execute(['quantity' => $line['quantity'], 'id' => $line['itemId']]);
        }
        $outstanding = $total - $paidAmount;
        if ($outstanding > 0) {
            $balanceUpdate = $type === 'sale' ? 'balance + :outstanding' : 'balance - :outstanding';
            $balanceStatement = $pdo->prepare("UPDATE accounts SET balance = {$balanceUpdate}, updated_at = UTC_TIMESTAMP(3) WHERE id = :id");
            $balanceStatement->execute(['outstanding' => $outstanding, 'id' => $accountId]);
        }
        $pdo->commit();
        json_response([
            'id' => $invoiceId,
            'number' => $number,
            'type' => $type,
            'accountName' => $account['name'],
            'date' => $date,
            'total' => row_number($total),
            'currency' => $currency,
            'paymentType' => $paymentType,
            'paidAmount' => row_number($paidAmount),
            'status' => 'completed',
            'itemsCount' => count($prepared),
        ], 201);
    } catch (DomainException $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_response($error->getMessage(), 400);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function dashboard_summary(): never
{
    $pdo = db();
    $accounts = $pdo->query('SELECT type, balance FROM accounts WHERE deleted_at IS NULL')->fetchAll();
    $items = $pdo->query('SELECT name, quantity, reorder_level, id FROM items WHERE deleted_at IS NULL')->fetchAll();
    $today = gmdate('Y-m-d');
    $todayStatement = $pdo->prepare(
        'SELECT type, COALESCE(SUM(total), 0) AS amount FROM invoices WHERE date = :date GROUP BY type',
    );
    $todayStatement->execute(['date' => $today]);
    $todayTotals = ['sale' => 0.0, 'purchase' => 0.0];
    foreach ($todayStatement->fetchAll() as $row) {
        $todayTotals[$row['type']] = (float)$row['amount'];
    }

    $monthInvoices = $pdo->query('SELECT type, date, total FROM invoices ORDER BY date ASC')->fetchAll();
    $monthLabels = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
    $revenueSeries = [];
    $cursor = new DateTimeImmutable('first day of this month', new DateTimeZone('UTC'));
    for ($offset = 5; $offset >= 0; $offset--) {
        $month = $cursor->modify("-{$offset} months");
        $key = $month->format('Y-m');
        $sales = 0.0;
        $purchases = 0.0;
        foreach ($monthInvoices as $invoice) {
            if (str_starts_with($invoice['date'], $key)) {
                if ($invoice['type'] === 'sale') {
                    $sales += (float)$invoice['total'];
                } else {
                    $purchases += (float)$invoice['total'];
                }
            }
        }
        $revenueSeries[] = ['label' => $monthLabels[(int)$month->format('n') - 1], 'sales' => row_number($sales), 'purchases' => row_number($purchases)];
    }

    $topStatement = $pdo->query(
        'SELECT i.name, SUM(l.quantity) AS quantity, SUM(l.line_total) AS revenue
         FROM invoice_lines l
         INNER JOIN invoices inv ON inv.id = l.invoice_id AND inv.type = "sale"
         INNER JOIN items i ON i.id = l.item_id
         GROUP BY i.id, i.name
         ORDER BY revenue DESC
         LIMIT 5',
    );
    $topItems = array_map(
        fn(array $row): array => ['name' => $row['name'], 'quantity' => row_number($row['quantity']), 'revenue' => row_number($row['revenue'])],
        $topStatement->fetchAll(),
    );
    $receivables = 0.0;
    $payables = 0.0;
    foreach ($accounts as $account) {
        if ((float)$account['balance'] > 0) {
            $receivables += (float)$account['balance'];
        } elseif ((float)$account['balance'] < 0) {
            $payables += abs((float)$account['balance']);
        }
    }
    json_response([
        'salesToday' => row_number($todayTotals['sale']),
        'purchasesToday' => row_number($todayTotals['purchase']),
        'receivables' => row_number($receivables),
        'payables' => row_number($payables),
        'itemsCount' => count($items),
        'lowStockCount' => count(array_filter($items, fn(array $item): bool => (float)$item['quantity'] <= (float)$item['reorder_level'])),
        'customersCount' => count(array_filter($accounts, fn(array $account): bool => $account['type'] === 'customer')),
        'revenueSeries' => $revenueSeries,
        'topItems' => $topItems,
    ]);
}

function activity(): never
{
    $limit = max(1, min(50, (int)request_query('limit', 8)));
    $pdo = db();
    $invoiceStatement = $pdo->prepare(
        'SELECT i.id, i.type, i.number, i.total AS amount, i.currency, i.created_at, a.name AS account_name
         FROM invoices i INNER JOIN accounts a ON a.id = i.account_id
         ORDER BY i.created_at DESC LIMIT :limit',
    );
    $invoiceStatement->bindValue('limit', $limit, PDO::PARAM_INT);
    $invoiceStatement->execute();
    $transactionStatement = $pdo->prepare(
        'SELECT id, type, description, amount, currency, created_at
         FROM transactions ORDER BY created_at DESC LIMIT :limit',
    );
    $transactionStatement->bindValue('limit', $limit, PDO::PARAM_INT);
    $transactionStatement->execute();
    $activity = [];
    foreach ($invoiceStatement->fetchAll() as $invoice) {
        $activity[] = [
            'id' => (int)$invoice['id'] * 10,
            'kind' => $invoice['type'],
            'title' => $invoice['type'] === 'sale' ? 'پسووڵەی فرۆشتن' : 'پسووڵەی کڕین',
            'description' => $invoice['number'] . ' · ' . $invoice['account_name'],
            'amount' => row_number($invoice['amount']),
            'currency' => $invoice['currency'],
            'createdAt' => iso_timestamp($invoice['created_at']),
        ];
    }
    foreach ($transactionStatement->fetchAll() as $transaction) {
        $activity[] = [
            'id' => (int)$transaction['id'] * 10 + 1,
            'kind' => $transaction['type'],
            'title' => $transaction['type'] === 'income' ? 'داهاتی نوێ' : 'خەرجی نوێ',
            'description' => $transaction['description'],
            'amount' => row_number($transaction['amount']),
            'currency' => $transaction['currency'],
            'createdAt' => iso_timestamp($transaction['created_at']),
        ];
    }
    usort($activity, fn(array $left, array $right): int => strcmp($right['createdAt'], $left['createdAt']));
    json_response(array_slice($activity, 0, $limit));
}