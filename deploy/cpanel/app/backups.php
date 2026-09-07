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

function backup_telegram_safe_error(string $message, string $token, string $chatId): string
{
    $message = preg_replace('#api\.telegram\.org/bot[^\s/]+#i', 'api.telegram.org/bot[redacted]', $message);
    return mb_substr(str_replace([$token, $chatId], ['[redacted]', '[redacted]'], (string)$message), 0, 1000);
}

function backup_encrypt_telegram_token(string $token): string
{
    $nonce = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt($token, 'aes-256-gcm', backup_key(), OPENSSL_RAW_DATA, $nonce, $tag);
    if (!is_string($ciphertext) || strlen($tag) !== BACKUP_TAG_BYTES) throw new RuntimeException('Telegram token encryption failed.');
    return base64_encode($nonce . $tag . $ciphertext);
}

function backup_decrypt_telegram_token(string $stored): string
{
    $raw = base64_decode($stored, true);
    if (!is_string($raw) || strlen($raw) <= 28) throw new RuntimeException('Stored Telegram token is invalid.');
    $token = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', backup_key(), OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
    if (!is_string($token) || $token === '') throw new RuntimeException('Stored Telegram token could not be decrypted.');
    return $token;
}

function backup_telegram_settings(): array
{
    $settings = db()->query('SELECT telegram_bot_token_encrypted, telegram_chat_id, telegram_attach_backup FROM backup_settings WHERE id = 1')->fetch() ?: [];
    $token = !empty($settings['telegram_bot_token_encrypted'])
        ? backup_decrypt_telegram_token((string)$settings['telegram_bot_token_encrypted'])
        : backup_secret('TELEGRAM_BOT_TOKEN');
    $chatId = trim((string)($settings['telegram_chat_id'] ?? '')) ?: backup_secret('TELEGRAM_CHAT_ID');
    return [$token, $chatId, !isset($settings['telegram_attach_backup']) || (bool)$settings['telegram_attach_backup']];
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
    [$token, $chatId, $attachBackup] = backup_telegram_settings();
    if ($token === '' || $chatId === '') {
        $attemptStatement = db()->prepare('SELECT COALESCE(MAX(attempt), 0) FROM telegram_delivery_attempts WHERE backup_job_id = ?');
        $attemptStatement->execute([$jobId]);
        db()->prepare('INSERT INTO telegram_delivery_attempts (backup_job_id, attempt, status) VALUES (?, ?, "unconfigured")')->execute([$jobId, 1 + (int)$attemptStatement->fetchColumn()]);
        return;
    }
    if (!extension_loaded('curl')) {
        db()->prepare('INSERT INTO telegram_delivery_attempts (backup_job_id, attempt, status, error) VALUES (?, 1, "failed", "PHP cURL extension is unavailable")')->execute([$jobId]);
        return;
    }
    $attemptStatement = db()->prepare('SELECT COALESCE(MAX(attempt), 0) FROM telegram_delivery_attempts WHERE backup_job_id = ?');
    $attemptStatement->execute([$jobId]);
    $attempt = 1 + (int)$attemptStatement->fetchColumn();
    $max = $attempt + 3;
    for (; $attempt <= $max; $attempt++) {
        db()->prepare('INSERT INTO telegram_delivery_attempts (backup_job_id, attempt, status) VALUES (?, ?, "sending")')->execute([$jobId, $attempt]);
        $curl = curl_init('https://api.telegram.org/bot' . rawurlencode($token) . '/' . ($attachBackup ? 'sendDocument' : 'sendMessage'));
        curl_setopt_array($curl, [
            CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 120,
            CURLOPT_POSTFIELDS => [
                'chat_id' => $chatId,
                $attachBackup ? 'caption' : 'text' => "Rawand CRM backup #{$jobId}\nSHA-256: {$checksum}",
                ...($attachBackup ? ['document' => new CURLFile($path, 'application/octet-stream', basename($path))] : []),
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
        $final = $attempt === $max;
        $message = backup_telegram_safe_error((string)($payload['description'] ?? $error ?: "Telegram HTTP {$http}"), $token, $chatId);
        $delay = min(30, 2 ** ($attempt - 1));
        db()->prepare('UPDATE telegram_delivery_attempts SET status = ?, error = ?, next_retry_at = ? WHERE backup_job_id = ? AND attempt = ?')
            ->execute([$final ? 'failed' : 'retrying', $message, $final ? null : gmdate('Y-m-d H:i:s', time() + $delay), $jobId, $attempt]);
        if (!$final) {
            sleep($delay);
        }
    }
}

function backup_crm_report(string $start, string $end, string $title): string
{
    $invoices = db()->prepare('SELECT type, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total FROM invoices WHERE status = "completed" AND date BETWEEN ? AND ? GROUP BY type');
    $invoices->execute([$start, $end]);
    $totals = ['sale' => ['count' => 0, 'total' => 0], 'purchase' => ['count' => 0, 'total' => 0]];
    foreach ($invoices->fetchAll() as $row) $totals[$row['type']] = ['count' => (int)$row['count'], 'total' => (float)$row['total']];
    $entries = db()->prepare('SELECT COALESCE(SUM(CASE WHEN type = "income" THEN amount ELSE 0 END), 0) AS income, COALESCE(SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END), 0) AS expense FROM financial_entries WHERE entry_date BETWEEN ? AND ? AND deleted_at IS NULL');
    $entries->execute([$start, $end]);
    $entry = $entries->fetch() ?: ['income' => 0, 'expense' => 0];
    $number = static fn($value): string => number_format((float)$value, 2, '.', ',');
    return "ڕاپۆرتی {$title} — {$start} تا {$end}\n"
        . 'فرۆشتن: ' . $number($totals['sale']['count']) . ' پسووڵە | ' . $number($totals['sale']['total']) . " IQD\n"
        . 'کڕین: ' . $number($totals['purchase']['count']) . ' پسووڵە | ' . $number($totals['purchase']['total']) . " IQD\n"
        . 'داهات: ' . $number($entry['income']) . ' IQD | خەرجی: ' . $number($entry['expense']) . ' IQD';
}

function backup_telegram_report(string $text, ?array $attachment = null, ?bool $attachOverride = null): void
{
    [$token, $chatId, $attachBackup] = backup_telegram_settings();
    $attachBackup = $attachOverride ?? $attachBackup;
    if ($token === '' || $chatId === '') throw new RuntimeException('Telegram is not configured.');
    if ($attachBackup && $attachment === null) throw new RuntimeException('A verified backup is required for an attached Telegram report.');
    if (!extension_loaded('curl')) throw new RuntimeException('PHP cURL extension is unavailable.');
    $fields = ['chat_id' => $chatId, $attachBackup ? 'caption' : 'text' => $text];
    if ($attachBackup) $fields['document'] = new CURLFile($attachment['path'], 'application/octet-stream', basename($attachment['path']));
    $curl = curl_init('https://api.telegram.org/bot' . rawurlencode($token) . '/' . ($attachBackup ? 'sendDocument' : 'sendMessage'));
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 120, CURLOPT_POSTFIELDS => $fields]);
    $response = curl_exec($curl);
    $http = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $payload = is_string($response) ? json_decode($response, true) : null;
    $error = curl_error($curl);
    curl_close($curl);
    if ($http < 200 || $http >= 300 || !is_array($payload) || ($payload['ok'] ?? false) !== true) {
        throw new RuntimeException(backup_telegram_safe_error((string)($payload['description'] ?? $error ?: "Telegram HTTP {$http}"), $token, $chatId));
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