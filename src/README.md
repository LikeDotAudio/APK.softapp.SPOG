# `src/` — the SPOG app (TypeScript, ultra-modular)

This is the whole app. The legacy `js/` app is retired (a copy sits in
`archive/` for reference only); the TypeScript build is the console. Its dev entry is
`index.next.html` at the repo root, which `SETUP/deploy.py` publishes as the site's
`/index.htm` (see [Delivery](../Documentation/🌍Publishing/DELIVERY.md)).

## Layering (M7 — dependency direction is a rule)

```
domain/        pure logic, ZERO DOM/globals  (routing-core, timer-core, test-tone, tsg, test-card idents)
  └─ model/    the typed data shapes (Production, TwistConfig, SwitcherDef, Role…)
       └─ platform/   discovery (manifest/autoindex), MQTT bus, merge, time-sync, stores
            └─ ui/    console, sources panel, widgets, tooltips, timer/test-card painters,
                      clock faces, weather strip
                 └─ editors/   one plugin package per editor (auto-registered)
                      └─ app/   boot + composition root
sw/            service-worker template (emitted to dist/sw.js by vite.config.ts)
```

A layer may import only from layers above it. **Editors never import editors** —
cross-editor needs arrive as typed services on `EditorContext`. No `window.*`
globals anywhere.

`domain/test-card/` holds only the pure identity logic (ident, shapes, types); the
canvas/DOM painters live in `ui/test-card/`. Pieces two editors share sit in `ui/`,
not in an editor folder: the clock faces (`ui/clock-faces/`, the TIME.clockFaces submodule — the same
files the OS shell bundles — whose `src/*.ts` the CLOCK bench and the TIMER wall clock glob) and the forecast data + strip face (`ui/weather/`, used by
the Graphics Engine).

## Editors are plugins (M2 + M3)

Each editor is a folder `editors/<name>/` whose `index.ts` default-exports one
`EditorPlugin` (`{ id, match, title, requiredCaps, render }`). `registry.ts` globs
them — **adding an editor is "drop a folder", zero edits elsewhere.** `render(host, ctx)`
reads only the typed `EditorContext` (resolved data), never the DOM.

## Imports go through one pipeline (ROAD-3474)

Every file import enters `platform/import/pipeline.ts` (`runImport`): sniff → parse,
translate, gate and normalise in a Web Worker (`domain/pyramid/prepare`) → diff → commit
(the caller's sink) → layout → publish. Publishing writes an L1 skeleton and one
content-addressed (SHA-256) L2/L3 chunk per group to IndexedDB
(`platform/pyramid/chunk-cache`), and `platform/pyramid/loader.ts` reads a project back
top down: skeleton first, chunks only for groups in view, editing refused until L4. The
1990s view's import (`ui/console/router-io.ts`) is the first adapter; it does not publish
yet, because no SPOG view reads the pyramid.

## Scanning labels (ROAD-3476)

The ▦ SCAN panel (`ui/scan/`, in the seat MENU) decodes QR, DataMatrix and Code 128
from the camera, from photos (one flash shot or a batch) or a keyboard-wedge
scanner, and acts on the netlist (Routes/**): **Locate** opens the device / twist /
source the code names, **Fill** writes it into the active card's `serial` or
`asset_tag` through the authoring commit (draft + reversible Captain's Log entry,
BUILD right), **Verify** compares it with the active card and logs a mismatch as a
Captain's Log observation. The decisions are pure (`domain/scan/`: netlist match,
`routeRead`, `ScanGuard` — one event per code per window). Decoding is
`platform/scan/scan-decode.ts`: the platform `BarcodeDetector` when this runtime
builds one, else the self-hosted `zxing-wasm` reader (pinned 3.1.5), loaded lazily;
its `.wasm` is emitted into `dist/assets/` and is never fetched from a CDN. Test
photos: `platform/scan/__fixtures__/make-fixtures.mjs`.

## Reading labels with OCR (ROAD-3475)

The ⌕ OCR panel (`ui/ocr/`, in the seat MENU next to SCAN) imports photos (many at
once) or a `.zip` of them and reads them with **Tesseract.js pinned at 7.0.0** —
worker, core (SIMD+LSTM or plain LSTM, picked by a wasm probe) and the English
`4.0.0_best_int` data are copied by `SETUP/ocr-assets.mjs` into `dist/ocr/` (served
in dev from node_modules) and requested only when the first photo is read; every
path is set, so nothing is fetched from a CDN. `dist/ocr/` is outside `dist/assets/`,
so the service worker caches it on first use instead of precaching ~7 MB into every
seat. The zip is opened in memory under `domain/ocr/archive-rules` (limits, no `..`
or absolute paths, bytes must BE an image). Word boxes are SVG over the photo;
arrows move by geometry (`domain/ocr/box-nav`), Enter corrects a box (the engine's
reading is kept beside the correction). `domain/ocr/candidates` finds serial / MAC /
asset-tag values by the shapes in `ocr-shapes.json` (patterns, never device lists).
**+ ATTACH / ADD ALL** go through SCAN's Fill (`attach-plan` → `routeRead('fill')`
→ `ui/scan/scan-act` `act()`), with its refusals. **EXPORT FROM PROJECT** writes the
recorded identity as a printable sheet of QR labels (`domain/ocr/qr-export`, drawn
by zxing-wasm's writer) that SCAN's Locate reads back. Test photo:
`platform/ocr/__fixtures__/make-fixtures.mjs` (ImageMagick).

## Run

```bash
npm ci               # the pinned toolchain (typescript, vite, vitest, protobufjs)
npm run dev          # vite dev server, opens /index.next.html (serves Routes/ data)
npm run typecheck    # tsc --noEmit, strict
npm test             # vitest run (src/**/*.test.ts)
npm run build        # prebuild size check → dist/ (content-hashed bundle + sw.js)
```

## Deploy

Local `npm run deploy*` scripts are disabled on purpose. A push to `main` runs
`.github/workflows/deploy-production.yml` (typecheck + test, then
`python3 SETUP/deploy.py`); `sandbox`/`develop` run the sandbox workflow (same typecheck + test first). The build
has a relative base, so `dist/` drops at the site root next to the shared `Routes/`.

`Routes/**` is the only JSON that ships — routing DATA, discovered via per-folder
`index.json` manifests (`src/platform/discovery.ts`), never app code.
