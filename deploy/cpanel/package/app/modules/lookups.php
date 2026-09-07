<?php
/**
 * Shared lookup tables — PHP mirror of artifacts/api-server/src/routes/lookups.ts
 * Endpoints: GET/POST /lookups/{kind}, PATCH/DELETE /lookups/{kind}/{id}
 */

function lookups_kinds(): array
{
    // kind => [table, trilingual, parentColumn|null, parentKind|null, extras[]]
    return [
        'item-types' => ['item_types', true, null, null, ['is_primary']],
        'item-subtypes' => ['item_subtypes', true, 'item_type_id', 'item-types', []],
        'item-subtypes2' => ['item_subtypes2', true, 'item_subtype_id', 'item-subtypes', []],
        'item-models' => ['item_models', true, null, null, []],
        'item-sizes' => ['item_sizes', true, null, null, []],
        'countries' => ['countries', true, null, null, []],
        'colors' => ['colors', true, null, null, []],
        'release-dates' => ['release_dates', false, null, null, []],
        'item-attributes' => ['item_attributes', true, null, null, []],
        'item-versions' => ['item_versions', true, null, null, []],
        'cities' => ['cities', false, null, null, []],
        'account-types' => ['account_types', true, null, null, []],
        'account-class1' => ['account_class1', false, null, null, []],
        'account-class2' => ['account_class2', false, 'parent_id', 'account-class1', []],
        'account-class3' => ['account_class3', false, 'parent_id', 'account-class2', []],
        'account-class4' => ['account_class4', false, 'parent_id', 'account-class3', []],
        'account-class5' => ['account_class5', false, 'parent_id', 'account-class4', []],
        'account-classes' => ['account_classes', true, null, null, ['color']],
        'ownership-types' => ['ownership_types', true, null, null, []],
        'expense-types' => ['expense_types', false, null, null, ['code']],
        'expense-subtypes' => ['expense_subtypes', false, 'expense_type_id', 'expense-types', []],
        'purchase-expense-types' => ['purchase_expense_types', false, null, null, ['on_account']],
        'income-types' => ['income_types', false, null, null, ['code']],
        'income-subtypes' => ['income_subtypes', false, 'income_type_id', 'income-types', []],
        'purchase-issue-types' => ['purchase_issue_types', true, null, null, []],
    ];
}

function lookups_row_to_item(string $kind, array $def, array $row, ?string $parentName): array
{
    [$table, $trilingual, $parentColumn] = $def;
    $name = $trilingual ? (string)($row['name_ku'] ?? '') : (string)($row['name'] ?? '');
    return [
        'id' => (int)$row['id'],
        'kind' => $kind,
        'name' => $name,
        'nameKu' => $name,
        'nameAr' => (string)($row['name_ar'] ?? ''),
        'nameEn' => (string)($row['name_en'] ?? ''),
        'parentId' => $parentColumn !== null && !empty($row[$parentColumn]) ? (int)$row[$parentColumn] : null,
        'parentName' => $parentName,
        'code' => (string)($row['code'] ?? ''),
        'color' => (string)($row['color'] ?? ''),
        'isPrimary' => (bool)($row['is_primary'] ?? false),
        'onAccount' => (bool)($row['on_account'] ?? false),
        'sortOrder' => (int)($row['sort_order'] ?? 0),
        'deletedAt' => $row['deleted_at'] ? iso_timestamp($row['deleted_at']) : null,
        'createdAt' => iso_timestamp($row['created_at']),
        'updatedAt' => iso_timestamp($row['updated_at']),
    ];
}

function lookups_parent_name(array $def, array $row): ?string
{
    [, , $parentColumn, $parentKind] = $def;
    if ($parentColumn === null || empty($row[$parentColumn])) {
        return null;
    }
    $parentDef = lookups_kinds()[$parentKind];
    $column = $parentDef[1] ? 'name_ku' : 'name';
    $stmt = db()->prepare("SELECT {$column} AS n FROM {$parentDef[0]} WHERE id = ?");
    $stmt->execute([(int)$row[$parentColumn]]);
    $value = $stmt->fetchColumn();
    return $value === false ? null : (string)$value;
}

