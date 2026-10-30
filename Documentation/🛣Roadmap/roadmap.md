# SPOG Roadmap

*A living map of where **SPOG (Single Pane Of Glass)** is going. SPOG is a zero-backend,
browser-based control surface for a multi-floor production facility — a drag-to-route
signal-flow visualizer whose "twists" open into role-specific editors (vision mixer, CCU,
audio, lighting, prompter, graphics, timers…), backed by a static `Routes/**` file tree and
a retained-MQTT `TwistBus`.*

*Last updated: 2026-10-30.*

> **How to read this.** Each item carries a status:
> `✅ Shipped` · `🚧 In progress` · `⏭️ Next` · `📋 Planned` · `🔬 Exploring`.
> Deep design rationale for most items lives in audits named below by file name. Those
> audits are **local working documents**: `Documentation/🔍Audits/` is gitignored, so none of
> the named audits ship in this repository (only `monolith-audit.md` sits there in a working
> checkout). This roadmap summarizes and sequences them — it is not itself normative.

---

## 0. Guiding principles

- **Zero-backend by default.** The console runs off a static host + a broker. Every feature
  must degrade gracefully with no MQTT and no server.
- **The patch panel is the map; the editors are the rooms.** New capability usually lands as
  either a new routable source/destination or a new editor behind a twist.
- **Meaning without hue.** Category is shape-coded, state is glyph-coded; colour is an
  accessibility layer, never the sole carrier of meaning (see the Colour Engine).
- **200-line rule.** Files stay ≤200 lines (CI tripwire `SETUP/check-file-size.mjs`); split
  by responsibility, not by arbitrary cut.
- **Ship behind the seat.** Per-seat preferences and reversible experiments over big-bang
  cutovers.

---

## 1. Now — recently shipped

- ✅ **Switcher PRE-ROUTE matrix + explicit USK/DSK graphics** — GFX × DSK/USK MATRIX beside the per-DSK LIST (`vision-mixer/gfx-route.ts`, `preroute.ts`, `?preroute=matrix|list`); M/E keyers on a graphic read `USK n · ⬡ GFX m`; a PRE-ROUTE fault leaves the switcher running.
- ✅ **DSK preview → take (faux-take GFX sets)** — `GFX SETS · PVW → PGM` module: arm a DSK graphic on preview, CUT/AUTO GFX takes it to program through a simulated fade (`vision-mixer/gfx-take.ts`, `gfx-take-panel.ts`).
- ✅ **Auto-multiviewer (first slice)** — the switcher announces on-air graphics per production (`vision-mixer/gfx-feed.ts` → `platform/gfx-monitor.ts`); the wall's opt-in `⬡ AUTO GFX` (`?automv=1`) fills spare cells with read-only AUTO tiles (`multi-viewer/auto-gfx.ts`).
- ✅ **Reverse Course after reload** — routing rows persist their source labels and `captains-log-reroute.ts` re-derives the undo; a batch skips what it can't redo and carries on; merge events are session-only notes (`?mergelog=keep` restores).
- ✅ **Needs-staffing drawer** — `⚠ STAFFING (N)` in the Timeline header lists every double-booked crew role / room window (`captains-log-timeline-staffing.ts`); the REFRESH button handler is fixed.
- ✅ **Shared tooltips: Meter Input** — the last hand-rolled tooltip now rides `src/ui/tip.ts` (`helpTip()`); its `.mi-tip` panel is gone.
- ✅ **RC1000 dual-timer graphic on MONITOR** — a routed PRODUCTION TIMERS feed paints the seven-seg timer from the room's `counters_timer` snapshot (`domain/timer-core/graphic.ts`, `ui/timer-graphic.ts`; `?timergfx=off`).
- ✅ **Test-frame tone half** — EBU R68 line-up + per-source ident (`domain/test-tone`), LISTEN/MUTE on each room MONITOR behind `?tone=1` (`ui/test-tone-player.ts`).
- ✅ **Colour Engine state glyphs (P0)** — `⚠` on faulted nodes, rooms, folds and twists so fault reads without colour (`ui/console/state-glyphs.ts`; seat pref Auto/On/Off, `?glyphs=on|off`).
- ✅ **Wire payload optimisation** — bounded throttle slots + flush on dispose, seat/label on `ValueMsg`, origin-only `full_id`; opt-in `?wire=compact` (front-coded crosspoints + protobuf `LogMsg`, 889 → 562 B measured).
- ✅ **Deterministic Merge Mediator + Observer** — replaces per-topic last-writer-wins with a
  windowed arbitration layer: concurrent writes to a param are bucketed and resolved by
  **higher seat rank wins** (full_id tie-break), so consoles converge with no "up/down"
  volley. A `⚖ MERGE` panel (in the seat MENU) shows the live argument + a self-contained
  arena; contested merges surface a toast. Design audit (local): `Merge - vs last called.md`;
  companion `SMRT adoption in SPOG.md`.
