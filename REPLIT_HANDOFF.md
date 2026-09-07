# Rawand Decoration CRM — Replit Handoff Instructions

ئەم فایلە بۆ Agent ـی Replit ـە. تکایە پێش هەر گۆڕانێک ئەمە بە تەواوی بخوێنەوە و پاشان codebase ـەکە بپشکنە. ئەم project ـە سیستەمێکی بەکارهێنانی ڕاستەقینەیە، prototype نییە.

## داواکاریی سەرەکی

ئەم project ـە **Rawand Decoration CRM** ـە، کە لەسەر بنەمای infoCRM دروست کراوە و branding ـەکەی کراوەتە **M4IT**.

هەموو feature ـێکی نوێ دەبێت:

- هەمان behavior ـی سیستەمی ئێستا بهێڵێتەوە.
- هەمان route، form، dropdown، loading state، empty state، error state و success state ـی ئێستا بهێڵێتەوە.
- لە RTL ـی کوردی و layout ـی ئێستا دەرنەچێت.
- هیچ mock، fake، placeholder یان business data ـی ساختە دروست نەکات.
- لە UI، spacing، typography، رنگ، icon، ordering و interaction ـەکاندا هیچ جیاوازییەکی بێ‌هۆکار دروست نەکات.
- پێش edit کردن، implementation ـی هەمان feature ـی ئێستا بخوێنێتەوە و لەسەر هەمان pattern بەردەوام بێت.

ئەگەر داواکارییەک ڕوون نییە، لە خۆتەوە redesign یان architecture migration مەکە. لە شێوازی ئێستا بە کەمترین گۆڕان feature ـەکە زیاد بکە.

## Product و branding

- ناوی سیستەم: **Rawand Decoration CRM**
- Branding ـی بینراو: **M4IT**
- زمانی سەرەکی: کوردی، بە RTL
- URL ـی live ـی CRM:
  `https://rawanddecoration.rawand-decoration.com/`
- CRM تەنها لە subdomain ـی خۆیەتی.
- website ـە کۆنەکانی Rawand و Kamal دەبێت بە تەواوی بێ‌گۆڕان بمێننەوە.
- هیچ CRM file ـێک مەخە ناو document root ـی website ـە کۆنەکان؛ static index file دەتوانێت homepage ـی کۆن mask بکات.

## Architecture

### Frontend

- شوێن:
  `artifacts/rawand-decoration-crm/`
- React + Vite + TypeScript
- UI بە Tailwind و shadcn/Radix components
- API hooks لە:
  `@workspace/api-client-react`
- Preview workflow:
  `artifacts/rawand-decoration-crm: web`
- Run command:
  `pnpm --filter @workspace/rawand-decoration-crm run dev`

### Local API server

- شوێن:
  `artifacts/api-server/`
- بۆ local preview و behavior ـی هاوشێوەی production بەکاردێت.
- Protected route ـەکان لە local API ـش دەبێت authentication بخوازن.
- Preview workflow:
  `artifacts/api-server: API Server`
- Run command:
  `pnpm --filter @workspace/api-server run dev`

### Production backend

- شوێن:
  `deploy/cpanel/`
- PHP + PDO + MariaDB
- Node.js لە target ـی Namecheap/cPanel بەردەست نییە؛ backend ـی production بە Node مەگۆڕە.
- Database ـی CRM:
  `kamayqjd_rawandcrm`
- Database ـی legacy:
  `kamayqjd_rawand`
- Database ـی legacy نابێت modify بکرێت.
- package ـی deploy لە:
  `deploy/cpanel/package/`
- build script:
  `scripts/build-cpanel-package.sh`

## Authentication و security

Authentication ـی production و local دەبێت هاوشێوە بمێنێت.

Backend ـە security feature ـەکانی ئێستا:

- secure session ـی cookie-based
- session timeout
- protected API routes
- role و permission checks
- login lockout
- rate limiting ـی جیاواز:
  - ٥ failed attempt بۆ هەر username
  - ٣٠ failed attempt بۆ هەر IP
- audit log
- CSRF/origin checks
- first-admin bootstrap
- logout ـی ڕاستەقینە
- password change ـی ڕاستەقینە

Production authentication ـەکان لەمانەدا هەڵدەگیرێن:

- `deploy/cpanel/app/auth.php`
- `deploy/cpanel/app/bootstrap.php`
- `deploy/cpanel/app/generic.php`
- `deploy/cpanel/public/api/index.php`

Security schema:

- `deploy/cpanel/database/003_security.sql`

Config example:

- `deploy/cpanel/config/config.example.php`

### Password change

لە frontend ـەوە:

1. Login بکە.
2. لە header لەسەر profile button ـی `A` کلیک بکە.
3. `گۆڕینی وشەی نهێنی` هەڵبژێرە.
4. current password، new password و confirmation بنووسە.
5. new password دەبێت لانیکەم ٨ پیت بێت.
6. دوای سەرکەوتن backend session پاک دەکاتەوە و frontend دەگەڕێتەوە `/login`.

Endpoint:

