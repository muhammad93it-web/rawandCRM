# Rawand Decoration CRM — 1:1 parity plan with the infoCRM reference

The client wants **every screen, tab, icon, button and behaviour** of the reference system
(`https://kamaldecorate.informatic.services/`, a Blazor Server app, Kurdish/RTL UI) reproduced
in this project. Only the branding changes: the product is called **Rawand Decoration CRM**
(replace the "infoCRM" word-mark/logo and "Powered by Informatic Company").

This document is the single source of truth for everybody working on parity.
Read it fully before touching code.

## 0. Non-negotiable rules

1. **Reproduce, don't redesign.** Same page structure, same Kurdish labels (copy them verbatim from the
   audit JSON / screenshots — never re-translate), same button order, same colours, same table columns,
   same tabs, same dialogs/drawers, same empty-state behaviour. RTL everywhere (`dir="rtl"`).
2. **Never seed sample/demo data.** The database contains only the admin user. Every screen must work
   with real (initially empty) data and show exactly what the reference would show with no rows.
3. **No hard-coded numbers/strings pretending to be data** (no fake KPIs, no fake rates). Empty → 0 / empty table.
4. **Kurdish digits/number formatting as in the reference**: Western digits (0-9), thousands separators
   `1,540`, decimals up to 3 places, dates `dd-MM-yyyy`, times `hh:mm:ss tt` (see screenshots).
5. **Icons**: the reference uses the Fabric MDL2 icon font (`ms-Icon--Name`). Its licence only permits
   use in apps that integrate Microsoft services, so we do **not** ship that font. Use the MIT-licensed
   **Fluent UI System Icons** (`@fluentui/react-icons`, already installed in the web app) through the
   shared `<Icon name="…">` component, which maps every MDL2 name used by the reference (93 names, see §3.4)
   to the closest Fluent System icon (Regular weight, 16–20 px).
6. **Fonts**: the reference embeds the commercial *PF DIN Text Universal* (family `info`). We use
   **Tajawal** (DIN-inspired, Kurdish/Arabic + Latin) for everything; digits and Latin also in Tajawal
   so the "1,540 $" badge, invoice numbers etc. look like the reference.
7. Each area works only in its own files (see §6 ownership). Shared files are edited with small,
   targeted insertions only (never rewrite `openapi.yaml`, `routes/index.ts`, `schema/index.ts`,
   `App.tsx`, `generic.php`, `index.php` wholesale).
