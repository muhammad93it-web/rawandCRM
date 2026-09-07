<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/backups.php';

function backups_dispatch(string $method, string $path): bool
{
    if (!str_starts_with($path, '/admin/backups')) {
        return false;
    }
    auth_require_permission('backups.manage');
    if ($method === 'GET' && $path === '/admin/backups/status') {
        $settings = db()->query('SELECT * FROM backup_settings WHERE id = 1')->fetch() ?: [];
        json_response([
            'timezone' => 'Asia/Baghdad',
            'encryptionConfigured' => backup_secret('BACKUP_ENCRYPTION_KEY') !== '',
            'telegramConfigured' => backup_secret('TELEGRAM_BOT_TOKEN') !== '' && backup_secret('TELEGRAM_CHAT_ID') !== '',
            'schedule' => backup_settings_row($settings),
        ]);
    }
    if ($method === 'GET' && $path === '/admin/backups') {
        $jobs = db()->query('SELECT * FROM backup_jobs ORDER BY created_at DESC LIMIT 50')->fetchAll();
        $attempts = db()->query('SELECT * FROM telegram_delivery_attempts ORDER BY attempted_at DESC LIMIT 100')->fetchAll();
        json_response(array_map(fn(array $job): array => backup_job_row(
            $job,
            array_map('backup_attempt_row', array_values(array_filter($attempts, fn(array $attempt): bool => $attempt['backup_job_id'] === $job['id']))),
        ), $jobs));
    }
    if ($method === 'PUT' && $path === '/admin/backups/settings') {
        $body = json_body();
        $existing = db()->query('SELECT * FROM backup_settings WHERE id = 1')->fetch() ?: [];
        $frequency = (string)($body['frequency'] ?? '');
        $localTime = (string)($body['localTime'] ?? '');
        $retention = (int)($body['retentionCount'] ?? 0);
        if (!in_array($frequency, ['daily', 'weekly', 'monthly', 'custom'], true) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $localTime) || $retention < 1 || $retention > 365) {
            error_response('Invalid backup schedule.', 400);
        }
        $dailyTimes = backup_time_array($body['telegramDailyReportTimes'] ?? ($existing['telegram_daily_report_times'] ?? '[]'));
        $sendTimes = backup_time_array($body['telegramBackupSendTimes'] ?? ($existing['telegram_backup_send_times'] ?? '[]'));
        if ($dailyTimes === null || $sendTimes === null) error_response('Invalid Telegram time slots.', 400);
        $token = array_key_exists('telegramBotToken', $body) ? trim((string)$body['telegramBotToken']) : null;
        if ($token !== null && ($token === '' || strlen($token) > 200)) error_response('Invalid Telegram bot token.', 400);
        $chatId = array_key_exists('telegramChatId', $body) ? trim((string)$body['telegramChatId']) : ($existing['telegram_chat_id'] ?? null);
        if ($chatId !== null && strlen($chatId) > 100) error_response('Invalid Telegram chat ID.', 400);
        $storedToken = $token === null ? ($existing['telegram_bot_token_encrypted'] ?? null) : backup_encrypt_telegram_token($token);
        $statement = db()->prepare('INSERT INTO backup_settings (id, enabled, frequency, local_time, day_of_week, day_of_month, custom_cron, timezone, retention_count, telegram_bot_token_encrypted, telegram_chat_id, telegram_daily_report_enabled, telegram_daily_report_times, telegram_monthly_report_enabled, telegram_attach_backup, telegram_backup_send_times, updated_by)
            VALUES (1, ?, ?, ?, ?, ?, ?, "Asia/Baghdad", ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE enabled=VALUES(enabled), frequency=VALUES(frequency), local_time=VALUES(local_time), day_of_week=VALUES(day_of_week), day_of_month=VALUES(day_of_month), custom_cron=VALUES(custom_cron), retention_count=VALUES(retention_count), telegram_bot_token_encrypted=VALUES(telegram_bot_token_encrypted), telegram_chat_id=VALUES(telegram_chat_id), telegram_daily_report_enabled=VALUES(telegram_daily_report_enabled), telegram_daily_report_times=VALUES(telegram_daily_report_times), telegram_monthly_report_enabled=VALUES(telegram_monthly_report_enabled), telegram_attach_backup=VALUES(telegram_attach_backup), telegram_backup_send_times=VALUES(telegram_backup_send_times), updated_by=VALUES(updated_by)');
        $statement->execute([!empty($body['enabled']) ? 1 : 0, $frequency, $localTime, $body['dayOfWeek'] ?? null, $body['dayOfMonth'] ?? null, $body['customCron'] ?? null, $retention, $storedToken, $chatId ?: null, !empty($body['telegramDailyReportEnabled']) ? 1 : 0, json_encode($dailyTimes), !empty($body['telegramMonthlyReportEnabled']) ? 1 : 0, !array_key_exists('telegramAttachBackup', $body) || !empty($body['telegramAttachBackup']) ? 1 : 0, json_encode($sendTimes), auth_require()['id']]);
        json_response(backup_settings_row(db()->query('SELECT * FROM backup_settings WHERE id = 1')->fetch()));
    }
    if ($method === 'POST' && $path === '/admin/backups/latest/send') {
        $job = db()->query('SELECT * FROM backup_jobs WHERE status = "completed" AND archive_path IS NOT NULL AND checksum_sha256 IS NOT NULL ORDER BY completed_at DESC LIMIT 1')->fetch();
        if (!$job) error_response('No completed backup exists.', 409, 'no_completed_backup');
        backup_telegram((int)$job['id'], (string)$job['archive_path'], (string)$job['checksum_sha256']);
        json_response(backup_job_row($job, []), 202);
    }
    if ($method === 'POST' && $path === '/admin/backups/telegram/report') {
        $body = json_body();
        $from = backup_calendar_date($body['from'] ?? null);
        $to = backup_calendar_date($body['to'] ?? null);
        if ($from === null || $to === null || $from > $to || $to->getTimestamp() - $from->getTimestamp() > 365 * 86400
            || (array_key_exists('attachBackup', $body) && !is_bool($body['attachBackup']))) {
            error_response('from and to must be valid calendar dates within an inclusive 366-day range.', 400);
        }
        $settings = db()->query('SELECT telegram_attach_backup FROM backup_settings WHERE id = 1')->fetch() ?: [];
        $attach = array_key_exists('attachBackup', $body) ? $body['attachBackup'] : (!isset($settings['telegram_attach_backup']) || (bool)$settings['telegram_attach_backup']);
        try {
            $attachment = null;
            if ($attach) {
                db()->prepare('INSERT INTO backup_jobs (kind, requested_by) VALUES ("manual", ?)')->execute([auth_require()['id']]);
                $jobId = (int)db()->lastInsertId();
                backup_execute($jobId);
                $job = backup_find($jobId);
                backup_verify((string)$job['archive_path'], (string)$job['checksum_sha256']);
                $attachment = ['path' => $job['archive_path']];
            }
            backup_telegram_report(backup_crm_report($from->format('Y-m-d'), $to->format('Y-m-d'), 'دەستنیشانکراو'), $attachment, $attach);
            json_response(['delivered' => true, 'from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d'), 'attached' => $attach]);
        } catch (Throwable) {
            error_response('Telegram report delivery failed.', 503, 'telegram_delivery_failed');
        }
    }
    if ($method === 'GET' && preg_match('#^/admin/backups/([1-9]\d*)/download$#', $path, $match)) {
        $job = backup_find((int)$match[1]);
        $directory = realpath((string)app_config('backup.directory', dirname(__DIR__, 2) . '/backups'));
        $archive = realpath((string)$job['archive_path']);
        if ($directory === false || $archive === false || !str_starts_with($archive, $directory . DIRECTORY_SEPARATOR)) error_response('Backup archive is unavailable.', 404);
        header('Content-Type: application/octet-stream');
        header('Content-Length: ' . filesize($archive));
        header('Content-Disposition: attachment; filename="rawand-backup-' . (int)$job['id'] . '.sql.gz.aes"');
        readfile($archive);
        exit;
    }
    if ($method === 'POST' && $path === '/admin/backups/now') {
        if (backup_secret('BACKUP_ENCRYPTION_KEY') === '') error_response('BACKUP_ENCRYPTION_KEY is not configured.', 503, 'backup_unconfigured');
        db()->prepare('INSERT INTO backup_jobs (kind, requested_by) VALUES ("manual", ?)')->execute([auth_require()['id']]);
        $id = (int)db()->lastInsertId();
        backup_execute($id);
        $statement = db()->prepare('SELECT * FROM backup_jobs WHERE id = ?');
        $statement->execute([$id]);
        json_response(backup_job_row($statement->fetch(), []), 202);
    }
    if ($method === 'POST' && preg_match('#^/admin/backups/([1-9]\d*)/verify$#', $path, $match)) {
        $job = backup_find((int)$match[1]);
        backup_verify((string)$job['archive_path'], (string)$job['checksum_sha256']);
        json_response(['id' => (int)$job['id'], 'verified' => true, 'checksumSha256' => $job['checksum_sha256']]);
    }
    if ($method === 'POST' && preg_match('#^/admin/backups/([1-9]\d*)/restore/prepare$#', $path, $match)) {
        $source = backup_find((int)$match[1]);
        $owner = bin2hex(random_bytes(16));
        try {
            db()->exec('DELETE FROM maintenance_locks WHERE expires_at <= UTC_TIMESTAMP(3)');
            db()->prepare('INSERT INTO maintenance_locks (name, owner, reason, expires_at) VALUES ("database_restore", ?, ?, UTC_TIMESTAMP(3) + INTERVAL 15 MINUTE)')->execute([$owner, 'restore preparation']);
        } catch (PDOException) {
            error_response('A database maintenance operation is already active.', 423);
        }
        try {
            db()->prepare('INSERT INTO backup_jobs (kind, requested_by) VALUES ("pre_restore", ?)')->execute([auth_require()['id']]);
            $safetyId = (int)db()->lastInsertId();
            backup_execute($safetyId, false);
            backup_verify((string)$source['archive_path'], (string)$source['checksum_sha256']);
            json_response(['ready' => true, 'restoreExecuted' => false, 'sourceBackupId' => (int)$source['id'], 'preRestoreBackupId' => $safetyId, 'semantics' => 'MariaDB restore uses the verified pre-restore archive as rollback after partial import failure.']);
        } finally {
            db()->prepare('DELETE FROM maintenance_locks WHERE name = "database_restore" AND owner = ?')->execute([$owner]);
        }
    }
    return false;
}