- `/api/session/password`

Frontend implementation:

- `artifacts/rawand-decoration-crm/src/components/layout/header.tsx`

### Secret ـەکان

هیچ secret، password، token یان credential ـێک مەنووسە ناو source code، markdown، log یان chat.

تەنها لە Replit Secrets / environment secret ـەکان بەکاریان بهێنە. بەهای secret ـەکان مەخوێنەوە و مەنووسەوە.

## Frontend behavior ـی گرنگ

- `App.tsx` `/session/me` بەکاردێنێت بۆ route guard.
- بەکارهێنەری unauthenticated دەبێت بگوازرێتەوە بۆ `/login`.
- login page behavior ـی ئێستا مەشکێنە:
  - active user endpoint
  - login mutation
  - password visibility
  - loading state
  - error state
  - redesigned M4IT layout
- login image:
  `artifacts/rawand-decoration-crm/src/assets/login-hero.png`
- metadata/title:
  `artifacts/rawand-decoration-crm/index.html`
- logout ـی profile menu دەبێت API ـی ڕاستەقینە بانگ بکات.
- password change ـی profile menu دەبێت dialog ـی ڕاستەقینە بێت، نەک informational toast.

## Visual fidelity

ئەم UI ـە دەبێت وەک version ـی ئێستا بمێنێتەوە، نەک تەنها functional copy.

پێش گۆڕینی UI:

- DOM order ـی ڕاستەوخۆ بپشکنە، بە تایبەتی لە RTL.
- source capture ـەکانی 1440×900 بە benchmark بەکاربهێنە.
- sidebar، header، breadcrumbs، profile menu، tables، forms، cards و modal ـەکان لە هەمان hierarchy و spacing ـدا بهێڵەوە.
- icon ـەکان، text alignment، font scale و responsive behavior مەگۆڕە مەگەر داواکارییەک بە ڕوونی ئەوە بخوازێت.
- لە mobile، login image panel و responsive behavior ـی ئێستا بهێڵەوە.

## Data rules

- بەکارهێنەر، customer، item، invoice، balance، workplace یان business record ـی ساختە زیاد مەکە.
- ئەگەر empty state ـێک هەیە، هەمان empty state ـی ئێستا پیشان بدە.
- تاقیکردنەوەکان نابێت real business data بسازن.
- temporary test rows دوای test دەبێت بسڕدرێنەوە.
- transaction ـەکان atomic بن و audit entry ـیان هەبێت بۆ create/update/delete/restore.

## Deployment rules

CRM تەنها بۆ ئەم document root ـە deploy دەکرێت:

`/home/kamayqjd/rawanddecoration.rawand-decoration.com`

هیچ شتێک بۆ document root ـی domain ـە سەرەکی یان Kamal upload مەکە.

پڕۆسەی گشتی:

1. frontend و backend code بپشکنە.
2. `scripts/build-cpanel-package.sh` جێبەجێ بکە.
3. package ـی دروستکراو تەنها بۆ CRM subdomain upload بکە.
4. live login و protected API ـەکان verify بکە.
5. legacy Rawand و Kamal URL ـەکان verify بکە کە هێشتا کار دەکەن.

بۆ deploy، credential ـەکان لە secret ـەکانی environment وەربگرە؛ لە chat یان file ـدا چاپیان مەکە.

## Verification ـی پێویست پێش تەواوکردن

لە کۆتایی هەر کارێک:

```bash
pnpm --filter @workspace/rawand-decoration-crm run typecheck
pnpm --filter @workspace/api-server run build
bash scripts/build-cpanel-package.sh
git diff --check
```

هەروەها:

- workflow ـی frontend و API هەردووکیان running بن.
- browser console ـدا error ـی نوێ نەبێت.
- anonymous data API ـەکان `401` بدەن.
- login ـی دروست کار بکات.
- `/session/me` دوای login کار بکات.
- protected API بەبێ session دەبێت block بکرێت.
- logout کار بکات.
- password change session نوێ بخوازێت.
- rate limit و lockout ـی username/IP تێکەڵ نەبن.
- هیچ business data ـی ساختە دروست نەکرابێت.

## شێوازی کارکردنی Agent ـی نوێ

پێش edit کردن:

1. ئەم فایلە بخوێنەوە.
2. `replit.md` و `.agents/memory/MEMORY.md` بخوێنەوە.
3. فایل و component ـی هەمان feature بدۆزەوە.
4. behavior ـی ئێستا تێبگە.
5. بە کەمترین diff کار بکە.
6. typecheck/build/verification جێبەجێ بکە.
7. لە کۆتایی، بە ڕوونی بنووسە چی گۆڕدرا و چی verify کرا.

### گرنگترین یاسا

**ئەم سیستمە دەبێت هەمان Rawand Decoration CRM ـی ئێستا بمێنێتەوە. هیچ شتێک نابێت بە سلیقەی Agent ـەوە جیاواز بکرێت. ئەگەر دڵنیانیت نییە، implementation ـی ئێستا بە benchmark بگرە و پێش گۆڕین بپرسە.**