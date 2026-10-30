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
not in an editor folder: the clock faces (`ui/clock-faces/`, used by the CLOCK bench
and the TIMER wall clock) and the forecast data + strip face (`ui/weather/`, used by
the Graphics Engine).

## Editors are plugins (M2 + M3)

Each editor is a folder `editors/<name>/` whose `index.ts` default-exports one
`EditorPlugin` (`{ id, match, title, requiredCaps, render }`). `registry.ts` globs
them — **adding an editor is "drop a folder", zero edits elsewhere.** `render(host, ctx)`
reads only the typed `EditorContext` (resolved data), never the DOM.

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
