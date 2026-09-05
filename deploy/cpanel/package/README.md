# Rawand Decoration CRM — cPanel package

This directory contains the first Node-free cPanel migration slice for
`rawand-decoration.com`. It is intentionally separate from the Replit
development runtime, which remains React + Express + PostgreSQL.

## Included API surface

The PHP/PDO front controller currently implements:

- `GET /api/healthz`
- dashboard summary and activity
- accounts list/create/read/update/soft-delete
- items list/create/update/soft-delete and low-stock
- transactions list/create
- sales and purchases list/create, including atomic item quantity updates

All other OpenAPI paths return HTTP 501 with
`code: unsupported_cpanel_endpoint`. This is deliberate: do not present this
slice as full legacy parity or upload it as the final production release until
the remaining OpenAPI paths have PHP/MariaDB implementations and integration
tests.

## cPanel layout

1. Create the MariaDB database and database user in cPanel.
2. Import `database/001_core.sql`.
3. Copy `public/` contents into the domain's `public_html/`.
4. Copy `app/` and `config/` beside `public_html/`, not inside it.
5. Copy `config/config.example.php` to `config/config.php` and fill in the
   cPanel database values. Keep `config.php` outside Git and `public_html`.
6. Upload the built React files into `public/` using the package build script.

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