8. Every backend change is made **twice**: Express + Drizzle + OpenAPI (dev on Replit) **and** the
   Node-free PHP/PDO/MariaDB mirror in `deploy/cpanel/` (production on the client's cPanel). Same
   URL, same JSON shape, same status codes.
9. Verify visually against the reference at the same viewport (1440×900) using
   `node scripts/src/ref-audit/capture-local.mjs <routes…>` and compare with
   `screenshots/reference/<name>-1440.png` (see §8). Layout must not be mirrored: check the explicit
   left/right order of toolbar controls against the reference capture.
10. Do not use emojis anywhere in the UI. Do not add features the reference does not have.

## 1. Where the reference audit lives

| What | Where |
|---|---|
| Screen inventory (auto-generated, one section per screen: route, breadcrumb, tabs, buttons with icon + x,y,w,h, links, table columns, fields, visible text) | `docs/reference-audit/SCREENS.md` |
| Raw DOM summary per screen | `docs/reference-audit/<name>.json` (`<name>` = route lower-cased, `/`→`_`; `-tabN` = N-th tab; `-filter` = the filter drawer of a list) |
| Screenshots 1440×900 | `screenshots/reference/<name>-1440.png`, full page `<name>-1440-full.png`, 1440×2600 `<name>-tall.png`, tabs `<name>-tabN.png`, filter drawer `<name>-filter.png` |
| Interaction captures (header menus, currency dialog, search palette, row menus, invoice page buttons) | `screenshots/reference/ix-*.png` + `docs/reference-audit/ix-*.json` |
| Computed CSS of shell elements | `docs/reference-audit/computed-styles.json` |
| The reference's own stylesheets (for exact values; do not copy the commercial font faces) | `docs/reference-audit/css/main.css`, `Dark.css`, `print.css`, `app.css` |
| Our app captures (same summariser) | `screenshots/current/`, `docs/reference-audit/current/` |

`L9Gzm` in reference routes is the encoded id for "new/0". Our routes use `0` (e.g. `/addsale/0/0`) but must
also accept the reference's literal path shape (`/addsale/:id1/:id2`).

## 2. Design tokens (measured on the reference)

```
Top bar            height 56, background #004578 (Fluent themeDarker), padding 16, no border
Sidebar rail       width 64 (collapsed), background #004578, full height, on the RIGHT (RTL start side)
  nav link         48×48, radius 8, icon 16px; colour #d7d7d7, active: colour #fff + bg rgba(255,255,255,.063)
  expanded         hamburger toggles a 200px labelled drawer (see ix-header-GlobalNavButton-1392.png):
                   label 14.4px right-aligned, icon on the right, active row lighter
Page frame         <article> white, border 1px #deecf9, radius 4, padding 16; it starts directly under the
                   top bar and touches the rail; 16px white gap on the left and at the bottom (page bg
                   white). With the drawer expanded (≈250px) the article shrinks (ix-header-GlobalNavButton-1392.png).
                   Body font 16px/24px, colour #212529.
Empty state        an empty table shows one full-width row: ReportWarning icon (orange) + "هیچ زانیاریەک بەردەست نییە"
                   (see ix-header-TagUnknown12-144.png bottom); no other empty-state art.
Page title         h3 28px/500 (list & form pages) — "پسووڵەکانی فرۆشتن"; home title h1 40px/500
Section title      h4 24px/500 ("گشتی", "CRM", "زانیاریە گشتییەکان")
Breadcrumb (top bar) 16px, white items, current page in orange #f7630c, separators "‹", "..." for
                   collapsed middle items; back/forward chevron buttons (32×24) next to it
Accent colour      #036ac4 (fluent accent-fill-rest); primary #005a9e; link/tile text #0071c1;
                   tile icon #0078d4; orange #f7630c (favourite star, breadcrumb current); success
                   chip #107c10 (کاش), grey chip #6c757d (گەڕانەوە); danger #dc3545
Tiles (home/index) anchor "card": bg #f8fcff, border 1px #deecf9, radius 8, height 62, 4 per row
                   (grid col-3 with 16px gutters), text 16px #0071c1 right-aligned, icon 16px in a
                   48px square on the RIGHT edge separated by a 1px #deecf9 vertical line
Link rows (index pages: sales, purchases, …) same card style, height 58, full width, one per row,
                   icon on the right, chevron/none on the left; grouped under h4 section titles
Buttons            fluent: height 32, radius 4, font 14px; accent = white on #036ac4; outline = 1px
                   #8a8a8a border, transparent; stealth = transparent icon button (36×32) in the top bar
                   (white icons on the blue bar) ; danger icon buttons red
Inputs             fluent-text-field: label 14px above (margin-bottom 4), control 32px, radius 4,
                   1px #929292 bottom accent line, total 56px; required fields get a red "*" after
                   the label (class custom-required); select/combobox 32px with chevron; textarea 88px
                   grid: Bootstrap row/col-sm-12 col-md-6 col-lg-4 col-xxl-3 (4 fields per row @1440)
Tables             thead: bg #004578, white bold 16px, padding 8, first/last cell radius 8 on top,
                   sort icon (↕) on every sortable header; tbody rows 60px tall (multi-line date cell),
                   14–16px, bottom border #deecf9, hover #f8fcff; numeric right-aligned; actions column
                   (stealth icon buttons) at the far right; a "Row/Page" select (25/50/75/100) + pager
                   ("«" "‹" 1 2 3 "›" "»") under the table on report pages
List toolbar       row above the table: on the far right the accent "زیادکردنی …" button (Add icon),
                   then "شاردنەوەی کۆڵۆمەکان" multi-select (hide columns), then search box (Search icon);
                   on the far left "جیاکردنەوە" outline button (Filter icon) and, on invoice lists, a
                   "سێ ڕۆژی ڕابردو" checkbox. Report pages add an export button (DownloadDocument icon)
                   and mode buttons (e.g. ڕۆژانە/مانگانە/ساڵانە, بە پسوڵەوە/بە وردەکاریەوە).
Filter drawer      Bootstrap offcanvas, 600px wide, slides in from the LEFT, title "جیاکردنەوە", close X
                   top-left, fields stacked full width, footer: accent "گەڕان" (Search icon) on the left,
                   "پاشگەزبوونەوە" (Clear icon, red X) on the right. Fields per page: `<name>-filter.json`.
Dialogs            centred white card, radius 8, title right-aligned, close X on the left, blurred
                   backdrop (see ix-header-AllCurrency-188.png)
Toasts             bottom-left, Fluent style (success green / error red), Kurdish text
Dark mode          "باری تاریک" swaps to the palette in css/Dark.css (bg #1b1a19, cards #292827)
Font size          100/110/120 % applied to the <article> (classes zoom100/zoom110/zoom120)
```

## 3. Application shell (must be pixel-faithful) — see home-1440.png, ix-header-*.png

### 3.1 Top bar (right → left, RTL)
1. Hamburger (GlobalNavButton) — toggles the sidebar between 64px rail and 200px labelled drawer.
2. Back "‹" (ChevronLeftMed) and forward "›" (ChevronRightMed) — browser history.
3. Breadcrumb: `پەڕەی سەرەکی › … › <parent> › <current in orange>`; items are links.
4. Centre: search box (216×32, white, placeholder "گەڕان", search icon on the right). Typing opens a
   dropdown palette listing all pages whose title contains the text (icon + title), Enter/click navigates
   (ix-header-btn-586.png, ix-header-search-typed.png).
5. Left cluster (from the left edge): "A" profile button (32×32 white square, first letter of the user
   name), favourite star (FavoriteStarFill, orange) which opens the favourites drawer "دڵخوازەکان"
   (ix-header-FavoriteStarFill-56.png: 600px left offcanvas, bg #f8fcff, one card per favourite page with
   icon on the right, title + small grey parent title, orange star on the left = remove), fullscreen
   (FullScreen), "TagUnknown12" = item price lookup drawer "نرخی کاڵاکان" (ix-header-TagUnknown12-144.png:
   barcode combobox with search + clear buttons, name combobox, زنجیرە / سریاڵ نەمبەر fields, price cards
   نرخی تاک / نرخی کۆ / نرخی تایبەت / نرخی زیاتر each with "$ : 0" and "IQD: 0", stock table بڕی هەبوو | مەخزەن,
   accent "گەڕان" button at the bottom), then the currency badge "$ 1,540" (AllCurrency icon, white pill
   86×32) showing the latest USD→IQD rate.
6. Offline banner text "ئینتەرنێت بەردەست نیە" (WifiWarning4) shown when `navigator.onLine` is false.

### 3.2 Profile menu (ix-header-btn-16.png) — dropdown under the "A" button, 130px wide
```
admin  (user name, blue, with a person icon)
چوونە دەرەوە            → logout
گۆڕینی وشەی نهێنی        → change-password dialog (old, new, confirm)
داخستن                  → lock screen (shows login for the same user)
── گۆڕینی زمان ──        English / کوردی (selected, blue bar) / عربي
── گۆڕینی قەبارەی فۆنت ── 100% (selected) / 110% / 120%
── دەرکەوتن ──           سیستەم / باری ڕووناک (selected) / باری تاریک
── دەربارە ──            بەشداریکردن  [318D badge]   وەشان  3.2.1   (use our own version string)
```
Language/font/theme are persisted per browser (localStorage) exactly like today's `src/lib/language.ts`.

### 3.3 Currency dialog (ix-header-AllCurrency-188.png) — "نرخی دراو"
Row of inputs: `جۆری دراو *` (select: dolar), `نرخ *` (number), `بەروار` (date, default today), then
"+" accent button (add rate) and red "×" (clear). Table: ناو | نرخ | تۆمارکراوە لە لایەن | بەروار
(date + time on two lines), newest first. Footer: "داخستن". Adding a rate creates a `currency_rates`
row (recorded by the current user); the badge shows the latest rate. This feature belongs to the
**shell** area (backend included).

### 3.4 Sidebar rail (top → bottom) — icon, label, route
```
Home                پەڕەی سەرەکی               /home
ViewDashboard       داشبۆرد                    /dashboard
CityNext2           شوێنکار                    /Workplaces
PlayerSettings      بەڕێوەبردنی بەکارهێنەر      /usermanagement
AccountManagement   زانیارییەکانی خاوەن حساب    /accountinfo
Settings            ڕێکخستنە گشتییەکان          /generalconfigurations
ChangeEntitlements  خەرجی و داهات               /accounting
Repo                کاڵاکان                     /storehouse
ShoppingCart        کڕین                        /purchases
ActivateOrders      فرۆشتن                      /sales
Packages            جەردکردنی مەخزەن            /comparestore
Financial           ڕاپۆرتەکان                  /reports
RecycleBin          زانیاریە سڕاوەکان           /deletedlogs
```
Logo at the top of the rail (our logo, 32px), word-mark "Rawand Decoration CRM" appears in the top bar
when the drawer is expanded (reference shows "infoCRM" there). Active item = page whose route starts
with the item's section.

MDL2 → Fluent System icon mapping must cover all names used by the reference:
Home ViewDashboard CityNext2 PlayerSettings AccountManagement Settings ChangeEntitlements Repo ShoppingCart
ActivateOrders Packages Financial RecycleBin GlobalNavButton ChevronLeftMed ChevronRightMed AllCurrency
TagUnknown12 FullScreen FavoriteStarFill FavoriteStar WifiWarning4 ClearNight SignOut Add Sort Filter
ReportWarning ChevronRightSmall ChevronLeftSmall ChromeClose DownloadDocument PageHeaderEdit
DoubleChevronLeft8 DoubleChevronRight8 Info Save Unlock PageCheckedOut PageCheckedin ReportDocument Cancel
Admin Group ProductList MapPin ReturnKey More Clear Search BackToWindow Edit Chart Delete Combobox Blocked
BulletedList EntryView WorkforceManagement PageEdit Upload NumberField CalculatorPercentage DeliveryTruck
Shield Car View Print History Script Money M365InvoicingLogo List DietPlanNotebook Paste ProfileSearch Bank
Compare EventAccepted EventDeclined Market FullHistory Undo ChromeMinimize LightningBolt PasswordField Lock
DoubleColumn ClearFilter GridViewMedium BulletedList2 LinkedInLogo ViewList

### 3.5 Favourites tab, lock screen, status texts
A floating orange tab with a star (bottom-left, 24×32, class add-to-fav-wrapper, see home-1440.png)
expands on hover to "دڵخوازکردن" (ix-favorites-panel.png) and, when clicked, adds the current page to
the user's favourites (toast). The header star opens the favourites drawer (§3.1). Favourites are stored
per user in the database (`user_favorites`: user_id, path, title, sort_order).
"داخستن" in the profile menu shows a lock screen (div.lock-screen: centred card with the user name in
24px blue, password field, "چوونەژوورەوە" button) covering the app until the password is re-entered.
The texts "admin / چوونەژوورەوە 13:29 07/09/2026 / Powered by …" live inside the profile menu / lock
screen, not in a page footer — there is no visible page footer.

### 3.6 Login page (login-1440.png — the only valid capture; login-kurdish-1440.png is blank)
Two-panel card, 640×385, centred horizontally, 16px from the top of a white page, 1px #dee2e6 border,
6px radius, soft shadow. **Left 60 %** = the hero photo (`src/assets/login-hero.png`, object-fit cover).
**Right 40 %** (background #f7fafd, 18px padding): logo mark + "Rawand Decoration CRM" (28px, weight
500) centred at the top; "Login" (20px); grey helper "Enter Username and Password to Login" (13px);
username field (Fluent underline style: no side borders, 1px bottom border that turns 2px #0f6cbd on
focus, person icon at the end); password field (same style, eye toggle at the end); full-width blue
#0f6cbd "Login" button (32px tall, 4px radius); "Language" label (15px) over three outlined 68px
buttons English / عربي / کوردی (active one has bold blue text). The page defaults to English exactly
like the reference; the language buttons switch *this page's* strings (کوردی: «چوونەژوورەوە», «ناوی
بەکارهێنەر و وشەی نهێنی بنووسە بۆ چوونەژوورەوە», «زمان») and persist the choice in localStorage.
No user dropdown. Error text in red under the button. Same session endpoints as today.

