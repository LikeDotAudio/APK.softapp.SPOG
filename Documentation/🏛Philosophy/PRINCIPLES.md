# Principles — WEB.SPOG

What SPOG keeps, each with the code that keeps it. This deepens the README's
[Philosophy](../../README.md#philosophy) section. Ecosystem rules live in the root
([Doctrine](../../../../../Documentation/%F0%9F%8F%9BPhilosophy/Doctrine/readme.Doctrine.md),
[Soft Apps](../../../../../Documentation/%F0%9F%8F%9BPhilosophy/Soft%20Apps/readme.Soft%20Apps.md),
[The corner law and the two-tier token rule](../../../../../Documentation/%F0%9F%8F%9BPhilosophy/Soft%20Apps/The%20corner%20law%20and%20the%20two-tier%20token%20rule.md));
cited, not copied. The visual law for this app is [LCARS.md](LCARS.md) and
[Colours and shapes](Colours%20and%20shapes.md).

| Principle | Kept by |
|---|---|
| **The patch panel is the map; the editors are the rooms.** A new source/destination is a JSON file under `Routes/`; a new editor is a folder. No central list. | `import.meta.glob('./*/index.ts')` in `src/editors/registry.ts:14`; `Routes/**` discovered by `src/platform/discovery.ts` |
| **Editors read data, never the console DOM.** `render(host, ctx)` gets a typed `EditorContext`. | `buildContext()` (`src/app/context.ts:97`); contract in `src/editors/types.ts` |
| **Layers point one way** — `domain → model → platform → ui → editors → app`; `domain/` is pure. | rule in [`src/README.md`](../../src/README.md); `stripOrder` lives in `src/domain/routing-core/index.ts` so `domain/test-card/ident.ts` and `domain/test-tone` import nothing from `ui/` |
| **Zero backend by default; everything degrades.** Static files + an optional broker. IndexedDB stores no-op when unavailable; localStorage reads are wrapped. | `src/platform/store-idb.ts` (`idbPut`/`idbGetAll`); `src/platform/mqtt/client.ts`; `autoGfxEnabled()` (`src/editors/multi-viewer/auto-gfx.ts`) |
| **Keep going when one piece fails.** A failure is logged and fenced off. | vision mixer GFX SETS / PRE-ROUTE `try/catch` (`src/editors/vision-mixer/index.ts:243`, `:282`); `animate()` (`src/ui/console/dest-fixtures-shared.ts:69`); gfx-monitor watchers (`src/platform/gfx-monitor.ts:43`); `hydrateLog()` restores row by row (`restoreRow`, `src/ui/console/captains-log-persist.ts`); batch Reverse Course skips what it cannot redo (`reverseSelected`, `src/ui/console/captains-log-narrate.ts`) |
| **Untrusted bus data is validated before it is painted.** A malformed timer snapshot reads as dashes, never a throw in a render loop. | `isTimerSnap()` / `timerRows()` (`src/domain/timer-core/graphic.ts`); the DUAL COUNTER fixture uses the same guard (`src/ui/console/dest-fixtures-counters.ts` `counterRow`) |
| **One copy of the maths.** Timer counts are derived by timer-core only — live frames, stop (fold the run into the value), reset. | `liveFrames`, `toggleRun`, `resetSnap` (`src/domain/timer-core/graphic.ts`) |
| **State is derived from a stamp, never ticked into storage.** Counters are epoch-based and keep counting through a reload. | `cMs()` and `counters_timer` `{valueFrames, unix}` (`src/ui/console/dest-fixtures-counters.ts`, `src/editors/timer/index.ts` `publish()`) |
| **Converge, don't volley.** Concurrent writes to one param are bucketed and resolved deterministically (higher seat rank wins, `full_id` tie-break). | `resolveWindow()` (`src/platform/merge/resolve.ts:19`), `src/platform/merge/manager.ts` |
| **History can be undone, after a reload too.** A routing entry keeps its source labels; Reverse Course re-derives the undo and refuses — touching nothing — when it cannot. | `reversalPlan()` / `reroute()` (`src/ui/console/captains-log-reroute.ts`); dropped groups re-found by name (`groupBase()`) |
| **Meaning without hue.** Category is shape (and a glyph per switcher category); state can be a glyph; colours are Tier-2 tokens a palette re-points. | `.vm-btn[data-cat]` (`src/editors/vision-mixer/styles.ts`); `src/ui/console/state-glyphs.ts`; `PALETTES` (`src/ui/console/colour-palettes.ts`); gang fault outline `var(--state-alarm)` (`src/ui/sources/gang.ts:18`) |
| **Nothing is dropped silently.** When the multiviewer raster has no cell for an on-air graphic, the wall says how many are off it. | `gfxOverflow()` / `autoGfxCaption()` (`src/editors/multi-viewer/auto-gfx.ts`), used in `draw()` (`src/editors/multi-viewer/index.ts`) |
| **Ship behind the seat.** New behaviour is a per-seat preference or a URL switch, off or unchanged by default. | `src/platform/prefs.ts`; `?preroute=`, `?automv=`, `?glyphs=`, `?tone=`, `?timergfx=`, `?wire=compact`, `?mergelog=keep` |
| **Small files.** Source files stay ≤200 lines, checked before every build. | `MAX_LINES = 200` (`SETUP/check-file-size.mjs:10`), `prebuild` in `package.json` |
| **CI is the only deploy.** Local deploy scripts refuse. | `deploy*` scripts in `package.json`; `.github/workflows/deploy-production.yml` |

## Where the code bends a rule

- **Typed bus data is `any` in places.** `countersOf()` in `dest-fixtures-counters.ts` and the
  TIMER editor's `counters_timer` subscriber read the snapshot untyped; the editor's subscriber
  does not run `isTimerSnap()`.
- **`server/index.ts` signs JWTs with a hard-coded fallback secret** when `JWT_SECRET` is unset.
  It is a dev-only API (`npm run server`), not deployed, but the default should not exist.
- **The sandbox workflow does not typecheck or test** before deploying
  (`.github/workflows/deploy-sandbox.yml`); production does.
- **Raw hex remains in editor styles** (multi-viewer tally `#ff3344`, iso-recorder, audio-mixer,
  intercom) — the P2 hex→token migration in [Colours and shapes](Colours%20and%20shapes.md) is
  not done.
- **17 files are grandfathered** past the 200-line rule (`npm run sizecheck` lists them).
