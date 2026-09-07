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
        $frequency = (string)($body['frequency'] ?? '');
        $localTime = (string)($body['localTime'] ?? '');
        $retention = (int)($body['retentionCount'] ?? 0);
        if (!in_array($frequency, ['daily', 'weekly', 'monthly', 'custom'], true) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $localTime) || $retention < 1 || $retention > 365) {
            error_response('Invalid backup schedule.', 400);
        }
        $statement = db()->prepare('INSERT INTO backup_settings (id, enabled, frequency, local_time, day_of_week, day_of_month, custom_cron, timezone, retention_count, updated_by)
            VALUES (1, ?, ?, ?, ?, ?, ?, "Asia/Baghdad", ?, ?) ON DUPLICATE KEY UPDATE enabled=VALUES(enabled), frequency=VALUES(frequency), local_time=VALUES(local_time), day_of_week=VALUES(day_of_week), day_of_month=VALUES(day_of_month), custom_cron=VALUES(custom_cron), retention_count=VALUES(retention_count), updated_by=VALUES(updated_by)');
        $statement->execute([!empty($body['enabled']) ? 1 : 0, $frequency, $localTime, $body['dayOfWeek'] ?? null, $body['dayOfMonth'] ?? null, $body['customCron'] ?? null, $retention, auth_require()['id']]);
        json_response(backup_settings_row(db()->query('SELECT * FROM backup_settings WHERE id = 1')->fetch()));
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
    return ['id' => 1, 'enabled' => (bool)($row['enabled'] ?? false), 'frequency' => $row['frequency'] ?? 'daily', 'localTime' => $row['local_time'] ?? '02:00', 'dayOfWeek' => isset($row['day_of_week']) ? (int)$row['day_of_week'] : null, 'dayOfMonth' => isset($row['day_of_month']) ? (int)$row['day_of_month'] : null, 'customCron' => $row['custom_cron'] ?? null, 'timezone' => 'Asia/Baghdad', 'retentionCount' => (int)($row['retention_count'] ?? 14), 'updatedBy' => isset($row['updated_by']) ? (int)$row['updated_by'] : null, 'updatedAt' => isset($row['updated_at']) ? iso_timestamp($row['updated_at']) : null];
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