### 3.7 Home page (home-1440.png)
Title "Rawand Decoration CRM" (h1 40px, right-aligned) then two tile groups:
`گشتی`: داشبۆرد, بەڕێوەبردنی بەکارهێنەر, بەکارهێنەرەکان, شوێنکارەکان, کارمەندەکان
`CRM` (with the logo): کاڵاکان, کڕین, فرۆشتن, زانیارییەکانی خاوەن حساب, خەرجی و داهات, داهاتەکان,
خەرجیەکان, کاڵاکان(کۆگا), قازانج و زیانەکان, قەرزەکان, ڕاپۆرتەکان, زانیاریە سڕاوەکان, ڕێکخستنە گشتییەکان
(exact order, icons and hrefs in `docs/reference-audit/home.json` → `links`).

## 4. Shared front-end building blocks (built by the *shell* area, used by everybody)

All in `artifacts/rawand-decoration-crm/src/components/crm/` (one file per component, named exports):

| Component | Purpose / contract |
|---|---|
| `Icon` | `<Icon name="PageHeaderEdit" size={16} />` — MDL2 name → Fluent System icon (mapping table in `icons.tsx`) |
| `PageTitle` | h3 28px title (+ optional right-side actions slot), used by list/form pages |
| `SectionTitle` | h4 24px section heading with the thin divider line used on the reference |
| `NavTile` / `TileGrid` | home-page tiles (4 per row) |
| `LinkCard` / `LinkCardList` | full-width link rows used by index pages (sales, purchases, storehouse, …) |
| `CrmTabs` | fluent-style tabs (underline indicator, 16px, RTL) with `tabs=[{key,label,icon?}]`; state in the URL hash (`#tab=…`) so a tab can be linked |
| `Toolbar` | list toolbar layout (right cluster / left cluster) |
| `DataTable` | generic table: columns `{key,header,sortable,align,render,hidden}`, client-side sort, column hiding via the "شاردنەوەی کۆڵۆمەکان" multi-select, search box, optional `onFilter` (opens `FilterDrawer`), `pageSize` select + pager, `emptyText`, row action cells, footer totals row, `dense` mode for invoice item grids |
| `FilterDrawer` | 600px left offcanvas with title, children fields, footer buttons (گەڕان / پاشگەزبوونەوە) |
| `TextField`, `NumberField`, `SelectField`, `ComboboxField` (searchable, with the "🔍" side button pattern), `TextAreaField`, `CheckboxField`, `RadioGroupField`, `DateField`, `DateTimeField` | fluent-look form controls with label above, required star, error text; `ltr` prop for numeric/latin fields; all forward `name`/`value`/`onChange` so they work with react-hook-form `Controller` |
| `FormGrid` / `FormRow` | Bootstrap-like 12-col responsive grid (`cols={4}` → col-xxl-3) |
| `AccentButton`, `OutlineButton`, `StealthButton`, `IconButton`, `DangerIconButton` | fluent button looks; all accept `icon="Save"` |
| `CrmDialog` | dialog with title/close-X/footer as in §2 |
| `ConfirmDialog` | "دڵنیای لە سڕینەوە؟" style confirmation with سڕینەوە/پاشگەزبوونەوە |
| `StatusChip` | green/grey/red pill (کاش, گەڕانەوە, قەرز …) |
| `KpiCard` | dashboard KPI card (title, value, icon, colour) |
| `Money` / `Qty` / `DateText` | number/date formatting helpers rendering exactly like the reference |
| `Pager` | « ‹ 1 2 3 › » pager + Row/Page select |
| `PrintFrame` | wrapper that renders printable A4/receipt layouts (uses `css/print.css` rules) |
| `EmptyState` | the reference shows just an empty table body; keep it minimal |

