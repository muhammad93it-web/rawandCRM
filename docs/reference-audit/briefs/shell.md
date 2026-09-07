# Brief — area «shell» (foundation for the 1:1 parity rebuild)

You are rebuilding the application shell and the shared UI kit of the Rawand Decoration CRM web app
(`artifacts/rawand-decoration-crm`, React 19 + Vite + wouter + TanStack Query + Tailwind v4 + shadcn) so
that it matches the reference system **exactly**. Everything you build is the foundation seven other
area teams will use immediately afterwards, so the contracts in `docs/reference-audit/PARITY-PLAN.md`
§4 (component names, props) and §6 (file ownership) are binding.

Read first, in this order:
1. `docs/reference-audit/PARITY-PLAN.md` (all of it).
2. `docs/reference-audit/screens/shell.md` (28 shell screens incl. `ix-header-*` interaction captures).
3. Screenshots: `screenshots/reference/home-1440.png`, `ix-header-GlobalNavButton-1392.png` (expanded
   drawer), `ix-header-btn-16.png` (profile menu), `ix-header-AllCurrency-188.png` (currency dialog),
   `ix-header-btn-586.png` + `ix-header-search-typed.png` (search palette), `ix-header-FavoriteStarFill-56.png`
   (favourites drawer), `ix-favorites-panel.png` (floating tab hover), `ix-header-TagUnknown12-144.png`
   (price lookup drawer), `ix-header-ChromeClose--595.png`, `ix-header-SignOut-20.png`,
   `login-kurdish-1440.png`, `login-1440.png`, `sales-1440.png` / `purchases-1440.png` / `storehouse-1440.png`
   (index pages with link cards), `reports-1440.png` + `reports-expanded.png` (accordion groups),
   `salelist-1440.png` (list page: toolbar + table look), `ix-salelist-toolbar3-Filter.png` (filter drawer),
   `addsale_l9gzm_l9gzm-1440.png` (form look: fields grid, buttons), `accounts-1440.png`.
4. `docs/reference-audit/computed-styles.json` and `docs/reference-audit/css/main.css` (exact CSS values:
   `.sidebar`, `.top-row`, `.nav-item`, `.cardClass`, `article`, `.zoom110`, table styles). Do not copy the
   `@font-face` of the commercial fonts.
5. Current code: `src/App.tsx`, `src/components/layout/*`, `src/index.css`, `src/lib/language.ts`,
   `src/hooks/use-usd-rate.ts`, `src/pages/login.tsx`, `src/pages/home.tsx`, one list page
   (`src/pages/sales-list.tsx`) and one form page (`src/pages/accounts-new.tsx`) to see the current patterns.

## Deliverables

### A. Design tokens & global CSS (`src/index.css`)
* Tajawal for everything (already imported); base 16px/24px, colour #212529, RTL by default.
* CSS variables for the tokens in PARITY-PLAN §2 (navy, accent, tile colours, borders, orange, chips).
* Font-size classes `zoom100/zoom110/zoom120` applied to the page frame; dark theme variables from
  `css/Dark.css` under `html.dark`; `@media print` rules for the print frames.
* Remove styles that only served the old tab bar / old header.

### B. Layout (`src/components/layout/`)
* `app-layout.tsx`: top bar (56px navy) + right rail (64px, expands to the labelled drawer) + white page frame
  `<article>` exactly as §2/§3. **Delete the browser-style tab bar** — the reference has none.
* `top-bar.tsx`: hamburger, back/forward, breadcrumb (from the navigation registry, current item orange,
  middle items collapsed to "..." when more than 3), centre search box with the command-palette dropdown
  (matches registry titles/keywords, keyboard navigation, Enter navigates), left cluster: currency badge,
  price-lookup button, fullscreen (Fullscreen API), favourites star (opens the favourites drawer), profile
  button with the dropdown menu described in §3.2 (logout, change-password dialog, lock screen, language,
  font size, appearance with system/light/dark, about with our version string `1.0.0`).
