# Rawand Decoration CRM

Fast Kurdish RTL business management for Rawand Decoration, rebuilt from a
read-only audit of the authorized legacy infoCRM installation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API
- `pnpm --filter @workspace/rawand-decoration-crm run dev` — run the web app
- `pnpm run typecheck` — full workspace typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API clients
- `pnpm --filter @workspace/db run push` — apply development schema changes
- Required env: `DATABASE_URL`

## Stack

- React, TypeScript, Vite, Tailwind CSS, TanStack Query, Wouter
- Express API with OpenAPI-generated clients and Zod validation
- PostgreSQL and Drizzle ORM in the Replit development/published version
- The requested final external target is Namecheap shared cPanel at
  `rawanddecoration.mang-herbal.com`; any cPanel-compatible PHP/MariaDB release
  must preserve the OpenAPI contract and business behavior.

## Where things live

- `artifacts/rawand-decoration-crm` — Kurdish RTL web application
- `artifacts/api-server/src/routes` — API handlers
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema` — database schema
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

## User preferences

- Kurdish RTL interface and the same user-facing workflows as the audited app.
- Prioritize extreme speed and cPanel portability.
- Never request or expose cPanel passwords in chat; use the secure secrets flow
  only when an authorized deployment step actually requires credentials.

## Gotchas

- Never guess hidden legacy accounting rules. Confirm currency, debt, return,
  stock-costing, permission, and print behavior before production parity claims.
- The first milestone does not yet include authentication or the full 74-route
  legacy surface.