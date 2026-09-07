# Reference-parity audit tooling

- `capture-local.mjs` — logs into OUR app (http://localhost:80) with `$ADMIN_PASSWORD` and captures screenshots + DOM summaries for the given routes. Example:

```
node scripts/src/ref-audit/capture-local.mjs home salelist "addsale/0/0"
node scripts/src/ref-audit/capture-local.mjs --tall salelist        # 1440x2600
node scripts/src/ref-audit/capture-local.mjs --viewport 390x844 home # mobile
```

Outputs: `screenshots/current/<name>-1440.png` and `docs/reference-audit/current/<name>.json`.
Compare against `screenshots/reference/<name>-1440.png` and `docs/reference-audit/<name>.json` (same summariser, same viewport).

- `summarize.mjs` — the DOM summariser shared with the reference crawl (headings, tabs, buttons, links, tables, fields, cards, dialogs, text).

Route names in file names: `/` → `_`, lower-cased (e.g. `addsale/L9Gzm/L9Gzm` → `addsale_l9gzm_l9gzm`).
