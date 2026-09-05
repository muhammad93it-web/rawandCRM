<?php

declare(strict_types=1);

date_default_timezone_set('UTC');

$configPath = __DIR__ . '/../config/config.php';
$config = is_file($configPath) ? require $configPath : require __DIR__ . '/../config/config.example.php';

date_default_timezone_set((string)($config['app']['timezone'] ?? 'UTC'));

function app_config(string $key, mixed $default = null): mixed
{
    global $config;
    $value = $config;
    foreach (explode('.', $key) as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return $default;
        }
        $value = $value[$segment];
    }
    return $value;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = (string)app_config('db.host', 'localhost');
    $port = (int)app_config('db.port', 3306);
    $name = (string)app_config('db.name', '');
    $user = (string)app_config('db.user', '');
    $password = (string)app_config('db.password', '');

    if ($name === '' || $user === '') {
        throw new RuntimeException('MariaDB configuration is incomplete.');
    }

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
    );
    return $pdo;
}

function json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if (trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        error_response('Request body must be a JSON object.', 400);
    }
    return $decoded;
}

function request_query(string $key, mixed $default = null): mixed
{
    return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
}

function required_string(array $body, string $key): string
{
    $value = $body[$key] ?? null;
    if (!is_string($value) || trim($value) === '') {
        error_response("The {$key} field is required.", 400);
    }
    return trim($value);
}

function number_value(mixed $value, string $key, bool $nonNegative = false): float
{
    if (!is_numeric($value)) {
        error_response("The {$key} field must be a number.", 400);
    }
    $number = (float)$value;
    if (!is_finite($number) || ($nonNegative && $number < 0)) {
        error_response("The {$key} field is invalid.", 400);
    }
    return $number;
}

function integer_value(mixed $value, string $key): int
{
    if (filter_var($value, FILTER_VALIDATE_INT) === false || (int)$value < 1) {
        error_response("The {$key} field must be a positive integer.", 400);
    }
    return (int)$value;
}

function date_value(mixed $value, string $key): string
{
    if (!is_string($value) || trim($value) === '') {
        error_response("The {$key} field is required.", 400);
    }
    try {
        return (new DateTimeImmutable($value))->format('Y-m-d');
    } catch (Throwable) {
        error_response("The {$key} field must be a valid date.", 400);
    }
}

function iso_timestamp(string $value): string
{
    try {
        return (new DateTimeImmutable($value))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
    } catch (Throwable) {
        return $value;
    }
}

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

function error_response(string $message, int $status = 400, ?string $code = null): never
{
    $payload = ['error' => $message];
    if ($code !== null) {
        $payload['code'] = $code;
    }
    json_response($payload, $status);
}

function unsupported_response(): never
{
    error_response(
        'This endpoint is not supported by the current cPanel migration yet.',
        501,
        'unsupported_cpanel_endpoint',
    );
}

function row_number(mixed $value): float|int
{
    $number = (float)$value;
    return fmod($number, 1.0) === 0.0 ? (int)$number : $number;
}