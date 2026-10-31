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
| build | `npm run build` | `dist/`: content-hashed bundle from `index.next.html` + `twist-mqtt-tree.html`, `dist/build-id.json`, `dist/sw.js` (from `src/sw/sw.template.js`), `dist/spog-config.js` (from `public/`) |
| build for a static host | `npm run build:image` | the gates above, then `dist/` as the whole served tree (`index.htm`, `Routes/` with manifests). The contract is in `SETUP/build-image.mjs`; `Docker/dist.Dockerfile` wraps it (last stage `dist` = the tree at `/`) |
| deploy-settings tests | `npm run test:deploy` | `SETUP/deploy/test_settings.py` |
| proto | `npm run proto` / `proto:check` | regenerate / check `schema.js` + `schema.d.ts` from `schema.proto` (the check also runs in `npm test`) |
| smoke | `npm run smoke [-- <base-url> …]` | each site's `index.htm` answers and its `build-id.json` names HEAD (default `https://spog.like.audio/`) |
| clock faces | `npm run check:clock-faces` | the two checkouts of TIME.clockFaces in the monorepo are on one commit |

`vite.config.ts` stamps every build (`YYYYMMDD.HHMM · git <sha>`, plus `(uncommitted)` when the
tree is dirty) into the bundle (`__BUILD_ID__`) and `build-id.json`; the service worker keys its
caches on it.

## Ship

Only CI deploys; `npm run deploy`, `deploy:all`, `deploy:next` print an error and exit 1.

| Trigger | Workflow | Does |
|---|---|---|
| push to `main` | `.github/workflows/deploy-production.yml` (environment `production`) | `npm ci` → typecheck → test → `python3 SETUP/deploy.py` |
| push / PR to `sandbox` or `develop` | `.github/workflows/deploy-sandbox.yml` (environment `sandbox`) | `npm ci` → typecheck → test → `python3 SETUP/deploy.py` with the `SANDBOX_FTP_*` secrets |

`SETUP/deploy.py` (helpers in `SETUP/deploy/`), over one Explicit-FTPS connection to
`FTP_HOST` (default `spog.like.audio`). Every setting comes from `SETUP/.env` (gitignored;
`SETUP/.env.example` lists the names) overlaid by the environment (`SETUP/deploy/env.py`); CI maps
its secrets to env vars on the deploy step. `FTP_USER`/`FTP_PASS` unset aborts the deploy.

1. `npm run build` (skip with `--no-build`), then `dist/spog-config.js` from `SPOG_BROKER` /
   `SPOG_BUS_KEY` when either is set (`SETUP/deploy/runtime_config.py`).
2. Regenerate `Routes/**/index.json` manifests (the app discovers data from them).
3. Upload `dist/<entry>.html` as `/index.htm`, `dist/assets/**` to `/assets/` (stale hashed
   assets cleared first), and the `Routes/` files changed between `DEPLOY_DIFF_BASE` and
   `DEPLOY_DIFF_HEAD` (`--all` for the whole tree; a clean tree pushes everything).
4. Remove the retired `js/` and `index.next.html` from the server (`LEGACY_REMOTE`; `sw.js`
   is kept as a kill-switch worker). `--fresh` also sweeps every server file this deploy did
   not produce.
5. Best-effort: publish a retained `SPOG/system/build` stamp on the broker
   (`SETUP/deploy/mqtt_stamp.py`, broker from `TWIST_MQTT_HOST`/`_PORT`/`_USER`/`_PASS`; skipped
   when no host is set — there is no default host or login) so open consoles pulse their
   version badge. A down broker never fails the deploy.

## Where it lands

- A static FTPS host at `spog.like.audio`: `/index.htm`, `/assets/`, `/Routes/`, `/sw.js`,
  `/build-id.json`, `/twist-mqtt-tree.html`.
