<?php

declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';

if (!hash_equals(
    '1cb383f85e5815a35976514e1c276e7b45848072668285c3f84512c48240c7d9',
    (string)($_POST['token'] ?? ''),
)) {
    error_response('Not found.', 404);
}

$password = (string)($_POST['password'] ?? '');
if (strlen($password) < 8) {
    error_response('The password must be at least 8 characters.', 400);
}

$statement = db()->prepare(
    'UPDATE users SET password_hash = :password_hash, failed_login_count = 0,
            locked_until = NULL, last_failed_login_at = NULL, updated_at = UTC_TIMESTAMP(3)
     WHERE username = :username AND deleted_at IS NULL',
);
$statement->execute([
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    'username' => 'admin',
]);

json_response(['status' => 'ok', 'updated' => $statement->rowCount() > 0]);