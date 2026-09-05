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
        'timezone' => 'UTC',
        'allowed_origin' => '',
    ],
];