- **The bench and apk.audio build their own copy** (LOOSE-web-spog-webspog-has-no), the same
  shape as spog.like.audio's (entry as `index.htm`, `Routes/` beside the bundle):
  WEB.Frontend-Assets' image has a `spog-build` stage (named context `spog` = this repo) and
  serves it at `/SPOG/`, with `/spog/` and the old `/APK:SPOG/` redirecting there — so an edit here
  reaches a bench only after `up-stack.sh WEB.Frontend-Assets`; the monorepo's root `ci.yml`
  builds it ("Build SPOG") and its `deploy.py` uploads `dist/` as `SPOG/`. The OS opens it
  from its `SPOG` display (`PODS/POD.THIN/OS/SPOG/display.json`, `app: SPOG/index.htm`), as
  does this repo's `display.json`. DATABASE.server.SQL's Storage-Portal does not carry it.
  `.apk.scripts/deploy_all.py` pushes this submodule (CI then deploys spog.like.audio).
- `server/index.ts` is a dev-only Express API (`npm run server`, `:3000`); nothing ships it.

## Not automated

- No browser/E2E test: CI runs only `tsc` and vitest (node). Nothing loads the built page.
- The post-deploy check is a command, not a gate: `npm run smoke` (or
  `npm run smoke -- <origin>/SPOG/` for the image) checks the served `build-id.json` names
  HEAD; the monorepo's `.apk.scripts/smoke.py` still checks only that `HEAD` is pushed
  ([SMOKE](../%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md)).
