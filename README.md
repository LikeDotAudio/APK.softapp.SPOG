# SPOG — Single Pane Of Glass

**SPOG** (Single Pane Of Glass) is the overall system: one operator surface for an entire
multi-floor production facility. Its connection points — where a source meets a destination —
are called **twists**.

A browser-based **broadcast signal routing visualizer**, dressed in full LCARS regalia.
It maps the living signal flow of a multi-floor production facility — every stage box,
every camera, every audio channel — onto destinations like control rooms, edit suites,
encoders, and floor rooms. You drag a source onto a destination's input, and the patch
comes alive as a twisting strand of DNA.

The "twist" is the metaphor and the mechanic: each routing point is a **twist**, and the
signals you braid into it are rendered as an animated double helix — two strands (cyan and
magenta) spiraling around each other, the way two feeds wind together into one production.
Route a healthy source and the helix flows clean; route a faulted one and the strand
**corrupts**, flickering red.

But a twist is more than a patch point. **Open a twist and you drop into a full role-specific
control surface** — a vision mixer with a T-bar, a CCU shading console with waveform scopes,
a DMX lighting board, an IFB mix-minus rack. The patch panel is the map; the editors are the
rooms. The rest of this document is mostly about those rooms.

**Live:** <https://spog.like.audio/> · **Wiki:** [Documentation/README.md](Documentation/README.md) —
[Principles](Documentation/%F0%9F%8F%9BPhilosophy/PRINCIPLES.md) ·
[Architecture](Documentation/%F0%9F%A7%A9Manual%20and%20Artifacts/ARCHITECTURE.md) ·
[Delivery](Documentation/%F0%9F%8C%8DPublishing/DELIVERY.md) ·
[Roadmap](Documentation/%F0%9F%9B%A3Roadmap/roadmap.md)

---

## What it does

- **Sources** (left ingress panel) — draggable signal nodes, discovered dynamically from the
  `Routes/Sources/` tree: video stage boxes, audio stage boxes (channel banks), and **Productions**
  (finished program outputs re-exposed as routable sources). Shape encodes category: video
  reads as a trapezoid, audio as a rounded pill, group containers stay square.

- **Destinations** (footer tabs) — consumers of signal, discovered from the `Routes/Destinations/`
  tree. Each category (Control Rooms, Edit Suites, Encoders, Floors…) becomes a tab group;
  each room is a tab full of **twists**.

- **Patching** — drag a source onto a twist. The helix grows to show what's braided in; click
  the LCARS lip to fold/unfold the strand.

