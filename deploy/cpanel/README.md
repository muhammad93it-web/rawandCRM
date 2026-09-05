# Rawand Decoration CRM — cPanel package

This directory contains the first Node-free cPanel migration slice for
`rawand-decoration.com`. It is intentionally separate from the Replit
development runtime, which remains React + Express + PostgreSQL.

## API surface

The PHP/PDO front controller implements every path in
`lib/api-spec/openapi.yaml`, including authentication/session handling,
organization, catalog, accounting, invoices and workflow documents, stock
operations, reports, and deleted-record restoration. Import both numbered SQL
migrations in order. Responses use the same JSON field names and HTTP status
conventions as the Node API.

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