- `CHANGELOG.md` is hand-kept; the latest cut is v111 (2026-10-30). Versions are not tagged
  (publishing a tag is the owner's call).

## Delivered from the 2026-10-30 audit
- **Owner-held (owner decision 2026-10-31): rotate the FTP credentials.** `SETUP/.env` is purged from every branch (ed55bf6). Steps: change the FTP password at the host, then set the `FTP_*` / `SANDBOX_FTP_*` repository secrets and `GH_PAT` (for the private clock-faces submodule) so the deploy turns green.
- **Release tag `v111`** — annotated tag at ed55bf6, pushed 2026-10-31 with the owner's go-ahead.
- **SETUP/.env purged from history** — `git filter-repo --invert-paths --path SETUP/.env` over every branch (main, sandbox, modularity-200-line; worktree-weather-graphic never carried it), force-pushed 2026-10-30 with the owner's go-ahead. Verified: no commit on any origin branch touches the file; HEAD tree unchanged; clockFaces pointer intact. Backup bundle kept in the remediation scratchpad. New main: 20c3854.

- **Deploy credentials untracked** — `git rm --cached SETUP/.env` (the file stays on disk, `.gitignore`
  already lists `.env`), `SETUP/.env.example` with empty values, and one reader
  (`SETUP/deploy/env.py`: the file, overlaid by the environment). CI no longer writes a `.env`:
  the deploy step maps `FTP_*` secrets to env vars. Before this, `env.py` read `SETUP/.env` while CI
  wrote `./.env`, so CI deploys were logging in with the tracked file. `FTP_PORT` is honoured;
  missing `FTP_USER`/`FTP_PASS` aborts. Verified: `npm run test:deploy` (asserts no `.env` is
  tracked and the example holds names only), `python3 -m py_compile`.
- **No bus key in the bundle** — `crypto.ts`'s literal key is gone; the key is a runtime input
  (`SPOG_CONFIG.busKey` from the deployment's `spog-config.js`, else `localStorage.twistBusKey`),
  same derivation so a given string interoperates with older builds. With no key the console
  publishes plaintext JSON. Verified: `runtime-key.test.ts` (no key by default, refuses to
  encrypt without one, round-trip, wrong key reads nothing), `wire.test.ts` with a test key.
- **Local-first default broker** — `config.ts` defaults to `SPOG_CONFIG.broker`, else `/mqtt` on the
  page's own origin (the policy of WEB.Frontend-Assets' `comMQTT/connectionPool.js`);
  `test.mosquitto.org` is not compiled in (a test fails if a public broker host appears in `src/`).
  A deployment that still wants the sandbox broker sets `SPOG_BROKER`. In the APK.audio image
  (`/SPOG`, WEB.Frontend-Assets) the console now reaches the bench's own broker through the
  gateway's `/mqtt`.
- **Own root only** — the bus subscribes to `SPOG/#` alone; the bare broker-root `devices/#` is gone.
  SPOG only ever published devices under `SPOG/devices/…`, which `receiver.ts` (`DEVICE_FILTER`,
  `ingestManifest` still the adapter) keeps reading. Verified by `runtime-key.test.ts` and the
  receiver tests.
- **One build entry** — `npm run build:image` (`SETUP/build-image.mjs`: manifests, typecheck,
  tests, size gate, vite build, `index.htm`, `Routes/`) and `Docker/dist.Dockerfile` (+
  `.dockerignore`) whose last stage `dist` is the served tree, for WEB.Frontend-Assets to
  `COPY --from` instead of naming SPOG's files. Verified: `npm run build:image`, and `docker compose
  build` of the dist stage plus a consumer stage copying it (index.htm + Routes/index.json
  present). The size gate now reads submodule paths from `.gitmodules`, so a context without
  `.git` still skips TIME.clockFaces. WEB.Frontend-Assets now consumes it (`1fa0fe5e`: compose service
  `spog-dist` → `COPY --from=spog-dist / /srv/www/SPOG`), so it no longer names SPOG's files.
- **Generator for the protobuf code** — `npm run proto` / `proto:check` (`SETUP/proto.mjs`, pbjs
  static-module es6 + pbts) and `schema.test.ts` failing when `schema.js`/`schema.d.ts` are stale.
  Verified: the committed files are byte-identical to the generator's output.
- **One mqtt.js** — `src/vendor/mqtt.min.js` deleted; `mqtt-load.ts` takes `mqtt/dist/mqtt.min?url`
  from the pinned npm dependency, and `twist-mqtt-tree.html` imports `mqtt` instead of an
  unversioned unpkg URL (and no longer pre-fills `guest/guest`). `express`/`jsonwebtoken`/`cors`
  moved to devDependencies, `puppeteer` dropped (lock regenerated with npm 10). Verified:
  `vite build` emits one `mqtt.min-*.js` asset, `npm ci` clean.
- **Deployed-build smoke** — `npm run smoke [-- URL …]` (`SETUP/smoke.mjs`): `index.htm` answers 200
  and `build-id.json` names HEAD without `(uncommitted)`. Verified against a local server
  over `dist/` (entry PASS; build-id FAIL on a dirty tree, as designed). Not run against
  spog.like.audio from here.
- **Dev API verifies roles** — `server/roles.ts`: a role is signed only if it is in
  `SPOG_DEV_ROLES` (`role:passphrase,…`) with its passphrase; guest otherwise; 401 for the rest.
  The server binds to `127.0.0.1` by default and its banner says DEV ONLY. Verified:
  `test/server-roles.test.ts`, and a live `tsx server/index.ts` refusing `{"role":"ep"}`.
- **Changelog release** — `[Unreleased]` cut as `[v111] — 2026-10-30`, with the wire versions it
  reads (v2 default, v3 opt-in, both decoded from v111).
- **Deploy stamp broker from secrets only** — `mqtt_stamp.py` has no LAN IP or `guest/guest`
  default; `TWIST_MQTT_*` come from the deploy settings (CI secrets), and the stamp is skipped
  when no host is set. Verified: `test_settings.py`.
- **TIME.clockFaces read through its own list** — the CLOCK bench and TIMER wall clock import
  `ALL_FACES` / `FACE_API` instead of globbing `src/*.ts`; the submodule is the same repo the
  root mounts at `Softapps/TIME/TIME.clockFaces`, both checkouts on one commit
  (`npm run check:clock-faces`). Verified: `tsc`, vitest, clockFaces `npm test`.
- **WB-02 / WS-05 Broker and mqtt.js by the shell's rules** (from the SDK/contracts audit) —
  `config.ts` now makes `apk-bus.js`'s decision: the deployment's broker (`SPOG_CONFIG.broker`,
  `same-origin` = `/mqtt` here), else `/mqtt` on the page's origin only when the host is a bench
  address (`isBenchHost`, the same `BENCH_HOST` set, pinned by `runtime-key.test.ts`), else no
  broker — on a public origin the bus is a no-op. No public broker is a default anywhere.
  `mqtt-load.ts` reuses the framing shell's `window.mqtt` (the one vendored copy WEB.Frontend-Assets
  serves) before loading its own. Verify grep (`:9001|test\.mosquitto|from 'mqtt'|vendor/mqtt.min.js`
  over `src/`) is empty. Kept by design: the npm `mqtt` dependency stays, as the bundled fallback
  for spog.like.audio, a standalone static site where neither the shell nor
  `/FrontEnd/shared/apk-bus.js` is served (written down in PRINCIPLES.md); there is no vendored copy
  in this repo. Verified: vitest 34 files / 191 tests, `tsc`.
- **WB-01 Stack shape** (from the SDK/contracts audit) — `Docker/` now exists (`dist.Dockerfile`,
  the build stage WEB.Frontend-Assets consumes). Kept by design: the app stays at the repo root,
  not under `SRC/` — SPOG is a static build input deployed on its own to spog.like.audio by its own
  GitHub workflows, not a container stack (it has no compose file and runs no service); moving it
  would break its CI paths and its consumers for no runtime gain. The root's WB-01 loop should
  treat a `Docker/` with no `docker-compose.yml` as a build input (handoff filed).
- **Kept by design: audit files stay local** — `.gitignore` excludes `Documentation/🔍Audits/*`
  except `INDEX.md` (`78d6f0c`); the audit page is edited in the working copy only.
- **Kept by design: `stripOrder`/`slug` re-implemented in `platform/mqtt/topics.ts`** — the layering
  rule (`src/README.md`, `layering.test.ts`) forbids platform importing ui; it is one repo, not a
  cross-repo duplicate.
- **Recorded when the roadmap page became a pointer (2026-10-31)** — shipped and not in CHANGELOG.md:
  the 24-hour newsroom schedule (20 shows over London / Tokyo / Sydney bureaus, a prime-time peak
  of 5 concurrent productions, a 45-minute rehearsal band per slot, `×N` overlap stacking;
  `ui/console/schedule.ts`, `captains-log-timeline-data.ts`); the Heartbeat edge pulse off by
  default, per seat under Colour & Vision (`ui/console/lcars-pulse.ts`, `prefs.ui.heartbeat`);
  the on-air weather forecast strip face (`ui/weather/faces/strip.ts`, the Graphics Engine's
  forecast template).

## Delivered from the APK.audio roadmap

- **ROAD-3451 v3 wire by default** — `wire.ts` encodes v3 unless `?wire=v2`/`spog.wire=v2`; decode of v2 kept. Checked first: the deployed build (20261031.1735 · git e40f008) decodes `xpSuffix`/`logMsg`, and the only other reader (`contracts` `spog_envelope.rs`, the VISA sampler bridge) reads numeric ValueMsg arms only, which v3 leaves unchanged.
- **ROAD-3450 (2026-10-31)** — the last 18 native `title` hovers in `src/editors/` (16 the item counted, plus the PRE-ROUTE matrix cells and the device strip name) ride `hint()` from `src/ui/tip.ts`; `src/editors/native-title.test.ts` fails on any new `.title =`, `setAttribute('title')` or `title:` in an `el()` attrs object.
- **ROAD-3447 on-air graphics on the bus** — `gfx-monitor.ts` publishes the set retained at `SPOG/productions/<id>/gfx/on-air` (localStorage only with no broker); GFX SETS takes ride `gfx.take` through the merge mediator; the multiviewer's RSV button reserves cells for AUTO tiles. Bench (built app, local Mosquitto, three headless-Chrome contexts): a CUT GFX in one put `AUTO · GFX ⬡ SW IN 19 · DSK 1` on another's wall and lit DSK 1 on a third's switcher.
- **ROAD-3449 (2026-10-31)** — state glyphs on live surfaces for on-air ● / muted ⊘ / ok ✓ / kinda ◐ / fault ⚠ and for every contract state word; `src/domain/state.ts` reads the contract's tones (engine paints `--state-good/kinda/dead`; Classic's alarm/ok are the contract's dead/good); 2,512 hex literals moved into `src/domain/palette.ts` (`PAL.*`), `src/domain/palette.test.ts` ratchets what is left outside it.