function backup_find(int $id): array
{
    $statement = db()->prepare('SELECT * FROM backup_jobs WHERE id = ? AND status = "completed"');
    $statement->execute([$id]);
    $job = $statement->fetch();
    if (!$job || !$job['archive_path'] || !$job['checksum_sha256']) error_response('A completed backup archive is required.', 409);
    return $job;
}

function backup_settings_row(array $row): array
{
    return ['id' => 1, 'enabled' => (bool)($row['enabled'] ?? false), 'frequency' => $row['frequency'] ?? 'daily', 'localTime' => $row['local_time'] ?? '02:00', 'dayOfWeek' => isset($row['day_of_week']) ? (int)$row['day_of_week'] : null, 'dayOfMonth' => isset($row['day_of_month']) ? (int)$row['day_of_month'] : null, 'customCron' => $row['custom_cron'] ?? null, 'timezone' => 'Asia/Baghdad', 'retentionCount' => (int)($row['retention_count'] ?? 14), 'telegramConfigured' => (!empty($row['telegram_bot_token_encrypted']) || backup_secret('TELEGRAM_BOT_TOKEN') !== '') && (!empty($row['telegram_chat_id']) || backup_secret('TELEGRAM_CHAT_ID') !== ''), 'telegramChatId' => $row['telegram_chat_id'] ?? null, 'telegramDailyReportEnabled' => (bool)($row['telegram_daily_report_enabled'] ?? false), 'telegramDailyReportTimes' => backup_time_array($row['telegram_daily_report_times'] ?? '[]') ?? [], 'telegramMonthlyReportEnabled' => (bool)($row['telegram_monthly_report_enabled'] ?? false), 'telegramAttachBackup' => !isset($row['telegram_attach_backup']) || (bool)$row['telegram_attach_backup'], 'telegramBackupSendTimes' => backup_time_array($row['telegram_backup_send_times'] ?? '[]') ?? [], 'updatedBy' => isset($row['updated_by']) ? (int)$row['updated_by'] : null, 'updatedAt' => isset($row['updated_at']) ? iso_timestamp($row['updated_at']) : null];
}