Navigation registry `src/lib/navigation.ts`: every route with `{ path, title, icon, parent, group, keywords }`.
Used by the sidebar, breadcrumbs, search palette, favourites, home tiles and index pages. Titles are the
exact Kurdish strings from the audit.

Hooks: `useFavorites()`, `useCurrencyRate()`, `useUiPrefs()` (language/font/theme), `useAuthUser()`.

## 5. Backend conventions

### 5.1 Express + Drizzle + OpenAPI (Replit dev)
* One route file per area: `artifacts/api-server/src/routes/<area>/*.ts`, mounted once in
  `src/routes/index.ts` (add exactly one `router.use(...)` line in the block marked for your area).
* One schema file per area: `lib/db/src/schema/<area>.ts`, exported from `schema/index.ts` (one line).
  Keep existing tables; extend them with new nullable columns rather than creating parallel tables.
  Conventions: `serial` ids, `numeric(...,{mode:"number"})` money/qty, `timestamp with tz`
  `created_at/updated_at`, soft delete `deleted_at` (+`deleted_by_user_id`), `workplace_id` scoping,
  `created_by_user_id` where the reference shows "تۆمارکراوە لە لایەن".
* OpenAPI: `lib/api-spec/openapi.yaml`, OpenAPI 3.1, internal `$ref`s only. Each area has a marked block
  under `paths:` (`# ==== AREA: <area> paths ====`) and under `components.schemas:`
  (`# ==== AREA: <area> schemas ====`). Insert only inside your block. Use `operationId`s prefixed with
  your area's noun (`listSaleInvoices`, `createSaleInvoice`, …) — Orval turns them into hooks
  `useListSaleInvoices`, `useCreateSaleInvoice`, `getListSaleInvoicesQueryKey`.
