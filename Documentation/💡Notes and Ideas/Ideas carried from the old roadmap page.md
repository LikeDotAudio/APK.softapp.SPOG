# Ideas carried from the old roadmap page

When `🛣Roadmap/roadmap.md` became a pointer (2026-10-31), its shipped entries were dropped
(CHANGELOG.md and 🌍Publishing/DELIVERY.md record them) and its concrete open work went to the
APK.audio roadmap (ROAD-3447 – ROAD-3451). What is below is neither: ideas and audit-backed
proposals nobody has agreed to build yet. Most name a local audit in `Documentation/🔍Audits/`,
which is gitignored, so it exists only in the checkout that wrote it.

## Timeline and schedule
- **Timeline 5W+H reframe** — section the Timeline Viewer by node type (WHO people/crew, WHAT
  the show, WHERE studios/floors/remotes, WHEN the time axis, WHY the encoder timeline, HOW
  equipment/control rooms/edit suites) instead of today's WHERE/WHO pair. Needs a node-type →
  section classifier in `captains-log-timeline-data.ts`. The mapping and order were never confirmed.
- **Named second operator** — assign a person from the `⚠ STAFFING (N)` drawer.
- **Schedule authoring** — edit the recurring `SCHEDULE` (`ui/console/schedule.ts`, a code table)
  in the app and persist it; ties into the Routes Editor.
- **Studio-spaces hierarchical routing** — P2 grid-3-layer, P3 salvo, P4 JSON export
  (audit `Studio-Spaces-and-Hierarchical-Routing-Audit.md`).

## Editors
- **DVE WYSIWYG makeover** — a handle stage + crop + touchpad grammar in place of sliders and
  `prompt()` (audit `DVE-Makeover-Audit.md`).
- **Editor chirality C2** — the handedness flip exists for the console and the Vision Mixer;
  ~10 editors could follow (wysiwyg first, audio-mixer / camera-control most useful)
  (audit `Editor-Chirality-Audit.md`).
- **Graphics suite** — a graphics engine hosting editor-functions on dest-fixtures
  (audit `graphics-suite-architecture`).
- **Production video switcher** — audit and deployment notes drafted locally
  (`Production-Video-Switcher-*.md`).
- **Teleprompter conditioner-row** — the open question of whether the prompter gets a
  conditioner row was never answered.
- **Routes Editor, later slices** — the single-pane EDIT LAYOUT slice ships
  (`ui/console/authoring.ts`); drag-to-reorder, tree editing and an FS-Access / server sink were
  the later slices (audit `Routes-Editor-Single-Pane-Audit.md`).
- **Studio chat with talent** — the production-to-production chat dock ships
  (`ui/console/chat-dock.ts`); per-room production ⇄ talent endpoints were the audit's other variant.

## Bus and merge
- **Cross-console merge** — the writer's seat rank already rides `ValueMsg.seat` and the mediator
  reads it (`platform/merge/manager.ts`; the "Phase 2" note in `platform/merge/seat.ts` is stale).
  Left as ideas: a written convergence proof across consoles, and sparse-overlay publishing so
  orthogonal edits to one object compose.
- **Wireless telemetry** — audit `wireless_telemetry_audit.md`.

## Research bets
- **SMRT ideas, not the artifact** — an integer time index (`_tv`) for routing/param state and the
  camera-control "participant" probe; no Lua runtime in the browser, no backend rebuild on SMRT
  while it is pre-alpha and not openly licensed (audits `SMRT adoption in SPOG.md`,
  `Merge - vs last called.md`).
- **Real media plane** — SPOG is a front-end simulation; a real ST 2110 / IPMX / NMOS control and
  GStreamer render path is the largest long-term alignment.
- **RFSA integration layer** — the API between SPOG's simulation and a real media-production RFSA.
- **Patent surface** — local `Patent-Audit.md`.