function backup_time_array(mixed $value): ?array
{
    if (is_string($value)) $value = json_decode($value, true);
    if (!is_array($value)) return null;
    $unique = [];
    foreach ($value as $time) {
        if (!is_string($time) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) return null;
        $unique[$time] = true;
    }
    $times = array_keys($unique);
    sort($times, SORT_STRING);
    return count($times) <= 12 ? $times : null;
}

function backup_calendar_date(mixed $value): ?DateTimeImmutable
{
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return null;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value, new DateTimeZone('UTC'));
    return $date instanceof DateTimeImmutable && $date->format('Y-m-d') === $value ? $date : null;
}

function backup_job_row(array $row, array $attempts): array
{
    return ['id' => (int)$row['id'], 'kind' => $row['kind'], 'status' => $row['status'], 'scheduledFor' => $row['scheduled_for'] ? iso_timestamp($row['scheduled_for']) : null, 'requestedBy' => isset($row['requested_by']) ? (int)$row['requested_by'] : null, 'archivePath' => $row['archive_path'], 'checksumSha256' => $row['checksum_sha256'], 'archiveBytes' => isset($row['archive_bytes']) ? (int)$row['archive_bytes'] : null, 'encryption' => $row['encryption'] ? json_decode($row['encryption'], true) : null, 'error' => $row['error'], 'startedAt' => $row['started_at'] ? iso_timestamp($row['started_at']) : null, 'completedAt' => $row['completed_at'] ? iso_timestamp($row['completed_at']) : null, 'createdAt' => iso_timestamp($row['created_at']), 'telegramAttempts' => $attempts];
}

function backup_attempt_row(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'backupJobId' => (int)$row['backup_job_id'],
        'attempt' => (int)$row['attempt'],
        'status' => $row['status'],
        'error' => $row['error'],
        'telegramMessageId' => $row['telegram_message_id'],
        'attemptedAt' => iso_timestamp($row['attempted_at']),
        'nextRetryAt' => $row['next_retry_at'] ? iso_timestamp($row['next_retry_at']) : null,
    ];
}

$GLOBALS['rawand_modules'][] = 'backups_dispatch';