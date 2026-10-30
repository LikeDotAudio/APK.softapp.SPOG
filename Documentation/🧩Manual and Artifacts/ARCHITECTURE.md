# Architecture — WEB.SPOG

How to use SPOG and how it works inside. The user-facing tour of every editor is in the
[README](../../README.md#the-editors); the layering rule is [`src/README.md`](../../src/README.md).

← [Wiki home](../README.md)

## Using it

1. Open the console (`npm run dev` → `/index.next.html`; deployed it is the site's `/index.htm`).
2. **Sources** sit in the left ingress panel, discovered from `Routes/Sources/`. Drag one (or a
   gang cell / stage box — it lands as a collapsible `NAME ×k` group chip) onto a **twist**
   in a destination tab (`Routes/Destinations/`).
3. **Click a twist** to open its editor full-screen; `#/<prod>/<twist>` deep-links to it,
   `#on/<floor>/<production>` jumps to a destination.
4. Every routing change is narrated in the **Captain's Log**; select entries and
   **Reverse Course** to undo them — also after a reload, and for another seat's entries.
5. With a broker configured, other consoles see the same params, crosspoints, presence, chat
   and log. Without one, everything runs locally.

URL switches (per seat, default off or unchanged): `?preroute=matrix|list`, `?automv=1|0`,
`?glyphs=on|off`, `?tone=1`, `?timergfx=off`, `?wire=compact`, `?mergelog=keep`.

## Entry points

| Entry | What |
|---|---|
| `index.next.html` → `src/app/main.ts` | the console: build stamp, `buildConsole()` (`app/shell.ts`), `openFromHash()` (`app/editor-dispatch.ts`), device receiver |
| `twist-mqtt-tree.html` | standalone MQTT topic-tree diagnostic (second Vite input) |
| `src/sw/sw.template.js` | service worker, emitted to `dist/sw.js` with the build id + precache list by `vite.config.ts` |
| `server/index.ts` (`npm run server`) | optional dev API on `:3000` — JWT login (key from `JWT_SECRET`, else random per process), `/api/v1/changelog`, `/api/v1/routes/*`. Not deployed. |
| `SETUP/deploy.py` | the CI deploy (see [Delivery](../%F0%9F%8C%8DPublishing/DELIVERY.md)) |

## Data flow

```
Routes/**  (JSON + per-folder index.json)
   │  platform/discovery.ts
   ▼
model/  (Production, TwistConfig, SourceLeaf, SwitcherDef …)
   │  ui/sources/ (ingress panel)        ui/console/ (footer tabs, destinations, twists)
   ▼
drag → ui/console/matrix.ts drop  → crosspoints in the twist's drop-zone
   │        ├─ captains-log-narrate.ts  → log entry → captains-log-persist.ts (IndexedDB)
   │        └─ matrix-place.ts publishCrosspoints → platform/mqtt (retained, SPOG/ root)
   ▼
click twist → app/editor-dispatch.ts → editors/registry.ts match → app/context.ts buildContext()
   → plugin.render(host, ctx)  (params ↔ ctx.services.publishParam / onParam ↔ the bus)
```

- **The bus** (`src/platform/mqtt/`): topic tree mirrors the folder tree (`topics.ts`);
  payloads are AES-GCM-encrypted protobuf (`schema.proto`, `wire.ts`, `crypto.ts`) or plain JSON
  when the broker config says plaintext; per-topic trailing throttle (`throttle.ts`);
  Captain's Log bridge (`log-bridge.ts`).
- **Merge** (`src/platform/merge/`): concurrent writes to a param are bucketed per window and
  resolved by `resolveWindow()` (higher seat rank, then `full_id`).
- **Same-browser channels**: the vision mixer announces on-air graphics per production on
  `platform/gfx-monitor.ts`; the multiviewer's AUTO GFX tiles watch it.
- **Room fixtures** (`ui/console/dest-fixtures*.ts`): MONITOR, CLOCK, DUAL COUNTER, chat on
  every destination. The DUAL COUNTER and the MONITOR's timer graphic read the TIMER editor's
  `destinations/<prod>/counters_timer` snapshot `{A,B: {running, valueFrames, fps, unix,
  direction, overtime}}` through `domain/timer-core/graphic.ts`.

## Key modules

| Area | Files |
|---|---|
| Pure domain | `domain/routing-core` (graph, faults, tally, `stripOrder`), `domain/timer-core`, `domain/test-tone`, `domain/tsg`, `domain/test-card` (ident, shapes, types) |
| Console shell | `ui/console/` (91 files: footer, destinations, matrix DnD, helix, captains-log*, timeline, colour engine, router-view, fixtures) |
| Sources panel | `ui/sources/` (panel, pools, gang cells, format) |
| Shared painters | `ui/test-card/` (test frame + wall ticker), `ui/clock-faces/` (CLOCK + TIMER wall clock), `ui/weather/` (forecast data + strip, used by the Graphics Engine) |
| Editors | `editors/<name>/index.ts` — 25 folders, auto-registered; editors never import editors |
| Vision mixer | `editors/vision-mixer/`: `schema.ts` (`DEFAULT_SWITCHER`: 24 in — 1-12 video, 13-18 program, 19-24 graphics), `me.ts`, `scenes.ts` (whole-switcher registers incl. DSK PRE-ROUTE `dskSrc`), `preroute.ts`/`gfx-route.ts`, `gfx-take*.ts`, `gfx-feed.ts` |
| Multiviewer | `editors/multi-viewer/`: `wallCells()` + `gfxOverflow()` in `auto-gfx.ts` |
| Captain's Log | `ui/console/captains-log*.ts`: state, narrate, persist (`hydrateLog` row-guarded), reroute (`reversalPlan`, group re-find), timeline |

## Tests

`npm test` runs vitest over `src/**/*.test.ts` (28+ files: routing-core, timer-core, wire,
throttle, merge, vision-mixer, multiviewer auto-gfx, captains-log reroute/persist, …) in a node
environment; `npm run typecheck` is strict `tsc --noEmit`. There is no browser/E2E suite; the
`puppeteer` dependency is used only by the archived `archive/test_puppeteer.js`.
