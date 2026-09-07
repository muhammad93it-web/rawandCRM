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
if (!$setting || !(bool)$setting['enabled']) {
    exit(0);
}
$now = new DateTimeImmutable('now', new DateTimeZone('Asia/Baghdad'));
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
if (!$due) {
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