/** @return array{0: array<string, mixed>, 1: ?string} [values, error] */
function lookups_values(array $def, array $body, bool $partial): array
{
    [, $trilingual, $parentColumn, , $extras] = $def;
    $values = [];
    $name = trim((string)($body['nameKu'] ?? $body['name'] ?? ''));
    if ($trilingual) {
        if ($name !== '') {
            $values['name_ku'] = $name;
        }
        if (array_key_exists('nameAr', $body)) {
            $values['name_ar'] = trim((string)$body['nameAr']);
        }
        if (array_key_exists('nameEn', $body)) {
            $values['name_en'] = trim((string)$body['nameEn']);
        }
    } elseif ($name !== '') {
        $values['name'] = $name;
    }
    if (!$partial && $name === '') {
        return [[], 'name is required'];
    }
    if ($parentColumn !== null) {
        if (array_key_exists('parentId', $body) && $body['parentId'] !== null) {
            $values[$parentColumn] = (int)$body['parentId'];
        } elseif (!$partial) {
            return [[], 'parentId is required'];
        }
    }
    $extraMap = ['code' => 'code', 'color' => 'color', 'is_primary' => 'isPrimary', 'on_account' => 'onAccount'];
    foreach ($extras as $column) {
        $key = $extraMap[$column];
        if (array_key_exists($key, $body)) {
            $values[$column] = in_array($column, ['is_primary', 'on_account'], true) ? ((bool)$body[$key] ? 1 : 0) : (string)$body[$key];
        }
    }
    if (array_key_exists('sortOrder', $body)) {
        $values['sort_order'] = (int)$body['sortOrder'];
    }
    return [$values, null];
}

function lookups_fetch(string $table, int $id): ?array
{
    $stmt = db()->prepare("SELECT * FROM {$table} WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row === false ? null : $row;
}

function lookups_dispatch(string $method, string $path): bool
{
    if (!preg_match('#^/lookups/([a-z0-9-]+)(?:/(\d+))?$#', $path, $m)) {
        return false;
    }
    $kinds = lookups_kinds();
    $kind = $m[1];
    if (!isset($kinds[$kind])) {
        error_response('Unknown lookup kind', 400);
    }
    auth_require();
    $def = $kinds[$kind];
    [$table, $trilingual, $parentColumn, $parentKind] = $def;
    $id = isset($m[2]) ? (int)$m[2] : null;

    if ($method === 'GET' && $id === null) {
        $nameColumn = $trilingual ? 'name_ku' : 'name';
        if ($parentColumn !== null) {
            $parentDef = $kinds[$parentKind];
            $parentNameColumn = $parentDef[1] ? 'name_ku' : 'name';
            $sql = "SELECT t.*, p.{$parentNameColumn} AS parent_name FROM {$table} t LEFT JOIN {$parentDef[0]} p ON p.id = t.{$parentColumn} WHERE t.deleted_at IS NULL ORDER BY t.sort_order, t.{$nameColumn}";
        } else {
            $sql = "SELECT t.*, NULL AS parent_name FROM {$table} t WHERE t.deleted_at IS NULL ORDER BY t.sort_order, t.{$nameColumn}";
        }
        $rows = db()->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        $items = [];
        foreach ($rows as $row) {
            $items[] = lookups_row_to_item($kind, $def, $row, $row['parent_name'] !== null ? (string)$row['parent_name'] : null);
        }
        json_response($items);
    }

    if ($method === 'POST' && $id === null) {
        [$values, $error] = lookups_values($def, json_body(), false);
        if ($error !== null) {
            error_response($error, 400);
        }
        $columns = array_keys($values);
        $sql = "INSERT INTO {$table} (" . implode(', ', $columns) . ') VALUES (' . implode(', ', array_fill(0, count($columns), '?')) . ')';
        db()->prepare($sql)->execute(array_values($values));
        $row = lookups_fetch($table, (int)db()->lastInsertId());
        json_response(lookups_row_to_item($kind, $def, $row, lookups_parent_name($def, $row)), 201);
    }

    if ($method === 'PATCH' && $id !== null) {
        [$values, $error] = lookups_values($def, json_body(), true);
        if ($error !== null) {
            error_response($error, 400);
        }
        if ($values === []) {
            error_response('Nothing to update', 400);
        }
        $existing = lookups_fetch($table, $id);
        if ($existing === null || $existing['deleted_at'] !== null) {
            error_response('Lookup row not found', 404);
        }
        $assignments = implode(', ', array_map(static fn (string $c): string => "{$c} = ?", array_keys($values)));
        $params = array_values($values);
        $params[] = $id;
        db()->prepare("UPDATE {$table} SET {$assignments} WHERE id = ?")->execute($params);
        $row = lookups_fetch($table, $id);
        json_response(lookups_row_to_item($kind, $def, $row, lookups_parent_name($def, $row)));
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = db()->prepare("UPDATE {$table} SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            error_response('Lookup row not found', 404);
        }
        http_response_code(204);
        exit;
    }

    error_response('Method not allowed', 405);
}

$GLOBALS['rawand_modules'][] = 'lookups_dispatch';
