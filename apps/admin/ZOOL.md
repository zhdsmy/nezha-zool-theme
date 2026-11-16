# ZOOL admin frontend

This package restyles the Nezha admin panel (`admin-dist`) to match `apps/frontend` in [nezha-zool-theme](https://github.com/zhdsmy/nezha-zool-theme), imported from [zhdsmy/nezha-admin-frontend](https://github.com/zhdsmy/nezha-admin-frontend) (`v2.6.1-zool.4`, commit `8496d82`).

## Compatibility

Each build supports one backend version only. A tag's prefix names that version.

| Tag | Upstream base | Backend |
|---|---|---|
| `v2.6.1-zool.1` – `v2.6.1-zool.4` | `v2.6.1` (034062a) | nezha v2.6.1 |

The dashboard serves files from `/dashboard/admin-dist` (a read-only bind mount) instead of its embedded admin. The admin API and the SPA route list come from the backend. When a newer backend runs this build, pages can break or show wrong data, and there is no error at upgrade time.

## Before a Nezha upgrade

Rebuilds of the same version, such as `domizhang/nezha-dashboard:v2.6.1` with security patches, need no action here. For a new Nezha version:

1. Find the admin tag that the new backend embeds. It is in `service/singleton/frontend-templates.yaml` in nezhahq/nezha.
2. Rebase `zool` onto that upstream tag and resolve any conflicts:

   ```sh
   git fetch upstream --tags
   git rebase --onto <new-tag> v2.6.1 zool
   ```

3. Build and check:

   ```sh
   pnpm --filter admin-frontend build
   ```

4. Test against the new backend image. Run it locally with `-v $PWD/dist:/dashboard/admin-dist:ro`. Open each admin page, and check the server list, the edit dialogs and the service page.
5. Tag the result `v<new>-zool.1`. Deploy `dist/` to the admin-dist directory in the same operation as the image change.

If you cannot finish these steps, remove the admin-dist mount for the upgrade. The dashboard then falls back to the stock admin that is embedded in the image.

## Build

From the repository root:

```sh
pnpm install
pnpm --filter admin-frontend build   # output: apps/admin/dist/
```
