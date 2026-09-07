// Capture screenshots + DOM summaries of OUR app for parity comparison with the reference.
// Usage (from repo root):
//   node scripts/src/ref-audit/capture-local.mjs home salelist "addsale/0/0" [--viewport 1440x900] [--tall] [--out screenshots/current]
// Logs in with the first admin user + $ADMIN_PASSWORD. Writes <name>-<width>.png and <name>.json.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { SUMMARIZE } from './summarize.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i === -1) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (name) => { const i = args.indexOf(name); if (i === -1) return false; args.splice(i, 1); return true; };
const viewportArg = opt('--viewport', '1440x900');
const tall = flag('--tall');
const out = opt('--out', 'screenshots/current');
const jsonOut = opt('--json', 'docs/reference-audit/current');
const base = opt('--base', 'http://localhost:80');
const username = opt('--user', process.env.ADMIN_USERNAME || '');
const [w, h] = viewportArg.split('x').map(Number);
const viewport = { width: w, height: tall ? 2600 : h };
const routes = args;
if (!routes.length) { console.error('no routes given'); process.exit(1); }
if (!process.env.ADMIN_PASSWORD) { console.error('ADMIN_PASSWORD env var missing'); process.exit(1); }
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(jsonOut, { recursive: true });

const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));

await page.goto(`${base}/login`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
// Support both the legacy user dropdown and the plain username field.
if (await page.locator('select').count()) {
  await page.locator('select').first().selectOption({ index: 1 });
} else if (await page.locator('input[name="username"], input[autocomplete="username"], input[type="text"]').count()) {
  const u = page.locator('input[name="username"], input[autocomplete="username"], input[type="text"]').first();
  await u.fill(username || await resolveFirstUser());
} else if (await page.locator('[role=combobox]').count()) {
  await page.locator('[role=combobox]').first().click(); await page.waitForTimeout(400); await page.locator('[role=option]').first().click();
}
await page.locator('input[type=password]').first().fill(process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(2500);
console.log('after login:', page.url());

for (const r of routes) {
  const name = r.replace(/^\//, '').toLowerCase().split('/').join('_') || 'root';
  errors.length = 0;
  await page.goto(`${base}/${r.replace(/^\//, '')}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('  nav error', e.message.slice(0, 100)));
  await page.waitForTimeout(1500);
  const file = path.join(out, `${name}-${w}${tall ? '-tall' : ''}.png`);
  await page.screenshot({ path: file });
  const sum = await page.evaluate(SUMMARIZE);
  sum.consoleErrors = [...errors];
  fs.writeFileSync(path.join(jsonOut, `${name}.json`), JSON.stringify(sum, null, 1));
  console.log(`${r}: ${file} url=${page.url()} buttons=${sum.buttons.length} tables=${sum.tables.length} fields=${sum.fields.length} errors=${errors.length}`);
}
await browser.close();

async function resolveFirstUser() {
  const res = await ctx.request.get(`${base}/api/session/users`).catch(() => null);
  if (res && res.ok()) { const list = await res.json().catch(() => []); const first = Array.isArray(list) ? list[0] : list?.users?.[0]; if (first) return first.username || first.name || ''; }
  return 'admin';
}