* After editing the spec: `pnpm --filter @workspace/api-spec run codegen` (regenerates
  `@workspace/api-client-react` and `@workspace/api-zod`). Request bodies are validated with the generated
  Zod schemas (`safeParse` → 400 `{error, details}`), responses serialised through the generated response
  schema. Errors: 400 validation, 401 auth, 403 permission, 404 not found, 409 conflict, 500 explicit.
* DB: `pnpm --filter @workspace/db run push` (no migration files in dev). Never drop columns with data.
* Front-end talks to the API only through the generated hooks (never raw `fetch` except the existing
  session check).

### 5.2 PHP mirror (production on cPanel, no Node)
* `deploy/cpanel/app/modules/<area>.php` defines `function <area>_dispatch(string $method, string $path): bool`
  (returns `true` after responding, `false` if the path is not its own). `bootstrap.php` includes every
  file in `app/modules/`, and `public/api/index.php` calls each `<area>_dispatch` before falling back to
  the legacy handlers and `generic_dispatch`. Simple tables can instead be added to the `$map` in
  `generic.php` (one line) when the generic CRUD behaviour is sufficient.
* Schema: one numbered MariaDB file per area in `deploy/cpanel/database/`:
  `010_shell.sql`, `020_config_org.sql`, `030_accounts.sql`, `040_items_store.sql`, `050_sales.sql`,
  `060_purchases.sql`, `070_accounting.sql`, `080_reports.sql`, `090_dashboard.sql`. Idempotent
  (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`), utf8mb4, InnoDB,
  same column names as the Drizzle schema (snake_case).
* Same URL paths, query params, JSON field names (camelCase), status codes and error JSON as Express.
  Money as JSON numbers, dates as ISO strings. Use prepared statements only.
* `bash scripts/build-cpanel-package.sh` must keep succeeding (it builds the React app and packs `deploy/cpanel/`).

## 6. Areas and file ownership

| Area | Screens (reference routes) | Owns |
|---|---|---|
| **shell** | top bar, sidebar, footer, favourites, profile menu, currency dialog, search palette, login, home, all *index* pages (usermanagement, accountinfo, accounting, storehouse, purchases, sales, comparestore, reports, deletedlogs, profitandlossdashboard), 404, design tokens, shared components (§4), navigation registry, route table with stub pages for every reference route | `src/index.css`, `src/App.tsx`, `src/components/layout/**`, `src/components/crm/**`, `src/lib/navigation.ts`, `src/lib/format.ts`, `src/hooks/**`, `src/pages/home.tsx`, `src/pages/login.tsx`, `src/pages/index/**`; backend `routes/shell/*`, `schema/shell.ts` (`currency_rates`, `user_favorites`), `modules/shell.php`, `010_shell.sql` |
| **config-org** | workplaces, workplace/{id}, usermanagement children: users, user/{id}, groups, employeelist, addemployee/{id}, drivers; generalconfigurations (5 tabs), Storeconfig (12 tabs), accountconfiguration (9 tabs), accountingconfigurations (5 tabs), purchaseissueconfig | `src/pages/config/**`, `src/pages/org/**`, `src/routes/config-org.tsx`, `routes/config/*`, `routes/org/*`, `schema/config.ts`, `schema/organization.ts`, `modules/config_org.php`, `020_config_org.sql` |
| **accounts** | accounts, account/{id} (tabs: زانیارییەکانی خاوەن حساب / مافەکان / بەرپرسەکان), reportaccounts, accountolddebitsell, accountolddebitpurchase, AddDebt, **dashboard (4 tabs)** | `src/pages/accounts/**`, `src/pages/dashboard/**`, `src/routes/accounts.tsx`, `routes/accounts/*`, `routes/dashboard/*`, `schema/accounts.ts`, `modules/accounts.php`, `030_accounts.sql`, `090_dashboard.sql` |
| **items-store** | items, item/{id}, services, serviceitem/{id}, transferitem/{id}, transferitemlist, storeregister/{id}, storeregistrylist, reportcheckinventory, reportstockbalancesheet, comparestore children | `src/pages/items/**`, `src/routes/items.tsx`, `routes/items/*`, `schema/items.ts`, `schema/inventory.ts`, `modules/items_store.php`, `040_items_store.sql` |
| **sales** | addsale/{id}/{kind} (kinds: L9Gzm=sale, NmLpm=قەرز, lqy5q=گەڕانەوە, pbnKq=تەلەف — see briefs/sales.md), salelist (+ row menu: وردەکاری پسووڵە, edit, print), saletalaflist, selloffer, addselloffer/{id}, sellinvoiceclusting/{id}, invoice detail dialog, print layouts, **deletedsaleinvoices, deletedsaleitems** | `src/pages/sales/**`, `src/routes/sales.tsx`, `routes/sales/*`, `schema/sales.ts`, `modules/sales.php`, `050_sales.sql` |
| **purchases** | addpurchase/{id}/{kind} (L9Gzm=کڕین, Aq5Zm=گەڕانەوە), purchaseinvoices, purchaseorders, addpurchaseorder/{id}, addpurchasepayment/{id}, print layouts, **deletedpurchaseinvoices, deletedpurchaseitems** | `src/pages/purchases/**`, `src/routes/purchases.tsx`, `routes/purchases/*`, `schema/purchases.ts`, `modules/purchases.php`, `060_purchases.sql` |
| **accounting** | income, expense, profitsAndLosses, profitAndLossesbalance, addProfitAndLoss/{id}, addProfitAndLossbalance/{id}, boxtransactionreport, profitandlossdashboard, **deletedexpenses, deletedincomes** | `src/pages/accounting/**`, `src/routes/accounting.tsx`, `routes/accounting/*`, `schema/accounting.ts`, `modules/accounting.php`, `070_accounting.sql` |
| **reports** | the reports index + the 37 report pages under /reports (see SCREENS.md `reports` section for the 7 groups) | `src/pages/reports/**`, `src/routes/reports.tsx`, `routes/reports/*`, `modules/reports.php`, `080_reports.sql` (views only if needed) |

Routing contract: **every area owns one route table file** `artifacts/rawand-decoration-crm/src/routes/<area>.tsx`
(`shell.tsx`, `config-org.tsx`, `accounts.tsx`, `items.tsx`, `sales.tsx`, `purchases.tsx`, `accounting.tsx`,
`reports.tsx`) exporting an array of `<Route>` elements that `App.tsx` spreads into its `<Switch>`.
Area owners edit **only their own route file** (replace `stubRoutes([...])` entries with real page
components, add sub-routes) and never touch `App.tsx`. Unimplemented routes keep using `StubPage`
from `src/routes/stub.tsx`. Titles/icons/breadcrumb parents for routes live in `src/lib/navigation.ts`
(shell-owned): to change the title, icon or parent of one of your routes edit only your route's line in
the `routes` array / `INDEX_LINKS` there — small targeted edits, never a rewrite.

Shared read models (an area may read tables of another area but must not alter them; ask the owner
area by leaving a TODO in `docs/reference-audit/CROSS-AREA.md` if a column is missing).

## 7. Order of work

1. **shell** (blocking): tokens, layout, shared components, navigation registry, stubs for all routes,
   home + index pages, login, currency dialog, favourites, PHP module scaffold + `010_shell.sql`.
2. In parallel: config-org, accounts, items-store, sales, purchases, accounting, reports.
3. Integration pass: dashboard numbers, cross-area links (e.g. account page → its invoices), print views.
4. Final: full typecheck, api-server build, codegen clean, `bash scripts/build-cpanel-package.sh`,
   screenshot comparison of every route, architect review.

## 8. Verification checklist (every area, before reporting done)

```
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-spec run codegen      # must be a no-op afterwards (git diff clean in generated dirs)
php -l deploy/cpanel/app/modules/<area>.php       # syntax check the PHP mirror
node scripts/src/ref-audit/capture-local.mjs <every route of the area>
```
Then open `screenshots/current/<name>-1440.png` next to `screenshots/reference/<name>-1440.png` and fix
differences in structure, labels, order, colours and spacing. Check the browser console is clean.
Exercise every button/menu with real API calls (create → list → edit → delete → restore where applicable).

## 9. Shared lookup tables (already built — use, do not duplicate)

All configuration lists of the reference (Storeconfig, accountconfiguration, accountingconfigurations,
purchaseissueconfig) live in `lib/db/src/schema/lookups.ts` and are served by one generic API:

```
GET    /lookups/{kind}          → LookupItem[]   (active rows, ordered by sortOrder then name; parentName joined)
POST   /lookups/{kind}          body LookupInput  { name | nameKu (+nameAr,nameEn), parentId?, code?, color?, isPrimary?, onAccount?, sortOrder? }
PATCH  /lookups/{kind}/{id}     body LookupInput (partial)
DELETE /lookups/{kind}/{id}     soft delete
```
Generated hooks: `useListLookups(kind)`, `useCreateLookup()`, `useUpdateLookup()`, `useDeleteLookup()`
(`@workspace/api-client-react`); Zod: `ListLookupsResponse`, `CreateLookupBody` (`@workspace/api-zod`).
Files: `artifacts/api-server/src/routes/lookups.ts`, `deploy/cpanel/app/modules/lookups.php`,
`deploy/cpanel/database/020_lookups.sql`.

| kind | reference tab | shape |
|---|---|---|
| item-types | Storeconfig › جۆرەکان | trilingual + isPrimary («سەرەکی») |
| item-subtypes | Storeconfig › جۆری لاوەکی | trilingual, parent item-types («جۆر») |
| item-subtypes2 | Storeconfig › جۆری لاوەکی ٢ | trilingual, parent item-subtypes |
| item-models / item-sizes / countries / colors / item-attributes / item-versions | مۆدێل / قەبارە / وڵات / ڕەنگ / سیفەت / وەشان | trilingual |
| release-dates | بەرواری دەرچوون | single name |
| cities | accountconfiguration › شار | single name |
| account-types | accountconfiguration › جۆر | trilingual |
| account-class1 … account-class5 | پۆلێنی یەکەم … پێنجەم | single name; class2..5 have parent = previous level |
| account-classes | کڵاس | trilingual + color |
| ownership-types | جۆری خاوەندارێتی | trilingual |
| expense-types / income-types | جۆری خەرجی / جۆری داهات | name + code |
| expense-subtypes / income-subtypes | جۆری خەرجی لاوەکی / جۆری لاوەکی داهات | name, parent expense-types / income-types |
| purchase-expense-types | جۆری خەرجی کڕین | name + onAccount («لەسەر خاوەن حساب») |
| purchase-issue-types | purchaseissueconfig | trilingual |

Owners: **config-org** builds the tab editors on top of this API (it may add columns to `lookups.ts` if the
reference shows more fields; then it must update the OpenAPI `LookupItem`/`LookupInput`, the Express
router, the PHP module and `020_lookups.sql` together). Other areas reference these tables by id
(`integer("item_type_id").references(() => itemTypesTable.id)` etc.) and display names through joins or
through `useListLookups` on the client. Item «مارکەی بازرگانی» keeps using the existing `brands` table.

## 10. Posting rules (stock and account balances) — mandatory for every document

Never update `warehouse_stock`, insert `stock_movements`, or write `account_ledger_entries` directly.
Use the shared helpers, inside the same DB transaction as the document:

* Node: `artifacts/api-server/src/lib/posting.ts` — `postStock`, `reverseStock`, `itemStock`,
  `postLedger`, `removeLedger`, `accountBalances`, `accountBalance`, `InsufficientStockError`.
* PHP: `deploy/cpanel/app/posting.php` — `posting_post_stock`, `posting_reverse_stock`,
  `posting_item_stock`, `posting_post_ledger`, `posting_remove_ledger`, `posting_account_balances`,
  `posting_account_balance`, `InsufficientStockException`.

Conventions:
* `referenceType` values: `sale_invoice`, `sale_return`, `sale_damage`, `sale_collection`,
  `purchase_invoice`, `purchase_return`, `purchase_payment`, `purchase_order`, `stock_transfer`,
  `store_register`, `opening_debt`, `expense`, `income`, `capital`, `profit_loss`. `referenceId` = row id.
* Editing a document = `reverseStock`/`removeLedger` for its reference, then post again. Deleting =
  reverse/remove + soft delete (`deleted_at`, `deleted_by_user_id`, `deletion_reason`) so the «سڕاوەکان»
  pages can list it; restoring re-posts.
* Ledger sign: debit = account owes us more (credit sale, cash paid to supplier, opening debt owed to us),
  credit = account owes us less (payment received, credit purchase, sale return, opening debt we owe).
  Amounts are stored in the document currency; `currency` is `IQD` or `USD`; the exchange rate used is
  stored on the document (`exchange_rate`) so reports can convert.
* Cash: money movements are `payments` rows (direction `received`/`paid`, `cash_box_id`) or
  `financial_entries` (income/expense); cash-box balance = received + income − paid − expense per currency.
* Stock: sales/damage/transfer-out/purchase-return post `out`; purchases/sale-returns/transfer-in/store
  register post `in`. Sales must fail with `InsufficientStockError` → HTTP 409 `{ error, itemId,
  warehouseId, available, requested }`; returns/damage may pass `allowNegative`.