- ✅ **Timeline Viewer v110** — one stringline/swimlane graph of the Captain's Log + schedule,
  foldable tree, projected recurring schedule, filter + multi-select room chips, minimap
  zoom/scrub, `#timeline` deep-link. Design audit (local): `TimeLine Investigation.md`.
- ✅ **Timeline polish (this cycle)** —
  - Left-column titles + fold headers stay **pinned on horizontal scroll**.
  - Folded topics show an **inline event count** *and* a **one-line summary event** on the
    header row (never vanish).
  - `SHOW ALL` **tucks everything back up** to the compact overview.
- ✅ **24-hour global newsroom schedule** — 20 shows across time-zone bureaus (London / Tokyo /
  Sydney), a designed **prime-time peak of exactly 5 concurrent productions**, a **45-minute
  rehearsal band** on every slot, and **overlap stacking**: two concurrent shows needing one
  role stack into sub-rows with a `×N` badge (= people/rooms the slot demands), e.g. `Ops ×2`
  reads as "impossible without a second person".
- ✅ **Heartbeat monitor** — the LCARS edge data-pulse is now **off by default**, toggled
  per-seat under **Colour & Vision**.
- ✅ Prior recent work (see `CHANGELOG.md`): OOPS illegal-route logging, crosspoint provenance
  cards, unified cross-browser Captain's Log, protobuf v2 + throttling, Cache/Prefs/PWA.

---

## 2. In progress / next

- 🚧 **Control-room graphics in the switcher — what is left** — pre-route, USK/DSK surfacing,
  DSK preview/take and the auto-multiviewer's first slice shipped (§1). *Next:* a switcher and
  wall in different productions/seats (the on-air list rides the same-browser
  `platform/gfx-monitor.ts` channel today, not the bus); AUTO tiles that reserve cells instead
  of only filling spare ones; a GFX SET take that rides the bus instead of front-end only.
  Ties into §3.2 Graphics suite.
- 🚧 **Timeline 5W+H reframe** — re-section the Timeline Viewer by node type instead of the
  current WHERE/WHO pair:
  | Question | Contents |
  |---|---|
  | WHO | people · reporters · crew |
  | WHAT | the deliverable / programmed show name |
  | WHERE | studios · floors · remotes |
  | WHEN | the time axis (bottom ruler) |
  | WHY | the encoder timeline |
  | HOW | equipment · control rooms · productions · encoders · edit suites |
  Needs a node-type → section classifier in `captains-log-timeline-data.ts`. *Pending final
  confirmation of the mapping + section order.*
- ⏭️ **Seat rank on the wire for cross-console merge** — the mediator's higher-rank-wins is
  authoritative within a console and now carries `seat`/`label` on `ValueMsg`; finish the
  cross-console convergence proof + sparse-overlay publishing so orthogonal edits compose.

---

## 3. Planned — by theme

### 3.1 Timeline, schedule & resource booking
- 📋 **Resource-conflict follow-up** — assign a named second operator from the needs-staffing
  drawer (the drawer itself shipped, §1).
- 📋 **Schedule authoring** — edit the recurring `SCHEDULE` in-app (today it is a code table),
  round-tripping to a persisted store. Ties into the Routes Editor work (3.5).
- 📋 **Studio-spaces hierarchical routing** — P2 grid-3-layer, P3 salvo, P4 JSON-export of the
  four-phase redesign. Audit: `Studio-Spaces-and-Hierarchical-Routing-Audit.md`.

### 3.2 Editors & control surfaces
- 📋 **DVE WYSIWYG makeover** — replace slider/prompt()-driven DVE with a Photoshop/AE-style
  handle stage + crop + fast touchpad grammar. Audit (local): `DVE-Makeover-Audit.md`.
- 📋 **Editor chirality C2** — handedness flip for ~10 editors (wysiwyg first; audio-mixer /
  camera-control highest benefit). Audit: `Editor-Chirality-Audit.md`.
- 🚧 **RC1000 dual-timer source** — keypad transport (TIMER editor) and the MONITOR graphic
  shipped (§1). Next: the same graphic on the multi-viewer / vision-mixer previews (they use
  `drawFauxSignal`, which has no timer hook yet). Audit: `RC1000-Dual-Timer-Audit.md`.
