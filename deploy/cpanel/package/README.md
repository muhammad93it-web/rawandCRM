# Rawand Decoration CRM — cPanel package

This directory contains the first Node-free cPanel migration slice for
`rawand-decoration.com`. It is intentionally separate from the Replit
development runtime, which remains React + Express + PostgreSQL.

## API surface

The PHP/PDO front controller implements every path in
`lib/api-spec/openapi.yaml`, including authentication/session handling,
organization, catalog, accounting, invoices and workflow documents, stock
operations, reports, and deleted-record restoration. Import every numbered SQL
file in this exact ascending order:

1. `database/001_core.sql`
2. `database/002_full_domain.sql`
3. `database/003_security.sql`
4. `database/010_shell.sql`
5. `database/020_lookups.sql`
6. `database/030_backups.sql`
7. `database/030_invoice_creator.sql`

Responses use the same JSON field names and HTTP status conventions as the
Node API.

## cPanel layout

1. Create the MariaDB database and database user in cPanel.
2. Import every numbered SQL file in the ascending order listed above.
3. Copy `public/` contents into the domain's `public_html/`.
4. Copy `app/` and `config/` beside `public_html/`, not inside it.
5. Copy `bin/` beside `app/` and make the PHP CLI scripts executable.
6. Copy `config/config.example.php` to `config/config.php` and fill in the
   cPanel database values. Keep `config.php` outside Git and `public_html`.
7. Upload the built React files into `public/` using the package build script.

For an existing installation, import `database/030_invoice_creator.sql` before
uploading or replacing the updated API. Until that migration is imported,
invoice creation returns a `migration_required` response instead of attempting
an incompatible database write.

The same-origin `/api` path means the React app does not need a separate API
hostname. The `.htaccess` file provides both API routing and Vite SPA history
fallback.

## Build a package

From the repository root:

```sh
./scripts/build-cpanel-package.sh
```

The generated upload directory is `deploy/cpanel/package/`. The script does
not upload files, create databases, change DNS, or call cPanel.

## Encrypted backups and cron

Set `secrets.backup_encryption_key` in the private `config/config.php` to a
32-byte key encoded as 64 hexadecimal characters or base64. Telegram delivery
is optional: set `secrets.telegram_bot_token` and
`secrets.telegram_chat_id`, or the matching `TELEGRAM_BOT_TOKEN` and
`TELEGRAM_CHAT_ID` environment variables. Tokens are never stored in the
database or returned by the API.

In cPanel Cron Jobs, run the scheduler every minute (replace paths with the
account's absolute path):

```cron
* * * * * /usr/local/bin/php /home/ACCOUNT/rawand/bin/backup-scheduler.php >/dev/null 2>&1
```

The scheduler evaluates the saved daily, weekly, monthly, or five-field custom
schedule in `Asia/Baghdad`; the database unique key prevents duplicate runs.
The host must provide PHP 8.1+, OpenSSL and zlib extensions, `proc_open`, and
the `mysqldump` executable. Archives are streamed through gzip and
chunk-authenticated AES-256-GCM without writing a plaintext dump. The archive
SHA-256 and every GCM tag are verified before a job is completed.

Restore preparation is exposed to administrators, but intentionally performs
no restore. It takes a mandatory pre-restore backup under a maintenance lock
and verifies the selected source. An actual MariaDB import must use the
pre-restore archive as rollback after any partial-import failure; an actual
PostgreSQL restore should run in a transaction where the selected dump format
permits it and restore the safety archive if it cannot commit.
