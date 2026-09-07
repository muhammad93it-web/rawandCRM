#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/app/bootstrap.php';
require_once dirname(__DIR__) . '/app/backups.php';

$kind = ($argv[1] ?? 'scheduled') === 'manual' ? 'manual' : 'scheduled';
try {
    db()->prepare('INSERT INTO backup_jobs (kind, scheduled_for) VALUES (?, UTC_TIMESTAMP(3))')->execute([$kind]);
    $id = (int)db()->lastInsertId();
    backup_execute($id);
    fwrite(STDOUT, "Backup #{$id} completed and verified.\n");
} catch (Throwable $error) {
    fwrite(STDERR, "Backup failed: " . backup_safe_error($error) . "\n");
    exit(1);
}