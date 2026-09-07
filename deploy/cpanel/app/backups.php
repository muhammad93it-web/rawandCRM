<?php

declare(strict_types=1);

const BACKUP_MAGIC = 'RAWANDP1';
const BACKUP_TAG_BYTES = 16;

function backup_secret(string $name): string
{
    $environment = getenv($name);
    if (is_string($environment) && trim($environment) !== '') {
        return trim($environment);
    }
    return trim((string)app_config('secrets.' . strtolower($name), ''));
}

function backup_key(): string
{
    $configured = backup_secret('BACKUP_ENCRYPTION_KEY');
    $key = preg_match('/^[a-f0-9]{64}$/i', $configured) ? hex2bin($configured) : base64_decode($configured, true);
    if (!is_string($key) || strlen($key) !== 32) {
        throw new RuntimeException('BACKUP_ENCRYPTION_KEY must decode to exactly 32 bytes.');
    }
    return $key;
}

function backup_safe_error(Throwable $error): string
{
    return mb_substr((string)preg_replace('#(?:mysql|mariadb)://\S+#i', '[database connection redacted]', $error->getMessage()), 0, 1000);
}

function backup_encrypt_chunk($output, string $compressed, string $key): void
{
    if ($compressed === '') {
        return;
    }
    $nonce = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt($compressed, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag);
    if (!is_string($ciphertext) || strlen($tag) !== BACKUP_TAG_BYTES) {
        throw new RuntimeException('AES-256-GCM encryption failed.');
    }
    fwrite($output, $nonce . pack('N', strlen($ciphertext)) . $ciphertext . $tag);
}

function backup_verify(string $path, string $expectedChecksum): void
{
    if (!hash_equals($expectedChecksum, hash_file('sha256', $path))) {
        throw new RuntimeException('Backup SHA-256 checksum does not match.');
    }
    $input = fopen($path, 'rb');
    if (!is_resource($input) || fread($input, 8) !== BACKUP_MAGIC) {
        throw new RuntimeException('Backup archive header is invalid.');
    }
    $inflate = inflate_init(ZLIB_ENCODING_GZIP);
    if ($inflate === false) {
        throw new RuntimeException('Could not initialize gzip verification.');
    }
    $key = backup_key();
    while (!feof($input)) {
        $nonce = fread($input, 12);
        if ($nonce === '') {
            break;
        }
        $lengthBytes = fread($input, 4);
        if (strlen($nonce) !== 12 || strlen($lengthBytes) !== 4) {
            throw new RuntimeException('Backup archive is truncated.');
        }
        $length = unpack('Nlength', $lengthBytes)['length'];
        if ($length < 1 || $length > 16 * 1024 * 1024) {
            throw new RuntimeException('Backup chunk length is invalid.');
        }
        $ciphertext = '';
        while (strlen($ciphertext) < $length && !feof($input)) {
            $ciphertext .= fread($input, $length - strlen($ciphertext));
        }
        $tag = fread($input, BACKUP_TAG_BYTES);
        $plain = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag);
        if (!is_string($plain) || inflate_add($inflate, $plain, ZLIB_SYNC_FLUSH) === false) {
            throw new RuntimeException('Backup authentication or compression verification failed.');
        }
    }
    fclose($input);
    if (inflate_add($inflate, '', ZLIB_FINISH) === false) {
        throw new RuntimeException('Backup gzip stream is incomplete.');
    }
}

function backup_telegram(int $jobId, string $path, string $checksum): void
{
    $token = backup_secret('TELEGRAM_BOT_TOKEN');
    $chatId = backup_secret('TELEGRAM_CHAT_ID');
    if ($token === '' || $chatId === '') {
        db()->prepare('INSERT INTO telegram_delivery_attempts (backup_job_id, attempt, status) VALUES (?, 1, "unconfigured")')->execute([$jobId]);
        return;
    }
    if (!extension_loaded('curl')) {
        db()->prepare('INSERT INTO telegram_delivery_attempts (backup_job_id, attempt, status, error) VALUES (?, 1, "failed", "PHP cURL extension is unavailable")')->execute([$jobId]);
        return;
    }
    for ($attempt = 1; $attempt <= 4; $attempt++) {
        db()->prepare('INSERT INTO telegram_delivery_attempts (backup_job_id, attempt, status) VALUES (?, ?, "sending")')->execute([$jobId, $attempt]);
        $curl = curl_init('https://api.telegram.org/bot' . rawurlencode($token) . '/sendDocument');
        curl_setopt_array($curl, [
            CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 120,
            CURLOPT_POSTFIELDS => [
                'chat_id' => $chatId,
                'caption' => "Rawand CRM backup #{$jobId}\nSHA-256: {$checksum}",
                'document' => new CURLFile($path, 'application/octet-stream', basename($path)),
            ],
        ]);
        $response = curl_exec($curl);
        $http = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $payload = is_string($response) ? json_decode($response, true) : null;
        $error = curl_error($curl);
        curl_close($curl);
        if ($http >= 200 && $http < 300 && is_array($payload) && ($payload['ok'] ?? false) === true) {
            db()->prepare('UPDATE telegram_delivery_attempts SET status = "sent", telegram_message_id = ? WHERE backup_job_id = ? AND attempt = ?')
                ->execute([(string)($payload['result']['message_id'] ?? ''), $jobId, $attempt]);
            return;
        }
        $final = $attempt === 4;
        $message = mb_substr((string)($payload['description'] ?? $error ?: "Telegram HTTP {$http}"), 0, 1000);
        $delay = min(30, 2 ** ($attempt - 1));
        db()->prepare('UPDATE telegram_delivery_attempts SET status = ?, error = ?, next_retry_at = ? WHERE backup_job_id = ? AND attempt = ?')
            ->execute([$final ? 'failed' : 'retrying', $message, $final ? null : gmdate('Y-m-d H:i:s', time() + $delay), $jobId, $attempt]);
        if (!$final) {
            sleep($delay);
        }
    }
}