- **Editing** — click a twist to open its dedicated editor full-screen (see [The editors](#the-editors)).
  Twists with no matching editor fall through to a generic switcher-matrix modal where you
  drag rows to reorder priority and switcher-input assignments.

- **Fault propagation** — any source whose `status` isn't `OK` (e.g. `LOST CLOCK`) pulses red,
  and every destination it's routed into inherits the alarm, end-to-end. With state glyphs on
  (seat pref **State glyphs: Auto / On / Off**, or `?glyphs=on|off`) a `⚠` also marks the
  faulted node, room, fold header and twist, so the fault reads without colour
  (`ui/console/state-glyphs.ts`).

- **Captain's Log** — every routing change is narrated, persisted to IndexedDB, and published
  on the bus; selected entries can be reversed (**Reverse Course**), also after a reload and for
  another seat's entries (`ui/console/captains-log*.ts`). The `⧗ TIMELINE` viewer plots the log
  and the schedule on one time axis.

- **Room fixtures** — every destination carries standing fixtures whatever its twists
  (`ui/console/dest-fixtures.ts`): a MONITOR of the routed source (a routed PRODUCTION TIMERS
  feed paints the RC1000 dual-timer, `?timergfx=off` turns that off; `?tone=1` adds LISTEN to
  the source's line-up tone), a CLOCK, dual counters and a room chat.

- **Role-based access** — a "single pane of glass" gateway (see [Roles & access](#roles--access))
  scopes which controls each operator sees.

- **Zero-backend discovery** — the whole source/destination tree is just folders of JSON.
  Drop in a new stage box or control room and it appears in the UI; no code change. Discovery
  prefers an `index.json` manifest per folder (works on any static host) and falls back to
  parsing autoindex HTML.

- **The bus (optional)** — with a broker configured, consoles share params, crosspoints,
  presence, chat and the Captain's Log over retained MQTT under the `SPOG/` root
  (`platform/mqtt/`): AES-GCM encrypted protobuf by default, plain JSON when the broker
  config sets plaintext. Concurrent writes to one param
  are arbitrated by the merge mediator (higher seat rank wins, `platform/merge/`).
  `?wire=compact` opts into the smaller v3 wire. With no broker, everything still works locally.

---

## Philosophy

The rules the code actually follows, and where each one lives.

- **The patch panel is the map; the editors are the rooms.** New capability lands as a routable
  source/destination (a JSON file under `Routes/`) or as an editor folder that
  `src/editors/registry.ts` picks up with `import.meta.glob` — no central list to edit.
- **Data in, never DOM scraping.** An editor's `render(host, ctx)` reads a typed
  `EditorContext` that `src/app/context.ts` `buildContext()` resolves from the twist; the editor
  never reads the console's DOM.
- **Layers point one way.** `domain → model → platform → ui → editors → app`; editors never
  import editors and there are no `window.*` globals. When two editors must talk, a platform
  channel sits between them — the vision mixer announces on-air graphics on
  `src/platform/gfx-monitor.ts` and the multiviewer watches it.
- **Zero-backend, fail-soft persistence.** Discovery is static files (`src/platform/discovery.ts`);
  the growing stores (Captain's Log, chat) use IndexedDB through `src/platform/store-idb.ts`,
  which degrades to a no-op; the bus is optional (`src/platform/mqtt/client.ts`).
- **Keep going when something fails.** A broken piece is logged and fenced off; the rest keeps
  running. The vision mixer builds PRE-ROUTE and GFX SETS inside `try/catch` with an
  "unavailable" fallback (`src/editors/vision-mixer/index.ts`); a room fixture frame that throws
  is logged once and the loop carries on (`animate()` in
  `src/ui/console/dest-fixtures-shared.ts`); a failing gfx-monitor watcher does not stop the
  others (`src/platform/gfx-monitor.ts`); a batch Reverse Course skips the entry it cannot
  redo and reverses the rest (`src/ui/console/captains-log-narrate.ts`); a throwing send never
  wedges the throttle window (`src/platform/mqtt/throttle.ts`).
- **Converge, don't volley.** Concurrent writes are bucketed and resolved deterministically
  (`src/platform/merge/manager.ts`, `resolve.ts`) so every console snaps to one value.
- **Meaning without hue.** Category is shape (trapezoid video, pill audio), state can be a
  glyph (`src/ui/console/state-glyphs.ts`); colour is an accessibility layer set per seat in
  `src/ui/console/colour-engine.ts`.
- **Ship behind the seat.** New behaviour lands as a per-seat preference
  (`src/platform/prefs.ts`) or a URL switch (`?preroute=`, `?automv=`, `?glyphs=`, `?tone=`,
  `?timergfx=`, `?wire=compact`, `?mergelog=keep`), default off or unchanged, so it can be rolled back.
- **Small files.** Source files stay ≤200 lines; `SETUP/check-file-size.mjs` runs before every
  build (`npm run sizecheck`, `prebuild`), with a short grandfathered list.

---

## The editors

### The framework (`src/editors/registry.ts` + the `EditorPlugin` contract)

The app is **TypeScript**, built with Vite. Every editor is a self-contained package —
`src/editors/<name>/index.ts` — whose default export is one `EditorPlugin`. `registry.ts`
**globs them at build time**, so adding an editor is "drop a folder", with zero edits anywhere
else:

```ts
// src/editors/<name>/index.ts default-exports one of these:
interface EditorPlugin {
  id: string;
  match(twistName: string): boolean;   // does this editor handle that twist?
  title: string;                        // heading on the editor's LCARS rail
  blurb?: string;                       // one-line "what this window does" tip
  order?: number;                       // dispatch precedence (lower wins; default 100)
  requiredCaps?: Capability[];          // role gate (hidden if unmet)
  voiceCommands?: Record<string, string>;
  render: EditorRender;                 // (host, ctx) → builds the editor from data
}
```

The key inversion (vs. the retired JS app): an editor **never scrapes the DOM**. It receives a
fully-resolved, typed `EditorContext` — the routed feeds, siblings, production, role check, and
cross-editor services — as *data*. Editors are pure functions of `data → UI`.

The flow when you click a twist:

```
twist click  →  app/editor-dispatch.ts openEditorForTwist(twistEl)
   ├─ registry.ts pluginFor(twistName)         # first plugin whose match() wins (by order)
   ├─ app/context.ts buildContext(...)          # resolve feeds → typed EditorContext
   ├─ platform/overlay.ts openOverlay(...)       # full-screen LCARS overlay + #/<prod>/<twist> hash
   ├─ gate on plugin.requiredCaps (ctx.can)      # ACCESS DENIED if the role lacks a cap
   ├─ plugin.render(host, ctx)                   # build the editor from data
   └─ applyScope(host)                           # hide [data-cap] controls the role can't use
```

Layering is a rule (`domain → model → platform → ui → editors → app`); a layer imports only
from above it, **editors never import editors**, and there are **no `window.*` globals**.
The **shared UI toolkit** lives in `src/ui/`:

| Module | What it gives you |
| --- | --- |
| `ui/dom.ts` | `el()` typed element builder, `qs()` (throws, non-null), `addStyles()` |
| `ui/widgets.ts` | `knob()`, `fader()`, `meter()` (animated, disposer-driven) |
| `ui/timers.ts` | a per-editor `Disposer` — register intervals/rAF, torn down on close |
| `ui/scopes.ts` | RGB parade + vectorscope; `ui/audio-scope.ts`, `ui/loudness.ts` |
| `EditorContext` | `sources`, `siblings`, `production`, `can(cap)`, `services`, `dispose` |

Other niceties baked into the chrome: the **entire top bar is an "escape bar"** (click anywhere,
or press Esc, to go back), and editors **deep-link** via the URL hash (`#/<production>/<twist>`)
so an open editor is bookmarkable, shareable, and survives reload (lazy-loads its destination).

### Roles & access (`src/platform/auth.ts` + `ui/console/auth-panel.ts`, `ui/console/schedule.ts`)

The app boots logged in as **Captain** (full control) with a LOG OUT / SWITCH ROLE flow (the
top-right badge). Each role carries a **capability set**; `platform/auth.ts` `can(cap)` decides
access (admin implies all), editors declare `requiredCaps` and/or tag controls with
`data-cap="<capability>"`, and `applyScope()` — called on every editor open — **hides** any
control the current role lacks (progressive disclosure, not greyed-out locks).

| Capability | Meaning | Held by (role) |
| --- | --- | --- |
| `admin` | full facility control (implies all) | Captain · Executive Producer |
| `switch` | vision mixing / switcher | First Officer · Director; Conn · Helm (TD) |
| `route` | signal routing & resource mgmt | Conn · Helm (TD); Ops |
| `signal` | signal path & health | Director; Ops |
| `shade` | colour science / CCU shading | Chief Engineer · Shader |
| `gfx` | graphics & AR overlays | Tactical |
| `comms` | intercom matrix & talkback | Comms |
| `audio` | audio mixing | Comms |
| `book` | resource booking | Ops |
| `view` | view-only analytics | Science |
| `network` | network / bus infrastructure | Ops; Chief Engineer |
| `build` / `arrange` | layout authoring (add/edit vs move/resize) | First Officer; Ops (`arrange` also Conn) |

`ui/console/schedule.ts` (opened from the clock's seconds-dots) is the surface of the intended
**Schedule → Timeline → Resource-Booking** model:
a day's timeline of shows with assigned rooms and booked crew. The vision is that booked roles
load each operator's scope automatically, rather than hard-coding it. Today the gates are
editor-level `requiredCaps` (e.g. Vision Mixer `switch`, Camera/Lighting/WYSIWYG `shade`, IFB
`comms`, Audio Monitor `audio`, Multi Viewer `view`) plus one control-level gate: the camera
editor's Shading card (`data-cap="shade"`).

The Timeline Viewer (`#timeline`) already reads that model for clashes: its `⚠ STAFFING (N)`
button (or any lane's `×N` badge) lists each upcoming window where a crew role or production
room is booked twice or more — when, which role/room, how many more operators or rooms, and
which shows collide (`ui/console/captains-log-timeline-staffing.ts`).

---

### Video & switching

| Editor | File | Opens on twist named… | Title |
| --- | --- | --- | --- |
| Vision Mixer | `editors/vision-mixer/` | `vision`, `video mix`, `switch` | VISION MIXER |
| Multi Viewer | `editors/multi-viewer/` | `multi view` | MULTI VIEWER · LAYOUT MAKER |
| ISO Recorder | `editors/iso-recorder/` | `iso`, `replay` | ISO RECORDER · INSTANT REPLAY |

- **Vision Mixer** — a broadcast switcher: central **T-bar** between PROGRAM and PREVIEW
  monitors, bus source selection, transition styles (CUT / MIX / WIPE), and downstream keyers
  for lower-thirds and logos. This is the surface that *drives* tally — its PGM/PVW state is
  what the Signaling editor distributes. Control-room graphics are hard-wired (GFX 1-6 = DSK
  1-6's default sources, inputs 19-24): an M/E keyer keyed from one reads **USK · ⬡ GFX n**,
  and the **GRAPHICS PRE-ROUTE** module shifts which graphic feeds each bus — LIST (per-DSK
  selects) or MATRIX (GFX × DSK/USK grid); the view is remembered per device and
  `?preroute=matrix|list` overrides it. The **GFX SETS · PVW → PGM** module shows every
  graphic on the DSKs as a named set: click one to arm it on PREVIEW (dashed chip on the
  preview monitor), then **CUT GFX** or **AUTO GFX** takes every armed set to PROGRAM through
  a simulated fade (front-end only; an armed set already on air comes off). The plain DSK
  buttons still cut on/off air directly.
  It also announces every **on-air graphic** (whatever an ON DSK keys, plus hard-wired graphics on
  an ON M/E keyer or a PGM bus) per production on `platform/gfx-monitor.ts` — the feed the
  multiviewer's auto-graphics tiles watch (fail-soft: a broken watcher never blocks a take).
- **Multi Viewer** — a configurable monitor wall (2×2 → 16×16, plus PiP). Drag tiles to
  reorder, cycle each window's tally state, and edit UMD labels inline.
  **⬡ AUTO GFX** (opt-in per seat, or `?automv=1` / `?automv=0` in the URL) is the
  auto-multiviewer: every graphic on air on the production's switcher lands in a spare tile
  (dashed, PGM tally, captioned with where it rides — `DSK 1`, `M/E 2 KEY 3`…) with no manual
  route. Routed sources keep their cells; graphics past the raster are not shown.
- **ISO Recorder** — per-camera clean recording (timecode, disk space) paired with an instant
  **replay** engine: rolling buffer, jog/shuttle, angle select, variable speed, mark-to-air.

### Audio & comms

| Editor | File | Opens on twist named… | Title |
| --- | --- | --- | --- |
| Audio Mixer | `editors/audio-mixer/` | `audio mix`, `monitor console` | MONITOR CONSOLE · AUDIO |
| Audio Positioner | `editors/audio-positioner/` | `audio position`, `CMDP`, `surround pan` | CMDP · SPATIAL AUDIO PANNER |
| Audio Monitor | `editors/audio-monitor/` | `audio monitor`, `AFV`, `confidence` | AUDIO MONITOR · CONFIDENCE |
| Intercom | `editors/intercom/` | `intercom`, `comm` | INTERCOM · KEY PANEL |
| IFB | `editors/ifb/` | `ifb`, `foldback` | IFB · INTERRUPTIBLE FOLDBACK |

- **Audio Mixer** — a finger-friendly console: wide channel strips (fader + dB, VU, mute/solo,
  EQ, pan, two aux banks for mix-minus and monitoring), an LCARS layer rail, group buses that
  spill to child channels, and a pinned master tab. **Connects out** to the Stage Box editor:
  the "⚙ STAGE BOX" button calls `ctx.services.openStageBox(...)` to reach per-channel preamp gains.
- **Audio Monitor** — a confidence monitor scaling 1–24 channels across SDI quad-blocks, with
  PPM/VU ballistics + peak-hold, per-block phase (Lissajous) correlation, and an ITU-R BS.1770
  loudness master (LUFS, true-peak, −23 LUFS history plot).
- **Intercom** — the comms key panel: TALK/LISTEN per key with volume, gangable talk groups,
  and status cards for IFB, beltpacks, and the matrix. It is the **source layer** for IFB
  interrupts.
- **IFB** — assembles the talent earpiece feed: **mix-minus** (program minus the talent's own
  mic, to kill echo) plus the director's **interrupt**. Ducker graph, program/interrupt/threshold
  encoders, and a 3-tier talk priority hierarchy. Receives talk keys from Intercom.

### Camera (`src/editors/camera-control/` — a typed module set)

Opens on twist named `cam` / `camera` → **CAMERA CONTROL · CCU / RCP**. This is the most
elaborate editor, so it's split into a small module set that `index.ts` composes. It manages
**8 cameras**, with the active camera's state driving every panel each frame.

| Module | Responsibility / exports |
| --- | --- |
| `camera-control/state.ts` | `mkState()` per-camera state (pan/tilt/zoom/dolly/ped, iris, gains, blacks, gamma, shutter, presets) + `clamp()` |
| `camera-control/styles.ts` | the whole CCU stylesheet, injected once |
| `ui/scopes.ts` | `drawParade()` RGB waveform + `drawVectorscope()` — the shared colour-verification scopes (reused by Meter Input) |
| `camera-control/bars.ts` | `drawSMPTE()` precision colour bars + `stepDVD()` bouncing lineage badge |
| `camera-control/maps.ts` | `topSVG()`/`sideSVG()` studio robotics maps + `updateMaps()` (camera + FOV cone) |
| `camera-control/controls.ts` | builders: joystick (5-axis), shading (iris/gamma/gain + RGB-Venn), tally (8-cam), presets, functions |

A shared `ctx` threads the active camera's state and UI flags through every builder so a control
change ripples instantly to the scopes, maps, and parade. The **Shading Encoders card is gated
behind `data-cap="shade"`** — only the Chief Engineer (or Captain) sees it.

### Signal & infrastructure

| Editor | File | Opens on twist named… | Title |
| --- | --- | --- | --- |
| Encoder | `editors/encoder/` | `encoder`, `transcod`, `stream(ing) out`, `elemental` | ENCODER · TRANSCODING ENGINE |
| Signaling | `editors/signaling/` | `signal`, `tally`, `on-air` | SIGNALING · TALLY & TRIGGERS |
| Stage Box Input | `editors/stagebox-input/` | `stage box`, `preamp`, `mic input` | STAGE BOX INPUT · SMART OBJECT |
| Lighting | `editors/lighting/` | `light(ing)`, `key/fill/back light`, `cyc`, `gobo`, `dmx`, `fixture` (not `on-air`) | LIGHTING · DMX CONSOLE |
| WYSIWYG | `editors/wysiwyg/` | `wysiwyg`, `pre-viz`, `visualizer` | WYSIWYG · STUDIO PRE-VIZ |
| Meter Input | `editors/meter-input/` | `meter input` | METER INPUT · REAL-VIDEO TEST TOOLS |
| Signal Conditioner | `editors/signal-conditioner/` | `remote`, `conditioner` | SIGNAL CONDITIONER · FRAME-SYNC / DELAY / PROC-AMP |
| Test Signal Generator | `editors/tsg/` | `tsg`, `test signal` | TEST SIGNAL GENERATOR |
| Wireless | `editors/wireless/` | `wireless` | WIRELESS TELEMETRY & RF MANAGEMENT |
| Device | `editors/device/` | a device-pattern name or a known device | DEVICE INTERFACE · UNIVERSAL SURFACE |

- **Encoder** — a transcoding/streaming engine: 1:1 mezzanine in, one-to-many **ABR ladder**,
  RTMP/SRT destination vault, ST 2022-7 hitless failover, AES-128/DRM, live stream health.
  Auto-configures from the video/audio actually routed into the twist.
- **Signaling** — distributes **tally** from the vision mixer across 8 cameras (red PGM /
  green PVW / amber ISO), drives the studio On-Air light, switches Live/Rehearsal, and acts as
  a GPI/SCTE trigger panel with an event log. (Renamed from the old "Encoder" twist.)
- **Stage Box Input** — a "smart object" for a physical console input: preamp gain/headroom,
  interlocked +48V phantom (Smart-Verify guards ribbon mics), impedance match, cable HF comp,
  PPM history. Reached via the `services.openStageBox` context service the **Audio Mixer** calls.
- **Lighting** — a studio **DMX console** for a 3/4-point rig (Key/Fill/Back/Background) plus
  set lighting, with a top-down rig view, per-fixture intensity/colour-temp, scene recall, and
  a DMX-universe heartbeat.
- **Meter Input** — real-video/audio test tools; its hover help rides the shared `ui/tip.ts`
  panel like the rest of the app.
- **Device** — a universal surface for gear that describes itself (`platform/device/receiver.ts`).
- **WYSIWYG** — a top-down **pre-viz renderer** that mirrors the Lighting console's DMX state
  (beam cones, foot-candle heat-map, virtual talent + shadows, camera frustum, tally glow).
  The visual twin of the Lighting editor.

### Graphics, time & talent

| Editor | File | Opens on twist named… | Title |
| --- | --- | --- | --- |
| Graphics Engine | `editors/graphics-engine/` | `graphic`, `gfx`, `cg`, `lower third`, `chyron`, `weather`… | GRAPHICS ENGINE · CG / TITLE |
| Timer | `editors/timer/` | `timer`, `count down/up`, `stopwatch` | TIMER · DUAL COUNT |
| Chronos | `editors/chronos/` | `chrono` | CHRONOS · CHRONO RACK |
| Clock | `editors/clock/` | `clock` | CLOCK · TIME GENERATOR |
| Prompter | `editors/prompter/` | `prompt` | PROMPTER · TELEPROMPTER |
| Person | `editors/person/` | `person`, `talent`, `channel strip` | PERSON · VIRTUAL CHANNEL STRIP |

The forecast data and strip face the Graphics Engine uses live in `ui/weather/`, and the clock
faces the Clock and Timer share live in `ui/clock-faces/` — editors never import editors. The **Timer** is the RC1000-style dual up/down keypad transport, publishing on
`destinations/<dest>/counters_timer`; its PRODUCTION TIMERS feeds are routable sources.

### How the editors connect

Most editors are self-contained surfaces driven by the sources routed into their twist, but a
few interact directly, and several share state by convention:

```
Vision Mixer ──(PGM/PVW tally)──►  Signaling ──►  camera tally bank
Vision Mixer ──(on-air graphics, platform/gfx-monitor.ts)──►  Multi Viewer ⬡ AUTO GFX tiles
Timer ──(counters_timer on the bus)──►  room MONITOR fixture (RC1000 graphic)
Intercom ─────(talk keys)───────►  IFB (mix-minus + interrupt → talent earpiece)
Audio Mixer ──ctx.services.openStageBox()──►  Stage Box Input (per-channel preamp)
Lighting (DMX state) ◄── mirrors ──►  WYSIWYG (pre-viz of the same rig)
camera-control/index.ts  ──composes──►  camera-control/{state,styles,bars,maps,controls}.ts + ui/scopes.ts
EditorContext.siblings  ◄── Audio Monitor & IFB tile sibling twists of the same kind
```

Cross-editor needs arrive as **typed services on `EditorContext`** (e.g. `services.openStageBox`),
never as `window.*` globals. Everything else flows through the routed-source data on the context —
change a patch on the map and every editor that reads from that twist reflects it.

---

## Data model

Everything is plain JSON under `Routes/`, discovered at runtime by `platform/discovery.ts`
(prefers an `index.json` manifest per folder; falls back to autoindex HTML). The renderer for a
source leaf is chosen from the **shape** of its data, not its folder — so a new file just appears:

```
Routes/Sources/        # draggable signals
  001_Studio/<floor>/…             # studio stage boxes (audio channel banks, cameras)
  002_Remote/…                     # remote feeds
  003_Production/…                 # finished program outputs, re-exposed as sources
  004_Graphic/ 004_Player/ 004_Stream/   # graphics, playout, URL streams
  008_Prompter/ 010_Telemetry/     # prompter feeds, telemetry
Routes/Destinations/   # twists that consume signal
  001_Control Room/<tier>/<room>.json
  002_Floor/ 003_Encoder/ 004_Edit Suite/
  005_Testing/ 006_Engineering/    # e.g. the Meter Input scope bench
Routes/Schedule/Schedule.json      # the recurring production schedule
Routes/Talent/…                    # hosts, guests, correspondents (draggable people)
```

`SETUP/generate-manifests.mjs` regenerates each folder's `index.json`.

A **source** declares its channels, a colour class, a floor, and a `status`:

```json
{ "id": "stagebox-101", "name": "STAGEBOX 101", "prefix": "S101-", "count": 12,
  "extraClass": "audio-studio", "floor": "1st Floor", "items": ["CH 1", "…"],
  "status": "LOST CLOCK" }
```

A **destination** declares its twists. Each twist's `name` is what routes it to an editor (per
the tables above); `accepts` is `video` / `audio` / `both`; `inputs` and `maxVideo` / `maxAudio`
bound the switcher:

```json
{ "id": "prod3", "name": "PROD 3", "color": "#646DCC",
  "twists": [
    { "name": "Video Mixer", "accepts": "video", "inputs": ["SW IN 1", "…"] },
    { "name": "CAM 1", "accepts": "camera", "maxVideo": 1, "cameraInput": true },
    { "name": "Signaling", "accepts": "both" }
  ] }
```

## Running it

The app is **TypeScript**, built with **Vite**. Dev/test needs Node; the built app is a static
bundle that runs on any host.

```bash
npm install
npm run dev             # Vite dev server → open /index.next.html
npm run typecheck       # tsc --noEmit (strict, noUncheckedIndexedAccess)
npm test                # vitest — the *.test.ts files across domain/platform/ui/editors
npm run sizecheck       # the ≤200-line rule (also runs as prebuild)
npm run build           # → dist/  (content-hashed bundle + entry)
```

Deploy is CI only: `npm run deploy*` now just prints an error. A push to `main` runs
`.github/workflows/deploy-production.yml` (typecheck + tests, then `python3 SETUP/deploy.py`
over FTPS with the FTP secrets); `sandbox`/`develop` pushes and PRs run `deploy-sandbox.yml`.
`SETUP/deploy.py` rebuilds the bundle and uploads only the `Routes/` files changed in the push
(`--all` for a full sync, `--fresh` to also sweep dead server files).

### Layout (`src/` — layered TypeScript)

A layer imports only from the layers above it. No `window.*` globals; editors never import editors.

```
src/
  domain/                # pure logic, no DOM: routing-core (take/clear/salvo/tally/mixMinus),
                         #   test-card, test-tone, timer-core, tsg
  model/                 # the typed data shapes (Production, TwistConfig, SourceLeaf, Role…)
  platform/              # discovery, overlay + deep-link hash, auth, prefs, store-idb,
                         #   mqtt/ (the bus), merge/ (the mediator), gfx-monitor, device/
  ui/                    # dom/widgets/timers/scopes/loudness + console/ (the LCARS shell) + sources/
    console/             # footer tabs, destinations, matrix (DnD + drop), DNA helix, clock,
                         #   auth-panel, schedule, mission, portals, captains-log, dest-selector,
                         #   router-view (1990s), source-filter, lcars-pulse
    sources/             # the ingress panel: panel/pools/media-group/format/interact
  editors/               # one plugin package per editor (registry.ts globs them) + dispatch test
  app/                   # main.ts composition root, editor-dispatch.ts, context.ts (twist → EditorContext)
index.next.html          # the entry (loads /src/app/main.ts in dev; the built bundle in prod)
lcars.css                # the shared LCARS stylesheet
Documentation/🏛Philosophy/LCARS.md      # the LCARS style guide (the Corner Law, palette, typography)
Documentation/🛣Roadmap/roadmap.md          # what shipped, what is next
```

The visual language — the **Corner Law** (inner radius = ½ the outer; tops/bottoms
square unless horizontal), the palette tokens, typography and chirality rules — is
documented in **[`Documentation/🏛Philosophy/LCARS.md`](Documentation/🏛Philosophy/LCARS.md)**; colour and shape rules in
[`Documentation/🏛Philosophy/Colours and shapes.md`](Documentation/🏛Philosophy/Colours%20and%20shapes.md).

The retired plain-JS app (the original `js/` tree, `index.htm`, `sw.js`) is preserved under
[`archive/`](archive/) for reference — nothing there is imported, built, or deployed.

---

## Homage to the LCARS designers

This project is a love letter to **LCARS** — the *Library Computer Access/Retrieval System* —
the operating-system aesthetic of the 24th century. None of this look would exist without the
artists who invented it:

- **Michael Okuda**, scenic art supervisor for *Star Trek: The Next Generation*, *Deep Space
  Nine*, *Voyager*, and the films — the man who designed LCARS itself. The sweeping rounded
  "elbows," the flat candy-coloured panels, the confident typography, the idea that a starship
  interface could be *calm* — that's all Okuda. The fan community named the style the
  **"Okudagram"** in his honour, and this app's palette is taken straight from an Okudagram
  colour reference.
- **Denise Okuda**, scenic artist and video supervisor, Mike's collaborator and co-author of
  the *Star Trek Encyclopedia* — half of the partnership that made the future legible.
- **Rick Sternbach**, senior illustrator and technical consultant, who with Mike Okuda gave the
  hardware its grammar (the *Technical Manual*) so every readout felt like it meant something.
- **Gene Roddenberry**, for the conviction that the future's tools should look like they were
  built for people, not against them.

The colours here are credited to the *Okudagrams Color Complete Set Ver. 4.1*
(lcarsmania.com, Toshitin) and live in [`archive/lcars-styleguide.json`](archive/lcars-styleguide.json) —
LCARS Orange, Lilac, Blue Bell, Tomato, Sunflower, Red Alert, and the rest — used exactly as
intended: as flat, functional, beautiful blocks of information.

To Mike, Denise, Rick, and everyone who ever lined up a perfect LCARS elbow at 2 a.m. so a
panel would read right on camera — thank you. We're still trying to live up to the future
you drew.

> *"Tea. Earl Grey. Hot."* — and a clean signal path.

---

Created by **Anthony Peter Kuzub** · [like.audio/20260627/twist-like-audio](https://like.audio/20260627/twist-like-audio/)

LCARS is a trademark/design associated with *Star Trek* and its rights holders. This is a
non-commercial fan tribute and a working engineering tool; no affiliation or endorsement is
implied.

<!-- wiki:smoke -->
**Smoke test** — ✅ PASS 1/1 since 2026-10-30 12:51 EDT — [results](Documentation/%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md)
<!-- /wiki:smoke -->
