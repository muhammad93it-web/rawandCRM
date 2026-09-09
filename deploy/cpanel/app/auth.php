<?php

declare(strict_types=1);

function auth_client_ip(): string
{
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

function auth_expected_origin(): string
{
    $configured = trim((string)app_config('app.allowed_origin', ''));
    if ($configured !== '') {
        return rtrim($configured, '/');
    }
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = (string)($_SERVER['HTTP_HOST'] ?? '');
    return $host !== '' ? $scheme . '://' . $host : '';
}

function auth_check_origin(): void
{
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') {
        return;
    }
    $expected = auth_expected_origin();
    if ($expected !== '' && !hash_equals($expected, rtrim($origin, '/'))) {
        error_response('Request origin is not allowed.', 403, 'invalid_origin');
    }
}

function auth_session_user(): ?array
{
    static $loaded = false;
    static $user = null;
    if ($loaded) {
        return $user;
    }
    $loaded = true;

    $id = (int)($_SESSION['user_id'] ?? 0);
    if ($id < 1) {
        return null;
    }

    $idleSeconds = max(300, (int)app_config('app.session_idle_seconds', 28800));
    $lastActivity = (int)($_SESSION['last_activity'] ?? 0);
    if ($lastActivity > 0 && time() - $lastActivity > $idleSeconds) {
        auth_logout();
        return null;
    }

    $statement = db()->prepare(
        'SELECT u.id, u.workplace_id, u.group_id, u.username, u.display_name, u.status,
                u.last_login_at, g.name AS group_name, g.permissions AS group_permissions
         FROM users u
         LEFT JOIN user_groups g ON g.id = u.group_id AND g.deleted_at IS NULL
         WHERE u.id = :id AND u.deleted_at IS NULL AND u.status = "active"
         LIMIT 1',
    );
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    if (!$row) {
        auth_logout();
        return null;
    }

    $_SESSION['last_activity'] = time();
    $user = $row;
    return $user;
}

function auth_require(): array
{
    $user = auth_session_user();
    if (!$user) {
        error_response('Authentication required.', 401, 'authentication_required');
    }
    return $user;
}

function auth_permissions(array $user): array
{
    $raw = $user['group_permissions'] ?? [];
    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        $raw = is_array($decoded) ? $decoded : [];
    }
    return is_array($raw) ? $raw : [];
}

function auth_has_permission(array $user, string $permission): bool
{
    // The first admin remains recoverable even before a role is assigned.
    if ((string)($user['username'] ?? '') === 'admin') {
        return true;
    }

    $permissions = auth_permissions($user);
    if (($permissions['*'] ?? false) === true || in_array('*', $permissions, true)) {
        return true;
    }
    if (($permissions[$permission] ?? false) === true || in_array($permission, $permissions, true)) {
        return true;
    }

    [$resource, $action] = array_pad(explode('.', $permission, 2), 2, 'read');
    $resourcePermissions = $permissions[$resource] ?? null;
    if (is_array($resourcePermissions)) {
        return ($resourcePermissions[$action] ?? false) === true
            || ($resourcePermissions['manage'] ?? false) === true;
    }
    return false;
}

function auth_require_permission(string $permission): array
{
    $user = auth_require();
    if (!auth_has_permission($user, $permission)) {
        error_response('You do not have permission to perform this action.', 403, 'permission_denied');
    }
    return $user;
}

function auth_route_permission(string $method, string $path): ?string
{
    if ($path === '/healthz'
        || ($path === '/session/login' && $method === 'POST')
        || ($path === '/session/logout' && $method === 'POST')
        || ($path === '/session/users' && $method === 'GET')
        || ($path === '/session/bootstrap' && $method === 'POST')) {
        return null;
    }
    if (str_starts_with($path, '/session/')) {
        return 'session.manage';
    }

    if (str_starts_with($path, '/reports/')) {
        return 'reports.read';
    }
    if ($path === '/activity') {
        return 'activity.read';
    }
    if ($path === '/dashboard/summary') {
        return 'dashboard.read';
    }
    if ($path === '/deleted-records') {
        return 'deleted.read';
    }
    if ($method === 'POST' && preg_match('#^/deleted-records/[^/]+/[1-9][0-9]*/restore$#', $path)) {
        return 'deleted.manage';
    }

    $resource = strtolower(explode('/', ltrim($path, '/'))[0] ?? '');
    $resource = match ($resource) {
        'purchase' => 'purchases',
        'sales' => 'sales',
        'inventory' => 'inventory',
        default => $resource,
    };
    if ($resource === '') {
        return 'api.read';
    }
    return $resource . '.' . ($method === 'GET' ? 'read' : 'manage');
}

function auth_authorize_api_request(string $method, string $path): void
{
    auth_check_origin();
    $permission = auth_route_permission($method, $path);
    if ($permission !== null) {
        auth_require_permission($permission);
    }
    if (!in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)
        && !str_starts_with($path, '/admin/backups')
        && !str_starts_with($path, '/session/')) {
        $activeLock = db()->query('SELECT name FROM maintenance_locks WHERE expires_at > UTC_TIMESTAMP(3) LIMIT 1')->fetchColumn();
        if ($activeLock !== false) {
            error_response('Database maintenance is active.', 423, 'maintenance_lock');
        }
    }
}