- 📋 **Graphics suite** — a graphics engine hosting a suite of editor-functions mounted on
  dest-fixtures. Audit: `graphics-suite-architecture`.
- 📋 **Production video switcher** — audit + deployment plan already drafted
  (local `Production-Video-Switcher-*.md`).
- 🚧 **Shared tooltips / tool-ticks** — every hand-rolled tooltip now rides `src/ui/tip.ts`
  (Meter Input was the last, §1). Left: editors still on native `title=` hovers (Vision Mixer,
  Graphics Engine, a few elsewhere) move to `hint()`. Audit: `LCARS-Hover-Tooltips-…-Audit.md`.

### 3.3 Sources, destinations & test signal
- 🚧 **Test-frame routing** — picture half (`src/domain/test-card`) and the opt-in tone half
  (`?tone=1`, §1) shipped. Next: tone on the multiviewer/audio-monitor surfaces, then
  default-on. Audit: `Test-Frame-Routing-Audit.md`.
- 📋 **Weather forecast strip** — P2 on-air "forecast strip" faces (P0/P1 shipped). Audit:
  `Weather-Forecast-Strip-Audit.md`.
- 📋 **Teleprompter conditioner-row** — resolve the open conditioner-row question.

### 3.4 Collaboration & the bus
- 📋 **Studio chat room** — per-room production⇄talent text/image/link dialog riding the
  TwistBus like the Captain's Log. Audit: `Studio-Chat-Room-Audit.md`.
- 📋 **TWIST→MQTT advertising** — advertise every room/route/resource/log event onto an MQTT
  topic tree (`TwistBus`). Audit: `TWIST-MQTT-Advertising-Audit.md`.
- 📋 **Wireless telemetry** — audit exists locally (`wireless_telemetry_audit.md`).

### 3.5 Authoring & topology
- 📋 **Routes Editor (single pane)** — direct-manipulation authoring of rooms/stage-boxes/
  talent, inverting the editor registry into a palette + a write sink
  (localStorage → FS Access API → server). Audit: `Routes-Editor-Single-Pane-Audit.md`.

### 3.6 Accessibility & presentation
- 🚧 **Colour Engine expansion** — presets and fault state glyphs (P0, §1) shipped. Next:
  on-air/OK/muted glyphs on live surfaces, then the P2 hex→token migration.
  Rules: [Colours and shapes](../🏛Philosophy/Colours%20and%20shapes.md).
- 📋 **Icon-view FACE axis** — skin LCARS chrome with generated icon tiles. Audit:
  `Icon-View-Aesthetic-Audit.md`.

### 3.7 Wire & performance
- 🚧 **Protobuf payload optimization** — the default-on and opt-in `?wire=compact` slices
  shipped (§1). Next: make v3 the default once every seat runs a v3-decoding build.
  Audit: `Protobuf-Payload-Optimization-Audit.md`.

---

## 4. Exploring — research & bets

- 🔬 **SMRT adoption (ideas, not the artifact)** — borrow the **sentinel merge** (done, §1) and
  an **integer time index (`_tv`)** for routing/param state into TypeScript; run the
  camera-control "participant" probe. Do **not** fork a Lua runtime into the browser or
  rebuild the backend on SMRT until it is past pre-alpha and openly licensed. Audits:
  `SMRT adoption in SPOG.md`, `Merge - vs last called.md`.
- 🔬 **Real media plane** — SPOG is a front-end *simulation*; a genuine ST 2110 / IPMX / NMOS
  control + GStreamer render path is the largest long-term alignment and the least available
  today (greenfield on both sides).
- 🔬 **RFSA integration layer** — the delta between SPOG's front-end simulation and a real
  media-production RFSA is the API/integration layer. Audits (local): the RFSA reports.
- 🔬 **Patent surface** — local `Patent-Audit.md`.

---

## 5. Backlog index

Every `📋` / `🔬` item above traces to a local audit (named by file name above). When
picking up an item: read its audit first, confirm scope, then ship the smallest reversible
slice behind a seat preference or a URL param. New proposals start as an audit, not as code.

This roadmap and the rules under `Documentation/🏛Philosophy/` are tracked in git. The audits
it names (`RC1000-Dual-Timer-Audit.md`, `Test-Frame-Routing-Audit.md`,
`Protobuf-Payload-Optimization-Audit.md` and the rest) are not: `Documentation/🔍Audits/` is
in `.gitignore`, so they exist only in the working checkout that wrote them.