* `sidebar.tsx`: rail items from the registry (§3.4) with tooltips when collapsed, labels when expanded;
  active state by section; our logo at the top.
* `currency-dialog.tsx` (§3.3), `price-lookup-drawer.tsx` (§3.1 item 5 — use the existing items API for the
  comboboxes and warehouse stock; prices in $ and IQD converted with the latest rate), `favorites-drawer.tsx`,
  `floating-favorite-tab.tsx` (§3.5), `lock-screen.tsx`, `change-password-dialog.tsx`, `offline-banner.tsx`.
* Mobile (<768px): rail hidden behind the hamburger as an overlay drawer, top bar wraps like the reference
  (`screenshots/reference/*-mobile*.png` if present; otherwise keep it sensible).

### C. Shared UI kit `src/components/crm/` — every component in PARITY-PLAN §4 with the listed props
Build them on top of the existing shadcn primitives where helpful (Dialog, Popover, Command, Select…), but
the **rendered look must be the Fluent look of the reference** (32px controls, 4px radius, label above,
required star, navy table header with 8px top radii, sort glyph, etc.). Provide:
`Icon` (+ `icons.tsx` mapping table for all 93 MDL2 names in §3.4 → `@fluentui/react-icons` Regular icons),
`PageTitle`, `SectionTitle`, `NavTile`/`TileGrid`, `LinkCard`/`LinkCardList`, `CrmTabs`, `Toolbar`,
`DataTable`, `FilterDrawer`, `Pager`, form fields (`TextField`, `NumberField`, `SelectField`,
`ComboboxField`, `TextAreaField`, `CheckboxField`, `RadioGroupField`, `DateField`, `DateTimeField`),
`FormGrid`/`FormRow`, buttons (`AccentButton`, `OutlineButton`, `StealthButton`, `IconButton`,
`DangerIconButton`), `CrmDialog`, `ConfirmDialog`, `StatusChip`, `KpiCard`, `Money`/`Qty`/`DateText`
(+ `src/lib/format.ts`: `formatMoney(n, {currency:'IQD'|'USD'})`, `formatQty`, `formatDate` → `dd-MM-yyyy`,
`formatDateTime`, `formatTime`), `PrintFrame`, `EmptyState` (ReportWarning icon + «هیچ زانیاریەک بەردەست نییە»).
Export everything from `src/components/crm/index.ts`. Write a short `src/components/crm/README.md` with a
usage example for a list page (Toolbar + DataTable + FilterDrawer) and a form page (FormGrid + fields +
AccentButton) so area teams copy the same pattern.

`DataTable` must support: `columns` with `render`, `sortable` (client sort), column hiding through the
«شاردنەوەی کۆڵۆمەکان» multi-select, `searchable` (client filter over `searchText(row)`), `pageSize` select
(25/50/75/100) + `Pager`, `emptyText`, `footer` totals row, `rowActions` cell, `dense` mode, `loading` state
(skeleton rows), and RTL-correct alignment (numbers right-aligned, actions at the far right).

### D. Navigation registry `src/lib/navigation.ts`
Every reference route (list below) with `{ path, title, icon, parent, section, keywords }`; helpers
`findNavItem(path)`, `breadcrumbFor(path)`, `searchNav(text)`, `SECTIONS` for the rail, `HOME_GROUPS` for
the tiles, and per-index-page link groups (exact order/labels/icons from `docs/reference-audit/<index>.json` →
`links`: usermanagement, accountinfo, accounting, storehouse, purchases, sales, comparestore, reports (7
accordion groups, see `reports-expanded.json`), deletedlogs, profitandlossdashboard, generalconfigurations
is a tabbed page — not an index).

