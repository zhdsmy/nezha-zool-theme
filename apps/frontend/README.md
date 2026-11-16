# Nezha ZOOL public frontend

Nezha v1 / v2.6+, React 19, Tailwind CSS v4, SVG instruments. Nezha is the only backend.

From the repository root:

```sh
pnpm --filter frontend dev
pnpm --filter frontend test
pnpm --filter frontend package
```

For local live data, add `ZOOL_UPSTREAM=https://your-monitor.example` to
`apps/frontend/.env.local`. Without `ZOOL_UPSTREAM`, `dev` uses the built-in synthetic demo dataset.

Packaging writes `release/nezha-zool-frontend-v0.1.0.zip` and its SHA256 file.
The ZIP contains one folder, `zool-dist/`, matching the Nezha folder layout.
Mount its contents over `/dashboard/user-dist` (or the active `user_template` in `data/config.yaml`).

`config.js` belongs to the site owner and is excluded from the ZIP. On the first
installation, copy `apps/frontend/public/config.js` next to the extracted
`index.html`; keep the existing file on upgrades. Every setting in `window.ZoolConfig` is optional.

## Billing & history

- **Billing**: Reads `billingDataMod` and `planDataMod` JSON from each server's public note (`Month` / `Quarter` / `Half` / `Year`, currency prefix or symbol, and traffic cap). Plain-text notes are ignored.
- **History & latency**: Live metric buffers fill while the page is open, and TSDB history up to 30 days is loaded when available. Service monitor latency supports spike filtering and range selection.
- **Upgrades**: Copy new files over the existing `zool-dist/` directory without deleting old hashed `assets/` immediately so open tabs with cached HTML do not hit `404`s.
