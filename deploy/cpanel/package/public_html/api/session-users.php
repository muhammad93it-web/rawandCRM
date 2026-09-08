<?php

declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';

try {
    $rows = db()->query(
        "SELECT id, username, display_name, status
         FROM users
         WHERE deleted_at IS NULL AND status = 'active'
         ORDER BY display_name, id",
    )->fetchAll();
    if (!array_filter($rows, static fn(array $row): bool => (string)$row['username'] === 'admin')) {
        $rows[] = ['id' => -1, 'username' => 'admin', 'display_name' => 'بەڕێوەبەر', 'status' => 'active'];
    }
    json_response(array_map('auth_public_user', $rows));
} catch (Throwable $error) {
    error_log('[rawand-cpanel] public user list error: ' . $error->getMessage());
    json_response([
        ['id' => -1, 'username' => 'admin', 'displayName' => 'بەڕێوەبەر', 'status' => 'active'],
    ]);
}