### E. Routes and page files
* Reorganise `src/pages/` into area folders (`git mv`, update imports):
  `shell/` (home, login, not-found, index pages), `config/`, `org/`, `accounts/`, `items/`, `sales/`,
  `purchases/`, `accounting/`, `dashboard/`, `reports/`, `deleted/` following PARITY-PLAN §6. Keep the
  existing page components working inside the new layout (they will be rewritten by the area teams; a
  cosmetic mismatch is fine, a crash is not).
* `src/App.tsx`: one `<Route>` per reference route (list below), grouped in marked blocks per area
  (`{/* ==== AREA: sales ==== */}` … `{/* ==== END AREA: sales ==== */}`). Routes that have no page yet get a
  stub component `src/pages/<area>/<page>.tsx` rendering `<PageTitle>` with the exact Kurdish title from the
  registry and an `EmptyState`. Route matching must be **case-insensitive** on the path (the reference links
  to both `Workplaces` and `workplaces`, `Dashboard`/`dashboard`, `Storeconfig`, `AddDebt`, `ReportXxx`) — use a
  wouter `parser` that compiles patterns with the `i` flag. Ids keep their case. `/` redirects to `/home`.
* Login page (`src/pages/shell/login.tsx`) per §3.6: plain username text field (no dropdown), password with
  eye toggle, «چوونەژوورەوە», language buttons; keep using the generated `useSessionLogin`; remove the
  `/api/session/users` dropdown usage (the endpoint may stay).
* Home page per §3.7 (title «Rawand Decoration CRM», groups «گشتی» and «CRM», exact tile order/icons/hrefs
  from `docs/reference-audit/home.json`).
* Index pages (`src/pages/shell/*-index.tsx`) using `LinkCardList` with the exact groups/labels/icons.
  `reports` uses Bootstrap-style accordions (collapsed groups with chevrons, see `reports-1440.png` and
  `reports-expanded.png`); `deletedlogs` and `profitandlossdashboard` are simple link lists.
* 404 page in the same frame.

### F. Backend for the shell (Express + PHP mirror)
* Drizzle `lib/db/src/schema/shell.ts`: `currency_rates` (id, currency_id → currencies.id, rate numeric(18,4),
  rate_date date, recorded_by_user_id → users.id, created_at) and `user_favorites` (id, user_id, path, title,
  sort_order, created_at, unique(user_id, path)). Export from `schema/index.ts` inside the AREA block; push
  with `pnpm --filter @workspace/db run push`.
* OpenAPI (inside the `shell` marker blocks of `lib/api-spec/openapi.yaml`):
  `GET /currency-rates?currencyId=` (newest first, includes `recordedByName`), `POST /currency-rates`,
  `DELETE /currency-rates/{id}`, `GET /currency-rates/latest` (latest USD rate, 404 when none),
  `GET /favorites`, `POST /favorites {path,title}`, `DELETE /favorites/{id}`,
  `GET /items/price-lookup?barcode=|itemId=` (prices + per-warehouse stock; reuse existing tables),
  `GET /session/login-info` (login time for the profile menu) if not already available from `/session/me`.
  Then `pnpm --filter @workspace/api-spec run codegen`.
* Express `artifacts/api-server/src/routes/shell/*.ts` mounted from the AREA block in `routes/index.ts`.
  Validate with the generated Zod schemas; keep the existing `requireAuth`.
* PHP mirror `deploy/cpanel/app/modules/shell.php` (same endpoints, PDO prepared statements) and
  `deploy/cpanel/database/010_shell.sql` (idempotent MariaDB DDL for both tables). `php -l` must pass.
* The currency badge, currency dialog, favourites and price lookup must use these endpoints through the
  generated hooks; `src/hooks/use-usd-rate.ts` becomes a thin wrapper over `useGetLatestCurrencyRate`
  (keep its export name so existing pages compile) and invalidates after a new rate is added.

### G. Docs
* Update `replit.md`: new layout/UI-kit structure, navigation registry, area folders, verification commands.
* Add `docs/reference-audit/CROSS-AREA.md` (empty table with columns: from-area, to-area, need, status).

