# Rawand Decoration CRM

Fast Kurdish RTL business management for Rawand Decoration, rebuilt from a
read-only audit of the authorized legacy infoCRM installation.

## Run & Operate

- Preview runs through the managed artifact workflows (registered from
  `artifacts/*/.replit-artifact/artifact.toml`); restart them instead of
  running dev commands by hand:
  - `artifacts/api-server: API Server` — Express API on `/api`
  - `artifacts/rawand-decoration-crm: web` — Vite web app on `/`
- `pnpm install --frozen-lockfile` — install workspace dependencies
- `pnpm run typecheck` — full workspace typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API clients
- `bash scripts/build-cpanel-package.sh` — build the PHP/MariaDB release
  package in `deploy/cpanel/package/`
- Required env: `DATABASE_URL` (runtime-managed), `SESSION_SECRET`
- Managed workflows only build and start the services. They never push a schema,
  create an administrator, reset credentials, or otherwise mutate the database.


### Intentional database and administrator setup

Run the following commands only when deliberately provisioning or updating a
development PostgreSQL database; they are not startup steps:

```sh
## Stack

- React, TypeScript, Vite, Tailwind CSS, TanStack Query, Wouter
- Express API with OpenAPI-generated clients and Zod validation
- PostgreSQL and Drizzle ORM in the Replit development/published version
- The requested final external target is Namecheap shared cPanel at
  `rawand-decoration.com`; any cPanel-compatible PHP/MariaDB release
  must preserve the OpenAPI contract and business behavior.

## Where things live

- `artifacts/rawand-decoration-crm` — Kurdish RTL web application
- `artifacts/api-server/src/routes` — API handlers
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema` — database schema
- `artifacts/rawand-decoration-crm/src/components/layout` — the 56px top bar, right navigation rail,
  favourites/currency/price drawers, profile controls, lock screen, and offline state
- `artifacts/rawand-decoration-crm/src/components/crm` — shared Fluent-look RTL page, form, table,
  dialog, navigation, formatting, and print components
- `artifacts/rawand-decoration-crm/src/lib/navigation.ts` — canonical route titles, icons,
  breadcrumbs, navigation search, home groups, and sidebar sections
- Page ownership follows the area folders under `src/pages`: `shell`, `config`, `org`, `accounts`,
  `items`, `sales`, `purchases`, `accounting`, `dashboard`, `reports`, and `deleted`. Register a route
  in its marked area block in `App.tsx`, then add its title/icon/parent/keywords to the registry.

## Parity verification

Run these before handing an area to another team:

```sh
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-spec run codegen
php -l deploy/cpanel/app/modules/<area>.php
bash scripts/build-cpanel-package.sh
node scripts/src/ref-audit/capture-local.mjs <routes...>
```
- `.local/conversation-workspace/files/site-audit-auth` — authorized legacy
  audit inventories and reference captures

## Architecture decisions

- Keep expensive PDF, chart, editor, and map features route-lazy; they must not
  load on login or unrelated screens.
- Use server-side filtering/pagination and indexed business tables as data
  grows.
- Transactional invoice writes update stock atomically.
- Use soft deletion for master data and add an audit trail before production.
- Preserve Kurdish RTL workflows while avoiding the legacy app's overlapping
  frontend frameworks.

## Product

The current milestone includes a real-data dashboard, customer/supplier
accounts, inventory and low-stock monitoring, sales and purchase invoice
creation with stock updates, and income/expense transactions.

Administrative database backups are persisted as jobs, gzip-compressed and
AES-256-GCM encrypted, then SHA-256/GCM verified. Scheduling always uses
Asia/Baghdad. `BACKUP_ENCRYPTION_KEY` is required for backup creation;
`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are optional and must remain in
environment secrets/private cPanel config. Restore preparation creates a
mandatory safety backup and verifies the source, but does not execute a restore.

## User preferences

- Explain project status, technical terms, and next steps in clear Kurdish. Keep
  English words out of Kurdish RTL lines because mixed bidi text becomes hard to
  read. When an English term is necessary inside a Kurdish sentence, keep it in
  its semantic place but put it alone on its own LTR/code line, then continue the
  Kurdish sentence on the next line; never leave an English-only task title or
  explanation without context.
- Reproduce the audited infoCRM UI and observable workflows 1:1; do not
  reinterpret, modernize, simplify, or rearrange even small visible details.
- The only approved branding difference is replacing the infoCRM name/logo with
  Rawand Decoration CRM in the same visual role and position.
- Never seed or invent sample customers, suppliers, items, invoices, balances,
  transactions, or dashboard values unless the user explicitly authorizes it.
- Prioritize extreme speed and cPanel portability.
- Never request or expose cPanel passwords in chat; use the secure secrets flow
  only when an authorized deployment step actually requires credentials.

## Gotchas

- Never guess hidden legacy accounting rules. Confirm currency, debt, return,
  stock-costing, permission, and print behavior before production parity claims.
- The first milestone does not yet include authentication or the full 74-route
  legacy surface.

# Explicitly replace the administrator password (never done by workflows).
pnpm --filter @workspace/scripts run create-admin -- --reset-password
```

For SQL-first PostgreSQL deployments, apply committed migrations explicitly and
stop on the first SQL error:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f lib/db/migrations/0001_add_invoice_creator.sql
```

The migration is idempotent and adds `invoices.created_by_user_id`, its index,
and its foreign key to `users`. Git transfers do not include database rows or
Secrets; restore a database backup and intentionally run the setup commands
when moving an existing installation.
- Smoke check: `curl localhost:80/api/healthz` returns `{"status":"ok"}`;
  `/api/accounts` without a session returns 401.


# Reconcile the Drizzle schema with the selected development database.
pnpm --filter @workspace/db run push


# Create the administrator only when it is absent.

# ADMIN_PASSWORD must be supplied through the secure secrets environment.
pnpm --filter @workspace/scripts run create-admin -- --if-missing