function backup_execute(int $jobId, bool $applyRetention = true): void
{
    $directory = (string)app_config('backup.directory', dirname(__DIR__) . '/backups');
    if ((!is_dir($directory) && !mkdir($directory, 0700, true)) || !is_writable($directory)) {
        throw new RuntimeException('Backup directory is not writable.');
    }
    $path = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . "rawand-{$jobId}-" . time() . '.sql.gz.aes';
    db()->prepare('UPDATE backup_jobs SET status = "running", started_at = UTC_TIMESTAMP(3) WHERE id = ?')->execute([$jobId]);
    $config = [
        'host' => (string)app_config('db.host', 'localhost'),
        'port' => (string)app_config('db.port', 3306),
        'user' => (string)app_config('db.user', ''),
        'name' => (string)app_config('db.name', ''),
    ];
    $command = ['mysqldump', '--single-transaction', '--quick', '--skip-lock-tables', '--host=' . $config['host'], '--port=' . $config['port'], '--user=' . $config['user'], $config['name']];
    $environment = array_merge($_ENV, ['MYSQL_PWD' => (string)app_config('db.password', '')]);
    $process = proc_open($command, [['pipe', 'r'], ['pipe', 'w'], ['pipe', 'w']], $pipes, null, $environment);
    if (!is_resource($process)) {
        throw new RuntimeException('mysqldump could not be started.');
    }
    $output = fopen($path, 'xb');
    if (!is_resource($output)) {
        proc_terminate($process);
        throw new RuntimeException('Encrypted backup archive could not be created.');
    }
    chmod($path, 0600);
    fwrite($output, BACKUP_MAGIC);
    $deflate = deflate_init(ZLIB_ENCODING_GZIP, ['level' => 9]);
    $key = backup_key();
    try {
        while (!feof($pipes[1])) {
            $chunk = fread($pipes[1], 1024 * 1024);
            if ($chunk !== '') {
                backup_encrypt_chunk($output, (string)deflate_add($deflate, $chunk, ZLIB_NO_FLUSH), $key);
            }
        }
        backup_encrypt_chunk($output, (string)deflate_add($deflate, '', ZLIB_FINISH), $key);
        $stderr = mb_substr(stream_get_contents($pipes[2]) ?: '', 0, 1000);
        fclose($pipes[1]);
        fclose($pipes[2]);
        fclose($pipes[0]);
        fclose($output);
        $exit = proc_close($process);
        if ($exit !== 0) {
            throw new RuntimeException("mysqldump failed with exit code {$exit}: {$stderr}");
        }
        $checksum = hash_file('sha256', $path);
        backup_verify($path, $checksum);
        db()->prepare('UPDATE backup_jobs SET status = "completed", archive_path = ?, checksum_sha256 = ?, archive_bytes = ?, encryption = ?, completed_at = UTC_TIMESTAMP(3) WHERE id = ?')
            ->execute([$path, $checksum, filesize($path), json_encode(['algorithm' => 'AES-256-GCM', 'format' => BACKUP_MAGIC, 'compression' => 'gzip']), $jobId]);
        backup_telegram($jobId, $path, $checksum);
        if ($applyRetention) {
            backup_enforce_retention();
        }
    } catch (Throwable $error) {
        if (is_resource($output)) fclose($output);
        if (is_resource($process)) proc_terminate($process);
        @unlink($path);
        db()->prepare('UPDATE backup_jobs SET status = "failed", error = ?, completed_at = UTC_TIMESTAMP(3) WHERE id = ?')
            ->execute([backup_safe_error($error), $jobId]);
        throw $error;
    }
}

function backup_enforce_retention(): void
{
    $retention = max(1, min(365, (int)(db()->query('SELECT retention_count FROM backup_settings WHERE id = 1')->fetchColumn() ?: 14)));
    $statement = db()->prepare('SELECT id, archive_path FROM backup_jobs WHERE status = "completed" ORDER BY completed_at DESC LIMIT 1000 OFFSET ' . $retention);
    $statement->execute();
    foreach ($statement->fetchAll() as $expired) {
        if (is_string($expired['archive_path']) && $expired['archive_path'] !== '') {
            @unlink($expired['archive_path']);
        }
        db()->prepare('DELETE FROM backup_jobs WHERE id = ?')->execute([$expired['id']]);
    }
}