## Rules
* Kurdish strings verbatim from the audit; no emojis; no sample data; no new npm packages beyond what is
  installed (`@fluentui/react-icons` is already added) — if you truly need one, use `pnpm --filter
  @workspace/rawand-decoration-crm add -D <pkg>` and say so in your report.
* Do not edit files owned by other areas except the mechanical `git mv`/import fixes described above.
* Keep both workflows running; after big changes restart `artifacts/rawand-decoration-crm: web` and
  `artifacts/api-server: API Server` and check their logs and the browser console.
* Verification before you report: `pnpm run typecheck`; `pnpm --filter @workspace/api-server run build`;
  codegen is clean; `php -l` on your module; `bash scripts/build-cpanel-package.sh` succeeds;
  `node scripts/src/ref-audit/capture-local.mjs home login sales purchases storehouse reports deletedlogs usermanagement accountinfo accounting comparestore profitandlossdashboard salelist accounts`
  and compare each capture with the reference screenshot at the same viewport — fix mismatches in structure,
  order, colours, sizes. Test the header interactions manually through the API (add a currency rate, add a
  favourite, remove it, lock/unlock, change font size, dark mode, search palette).
* Report: what you built (files), the component API summary, what deviates from the reference and why,
  and anything the area teams must know (e.g. how to register a new route, how to add filter fields).

## Reference route list (all must exist in App.tsx; area in brackets)
```
[shell]      / home login usermanagement accountinfo accounting storehouse purchases sales comparestore
             reports deletedlogs profitandlossdashboard ProfileUser changepassword
[config-org] workplaces workplace/:id users user/:id groups employeelist addemployee/:id drivers
             generalconfigurations Storeconfig accountconfiguration accountingconfigurations purchaseissueconfig
[accounts]   accounts account/:id reportaccounts accountolddebitsell accountolddebitpurchase AddDebt
[items]      items item/:id services serviceitem/:id transferitem/:id transferitemlist storeregister/:id
             storeregistrylist reportcheckinventory reportstockbalancesheet
[sales]      addsale/:id/:kind salelist saletalaflist selloffer addselloffer/:id sellinvoiceclusting/:id
[purchases]  addpurchase/:id/:kind purchaseinvoices purchaseorders addpurchaseorder/:id addpurchasepayment/:id
[accounting] income expense profitsAndLosses profitAndLossesbalance addProfitAndLoss/:id
             addProfitAndLossbalance/:id boxtransactionreport dashboard
[reports]    storereports reportitemexpose reportminqty reportstockbystorename reportstockperstore
             reportstockandpurchase reportitemsTransfer reportexpenses reportexpensebytype reportincome
             reportpurchaseaccountstatement reportsaleaccountstatement reportpurchasesaleaccountstatement
             reportaccountlastactivity reportdebts ReportpurchaseDebts ReportsellDebts reportdebtslateamount
             reportdebtslatetime reportdailysale reportsaleitemshistory reportsaleitemsreturn
             reportsellbytotaltypes reportsaleinvoices reportsaleitemshistorysummed ReportEmployeePerSell
             ReportMostSaleItemByUser ReportSellInvoicePerUser ReportDamageItems reportpurchaseitemshistory
             reportpurchaseinvoices reportpurchaseitemshistorysummed ReportemployeePerInvoice
             reportpurchasesellitemsummarize reportprofit reportprofitsummary reportcashboxbalance
[deleted]    deletedexpenses deletedincomes deletedpurchaseinvoices deletedpurchaseitems deletedsaleinvoices
             deletedsaleitems
```
The reference's `L9Gzm` id means "new"; our pages use `0` for new (`/addsale/0/0`) and must also treat
`L9Gzm` as "new" when it appears in a path. `kind` codes: sales `L9Gzm` (normal sale), `NmLpm`, `lqy5q`,
`pbnKq`; purchases `L9Gzm`, `Aq5Zm` — the sales/purchases teams will map them; you only route them.
