<?php

declare(strict_types=1);

/*
 * Copy this file to config.php outside public_html and fill in the MariaDB
 * values created in cPanel. Never commit config.php or place it in public_html.
 */
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'kamayqjd_rawand',
        'user' => 'kamayqjd_rawand',
        'password' => '',
    ],
    'app' => [
        'timezone' => 'Asia/Baghdad',
        'allowed_origin' => '',
        'bootstrap_token' => '',
        'session_idle_seconds' => 28800,
        'login_max_attempts' => 5,
        'login_ip_max_attempts' => 30,
        'login_lock_minutes' => 15,
    ],
];