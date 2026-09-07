#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/app/bootstrap.php';
require_once dirname(__DIR__) . '/app/backups.php';

function cron_matches(string $field, int $value): bool
{
    return $field === '*' || in_array((string)$value, explode(',', $field), true);
}

$setting = db()->query('SELECT * FROM backup_settings WHERE id = 1')->fetch();
if (!$setting) {
    exit(0);
}
$now = new DateTimeImmutable('now', new DateTimeZone('Asia/Baghdad'));
$slot = $now->format('H:i');
$decodeTimes = static function (mixed $raw): array {
    $times = is_string($raw) ? json_decode($raw, true) : $raw;
    if (!is_array($times)) return [];
    $valid = array_filter($times, static fn($time): bool => is_string($time) && preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time));
    return array_values(array_unique($valid));
};
$reportTimes = $decodeTimes($setting['telegram_daily_report_times'] ?? '[]');
$sendTimes = $decodeTimes($setting['telegram_backup_send_times'] ?? '[]');
$lastDay = $now->format('j') === $now->modify('last day of this month')->format('j');
$dailyReport = (bool)($setting['telegram_daily_report_enabled'] ?? false) && in_array($slot, $reportTimes, true);
$monthEndReport = (bool)($setting['telegram_monthly_report_enabled'] ?? false) && $lastDay && $slot === '23:30';
$previousMonthReport = (bool)($setting['telegram_monthly_report_enabled'] ?? false) && $now->format('j') === '1' && $slot === '09:00';
$latest = db()->query('SELECT id, archive_path, checksum_sha256 FROM backup_jobs WHERE status = "completed" AND archive_path IS NOT NULL AND checksum_sha256 IS NOT NULL ORDER BY completed_at DESC LIMIT 1')->fetch();
if ($dailyReport || $monthEndReport || $previousMonthReport) {
    try {
        $start = $monthEndReport ? $now->format('Y-m-01') : ($previousMonthReport ? $now->modify('first day of last month')->format('Y-m-01') : $now->format('Y-m-d'));
        $end = $previousMonthReport ? $now->modify('last day of last month')->format('Y-m-d') : $now->format('Y-m-d');
        $title = $monthEndReport ? 'مانگی ئێستا' : ($previousMonthReport ? 'مانگی پێشوو' : 'ڕۆژانە');
        if ((bool)($setting['telegram_attach_backup'] ?? true)) {
            if (!$latest) {
                db()->prepare('INSERT INTO backup_jobs (kind) VALUES ("scheduled")')->execute();
                $createdId = (int)db()->lastInsertId();
                backup_execute($createdId);
                $statement = db()->prepare('SELECT id, archive_path, checksum_sha256 FROM backup_jobs WHERE id = ? AND status = "completed"');
                $statement->execute([$createdId]);
                $latest = $statement->fetch();
            }
            if (!$latest) throw new RuntimeException('Report backup could not be completed.');
            backup_verify((string)$latest['archive_path'], (string)$latest['checksum_sha256']);
            backup_telegram_report(backup_crm_report($start, $end, $title), ['path' => $latest['archive_path']]);
        } else {
            backup_telegram_report(backup_crm_report($start, $end, $title));
        }
    } catch (Throwable $error) {
        fwrite(STDERR, "Scheduled Telegram report failed: " . backup_safe_error($error) . "\n");
    }
}
if (in_array($slot, $sendTimes, true)) {
    if ($latest) {
        backup_telegram((int)$latest['id'], (string)$latest['archive_path'], (string)$latest['checksum_sha256']);
    } else {
        fwrite(STDERR, "Scheduled Telegram backup delivery skipped: no completed backup.\n");
    }
}
$due = $now->format('H:i') === $setting['local_time'];
if ($setting['frequency'] === 'weekly') {
    $due = $due && (int)$now->format('w') === (int)$setting['day_of_week'];
} elseif ($setting['frequency'] === 'monthly') {
    $due = $due && (int)$now->format('j') === (int)$setting['day_of_month'];
} elseif ($setting['frequency'] === 'custom') {
    $fields = preg_split('/\s+/', trim((string)$setting['custom_cron']));
    $due = count($fields) === 5
        && cron_matches($fields[0], (int)$now->format('i'))
        && cron_matches($fields[1], (int)$now->format('G'))
        && cron_matches($fields[2], (int)$now->format('j'))
        && cron_matches($fields[3], (int)$now->format('n'))
        && cron_matches($fields[4], (int)$now->format('w'));
}
if (!(bool)$setting['enabled'] || !$due) {
    exit(0);
}

$scheduledFor = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:00');
try {
    db()->prepare('INSERT INTO backup_jobs (kind, scheduled_for) VALUES ("scheduled", ?)')->execute([$scheduledFor]);
} catch (PDOException $error) {
    if ((string)$error->getCode() === '23000') exit(0);
    throw $error;
}
$id = (int)db()->lastInsertId();
try {
    backup_execute($id);
    fwrite(STDOUT, "Scheduled backup #{$id} completed and verified.\n");
} catch (Throwable $error) {
    fwrite(STDERR, "Scheduled backup failed: " . backup_safe_error($error) . "\n");
    exit(1);
}