function auth_record_attempt(string $username, string $ip, bool $success): void
{
    $statement = db()->prepare(
        'INSERT INTO auth_login_attempts (username, ip_address, succeeded, attempted_at)
         VALUES (:username, :ip, :succeeded, UTC_TIMESTAMP(3))',
    );
    $statement->execute([
        'username' => mb_substr($username, 0, 255),
        'ip' => mb_substr($ip, 0, 45),
        'succeeded' => $success ? 1 : 0,
    ]);
}

function auth_is_rate_limited(string $username, string $ip): bool
{
    $maxAttempts = max(3, (int)app_config('app.login_max_attempts', 5));
    $usernameStatement = db()->prepare(
        'SELECT COUNT(*) FROM auth_login_attempts
         WHERE succeeded = 0
           AND attempted_at >= UTC_TIMESTAMP(3) - INTERVAL 15 MINUTE
           AND username = :username',
    );
    $usernameStatement->execute(['username' => $username]);
    if ((int)$usernameStatement->fetchColumn() >= $maxAttempts) {
        return true;
    }

    $ipMaxAttempts = max($maxAttempts * 2, (int)app_config('app.login_ip_max_attempts', 30));
    $ipStatement = db()->prepare(
        'SELECT COUNT(*) FROM auth_login_attempts
         WHERE succeeded = 0
           AND attempted_at >= UTC_TIMESTAMP(3) - INTERVAL 15 MINUTE
           AND ip_address = :ip',
    );
    $ipStatement->execute(['ip' => $ip]);
    return (int)$ipStatement->fetchColumn() >= $ipMaxAttempts;
}

function auth_audit(string $action, ?int $userId = null, ?string $resource = null, ?int $resourceId = null, array $metadata = []): void
{
    try {
        $statement = db()->prepare(
            'INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, metadata, created_at)
             VALUES (:user_id, :action, :resource, :resource_id, :ip, :metadata, UTC_TIMESTAMP(3))',
        );
        $statement->execute([
            'user_id' => $userId,
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $resourceId,
            'ip' => auth_client_ip(),
            'metadata' => json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    } catch (Throwable $error) {
        error_log('[rawand-cpanel] audit error: ' . $error->getMessage());
    }
}

function auth_public_user(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'username' => (string)$row['username'],
        'displayName' => (string)$row['display_name'],
        'status' => (string)$row['status'],
    ];
}

function auth_login(): never
{
    $body = json_body();
    $username = required_string($body, 'username');
    $password = required_string($body, 'password');
    $ip = auth_client_ip();

    if (auth_is_rate_limited($username, $ip)) {
        error_response('Too many login attempts. Try again in 15 minutes.', 429, 'login_rate_limited');
    }

    $statement = db()->prepare(
        'SELECT * FROM users
         WHERE username = :username AND deleted_at IS NULL AND status = "active"
         LIMIT 1',
    );
    $statement->execute(['username' => $username]);
    $row = $statement->fetch();

    if ($row && !empty($row['locked_until']) && strtotime((string)$row['locked_until']) > time()) {
        error_response('This account is temporarily locked. Try again later.', 423, 'account_locked');
    }

    if (!$row || !password_verify($password, (string)$row['password_hash'])) {
        auth_record_attempt($username, $ip, false);
        if ($row) {
            $failed = (int)($row['failed_login_count'] ?? 0) + 1;
            $lockMinutes = max(5, (int)app_config('app.login_lock_minutes', 15));
            $lockedUntil = $failed >= max(3, (int)app_config('app.login_max_attempts', 5))
                ? (new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify("+{$lockMinutes} minutes")->format('Y-m-d H:i:s')
                : null;
            $update = db()->prepare(
                'UPDATE users SET failed_login_count = :failed, locked_until = :locked_until,
                        last_failed_login_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3)
                 WHERE id = :id',
            );
            $update->execute(['failed' => $failed, 'locked_until' => $lockedUntil, 'id' => $row['id']]);
        }
        error_response('Invalid username or password.', 401, 'invalid_credentials');
    }

    session_regenerate_id(true);
    $_SESSION = [
        'user_id' => (int)$row['id'],
        'created_at' => time(),
        'last_activity' => time(),
    ];
    $update = db()->prepare(
        'UPDATE users SET failed_login_count = 0, locked_until = NULL,
                last_failed_login_at = NULL, last_login_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3)
         WHERE id = :id',
    );
    $update->execute(['id' => $row['id']]);
    auth_record_attempt($username, $ip, true);
    auth_audit('login', (int)$row['id'], 'session');

    json_response([
        'id' => (int)$row['id'],
        'username' => (string)$row['username'],
        'displayName' => (string)$row['display_name'],
        'workplaceId' => $row['workplace_id'] === null ? null : (int)$row['workplace_id'],
        'groupId' => $row['group_id'] === null ? null : (int)$row['group_id'],
        'status' => 'active',
    ]);
}

function auth_logout(): never
{
    $userId = (int)($_SESSION['user_id'] ?? 0);
    if ($userId > 0) {
        auth_audit('logout', $userId, 'session');
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'] ?: '/',
            'domain' => $params['domain'] ?? '',
            'secure' => (bool)$params['secure'],
            'httponly' => (bool)$params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
    http_response_code(204);
    exit;
}
