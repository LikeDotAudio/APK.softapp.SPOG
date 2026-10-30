# Delivery — WEB.SPOG

How SPOG is built, tested and shipped, and where it lands.

← [Wiki home](../README.md)

**Live:** <https://spog.like.audio/> — the build stamp is at
<https://spog.like.audio/build-id.json>.

## Build

| Step | Command | Output |
|---|---|---|
| install | `npm ci` | the pinned toolchain from `package-lock.json` (`node_modules/` is not tracked) |
| size gate | `npm run sizecheck` (also `prebuild`) | fails the build if a non-grandfathered file under `src/`/`assets/` passes 200 lines |
| typecheck | `npm run typecheck` | strict `tsc --noEmit` |
| test | `npm test` | `vitest run` over `src/**/*.test.ts` (node environment) |
| build | `npm run build` | `dist/`: content-hashed bundle from `index.next.html` + `twist-mqtt-tree.html`, `dist/build-id.json`, `dist/sw.js` (from `src/sw/sw.template.js`) |

`vite.config.ts` stamps every build (`YYYYMMDD.HHMM · git <sha>`, plus `(uncommitted)` when the
tree is dirty) into the bundle (`__BUILD_ID__`) and `build-id.json`; the service worker keys its
caches on it.

## Ship

Only CI deploys; `npm run deploy`, `deploy:all`, `deploy:next` print an error and exit 1.

| Trigger | Workflow | Does |
|---|---|---|
| push to `main` | `.github/workflows/deploy-production.yml` (environment `production`) | `npm ci` → typecheck → test → `python3 SETUP/deploy.py` |
| push / PR to `sandbox` or `develop` | `.github/workflows/deploy-sandbox.yml` (environment `sandbox`) | `npm ci` → `python3 SETUP/deploy.py` with the `SANDBOX_FTP_*` secrets — **no typecheck or test** |

`SETUP/deploy.py` (helpers in `SETUP/deploy/`), over one Explicit-FTPS connection to
`FTP_HOST` (default `spog.like.audio`):

1. `npm run build` (skip with `--no-build`).
2. Regenerate `Routes/**/index.json` manifests (the app discovers data from them).
3. Upload `dist/<entry>.html` as `/index.htm`, `dist/assets/**` to `/assets/` (stale hashed
   assets cleared first), and the `Routes/` files changed between `DEPLOY_DIFF_BASE` and
   `DEPLOY_DIFF_HEAD` (`--all` for the whole tree; a clean tree pushes everything).
4. Remove the retired `js/` and `index.next.html` from the server (`LEGACY_REMOTE`; `sw.js`
   is kept as a kill-switch worker). `--fresh` also sweeps every server file this deploy did
   not produce.
5. Best-effort: publish a retained `SPOG/system/build` stamp on the broker
   (`SETUP/deploy/mqtt_stamp.py`; CI points it at `test.mosquitto.org:8080`) so open consoles
   pulse their version badge. A down broker never fails the deploy.

## Where it lands

- A static FTPS host at `spog.like.audio`: `/index.htm`, `/assets/`, `/Routes/`, `/sw.js`,
  `/build-id.json`, `/twist-mqtt-tree.html`.
- **No Docker image bakes SPOG.** It is not under `PODS/POD.THIN/Softapps/`, so neither
  WEB.Frontend-Assets nor DATABASE.server.SQL copy it; the monorepo's
  `.apk.scripts/deploy_all.py` only pushes this submodule (CI then deploys).
- `server/index.ts` is a dev-only Express API (`npm run server`, `:3000`); nothing ships it.

## Not automated

- No browser/E2E test: CI runs only `tsc` and vitest (node). Nothing loads the built page.
- The sandbox deploy runs no typecheck or tests.
- No post-deploy check that `spog.like.audio` serves the new `build-id.json`; the monorepo's
  `.apk.scripts/smoke.py` checks only that `HEAD` is pushed
  ([SMOKE](../%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md)).
- The CI deploy writes `.env` (FTP secrets) into the checkout before building. `.env` is
  gitignored (since 2026-10-30) so it no longer marks the production build stamp
  `(uncommitted)`; stamps deployed before that do.
- `CHANGELOG.md` is hand-kept; versions are not tagged.
