// src/ui/console/discovered — SPOG built from what is on the network.
//
// The Discovery Engine (PODS/POD.THICK/DISCOVERY.Engine, state/report/setup.rs)
// sends SPOG a SETUP: every live device as a full input and output list,
// retained at `APK.audio/Discovery/_engine/setup/<key>` and served at
// `/discovery/api/setup`. This module turns that into Routes/** the console
// already knows how to draw:
//
//   a device's OUTPUTS → a source leaf under Routes/Sources/090_Discovered/
//                        (audio as `items`, video as `video`, as the importer
//                        in router-io-devices.ts writes them)
//   a device's INPUTS  → a destination under Routes/Destinations/090_Discovered/,
//                        one twist per input (accepts audio / video). Every
//                        device found gets a destination tab, inputs or not,
//                        so every device is presented.
//
// IT IS LAID IN THE LIVE LAYER (routes-store `setLive`), NOT AS DRAFTS: a
// discovered device is a claim about now. When the engine erases a device's
// setup (it died — unreachable is dead), it leaves SPOG on the next rebuild and
// nothing in localStorage brings it back.
//
// First the HTTP list (works with no broker), then the bus keeps it live.

import { setLive, getStoredDraft, onDraftsChange } from '../../platform/routes-store.js';
import type { TwistBus } from '../../platform/mqtt/index.js';
import { renderSourcesPanel } from '../sources/panel.js';
import { wireSourceNodes } from '../sources/interact.js';
import { Footer, footerGroups } from './footer.js';
import { addDestinationTree } from './destinations.js';
import { type OpenEditor } from './matrix.js';
import { DEST_GROUP_COLORS, rgbAt } from '../palette.js';

import { onPanelsChanged } from './discovered-gui.js';
import {
  buildLayer, movedRoots, isSetup, SETUP_URL, SETUP_TOPIC, SRC_ROOT, DEST_ROOT, DEST_DIR,
  type DeviceSetup, type Roots,
} from './discovered-layer.js';
import { fetchMeters, rematch, meterMap } from './discovered-bim.js';
import { classOf, classSignature as signatureOf } from './discovered-class.js'; // meter > panel > I/O

export { buildLayer, FOLDER, type DeviceSetup, type DeviceIO } from './discovered-layer.js';

const GROUP_LABEL = 'DISCOVERED';
const devices = new Map<string, DeviceSetup>();
const diskRoots = new Map<string, string[]>();
let openEditor: OpenEditor | undefined;
let rebuildTimer: ReturnType<typeof setTimeout> | undefined;

async function diskRoot(url: string): Promise<string[]> {
  const drafted = getStoredDraft<string[]>(url);
  if (Array.isArray(drafted)) return drafted;
  if (!diskRoots.has(url)) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const parsed = res.ok ? (JSON.parse(await res.text()) as unknown) : [];
      diskRoots.set(url, Array.isArray(parsed) ? (parsed as string[]) : []);
    } catch { diskRoots.set(url, []); }
  }
  return diskRoots.get(url) ?? [];
}

let roots: Roots | null = null;   // what the live layer was last built on

/* Which group each device is in follows its panel: a panel arriving can move a
   device from Network and Control to Touch Panels, so a change in the panel
   index re-lays the layer — but only when some device actually changed group. */
let lastClasses = '';
const classSignature = (): string => signatureOf(devices.values());
let followingPanels = false;
function followPanels(): void {
  if (followingPanels) return;
  followingPanels = true;
  // Retained panels arrive in a burst of hundreds at connect; judge the burst
  // once, not once per panel (each judgement matches every device to every panel).
  let pending: ReturnType<typeof setTimeout> | undefined;
  onPanelsChanged(() => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = undefined;
      if (roots && classSignature() !== lastClasses) scheduleRebuild();
    }, 750);
  });
}
function lay(next: Roots): void {
  roots = next;
  rematch([...devices.values()]);
  setLive(buildLayer([...devices.values()], next.src, next.dest, classOf, meterMap()));
  lastClasses = classSignature();
}

async function applyLayer(): Promise<void> {
  lay({ src: await diskRoot(SRC_ROOT), dest: await diskRoot(DEST_ROOT) });
}

/* The layer re-derives the root manifests, so a root drafted AFTER it was built
   (a workbook import registering 009_Imported/, an edit) would stay hidden behind
   it (ROAD-3483). Re-lay it when a stored root draft moves — synchronously, inside
   the write that moved it, so whoever wrote the draft reads it back at once. */
let following = false;
function followRootDrafts(): void {
  if (following) return;
  following = true;
  onDraftsChange(() => {
    if (!roots) return;
    const next = movedRoots(
      roots,
      { src: getStoredDraft<string[]>(SRC_ROOT), dest: getStoredDraft<string[]>(DEST_ROOT) },
      { src: diskRoots.get(SRC_ROOT) ?? null, dest: diskRoots.get(DEST_ROOT) ?? null },
    );
    if (next === 'fetch') void applyLayer();
    else if (next) lay(next);
  });
}

/** Re-draw what the layer feeds: the sources rail and the DISCOVERED footer group. */
async function redraw(): Promise<void> {
  const ingress = document.querySelector<HTMLElement>('.ingress-panel');
  if (ingress) {
    ingress.innerHTML = '';
    await renderSourcesPanel(ingress, () => wireSourceNodes(ingress));
    wireSourceNodes(ingress);
  }
  const old = footerGroups().find((g) => !g.parent && g.path === GROUP_LABEL);
  if (old) Footer.removeGroup(old);
  if (devices.size) {
    const color = rgbAt(DEST_GROUP_COLORS, 6);
    const group = Footer.addGroup(GROUP_LABEL, { color, collapsed: true });
    await addDestinationTree(DEST_DIR, group, color, 'Discovered', openEditor, 'Discovered');
  }
}

function scheduleRebuild(): void {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => { void applyLayer().then(redraw); }, 750);
}

const seenAt = new Map<string, number>();
/** A setup not refreshed for this long is gone: the engine re-sends every live
 *  one each minute (SETUP_RESEND_SECS), and nothing unverified for five minutes
 *  is trusted. This is what clears a device the public lane cannot erase. */
export const STALE_MS = 5 * 60_000;
const POLL_MS = 60_000;

/** One setup heard (bus or HTTP); true when it changed what SPOG draws. */
function note(d: DeviceSetup): boolean {
  seenAt.set(d.key, Date.now());
  const before = JSON.stringify(devices.get(d.key) ?? null);
  devices.set(d.key, d);
  return before !== JSON.stringify(d);
}

/** The engine's list over HTTP — the bench path, and the one with no broker. */
async function fetchList(timeoutMs: number): Promise<boolean> {
  let changed = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(SETUP_URL, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const list = JSON.parse(await res.text()) as unknown;
      if (Array.isArray(list)) for (const d of list) if (isSetup(d) && note(d)) changed = true;
    }
  } catch { /* no engine behind this host — the console runs without it */ }
  return (await fetchMeters([...devices.values()], timeoutMs)) || changed;   // + which are meters (BIM library)
}

/** BEFORE the console first renders: read the engine's list once, so the first
 *  draw already carries the devices. Never blocks boot for long, never throws. */
export async function loadDiscovered(editor?: OpenEditor, timeoutMs = 2000): Promise<number> {
  openEditor = editor;
  await fetchList(timeoutMs);
  await applyLayer();
  followRootDrafts();
  followPanels();
  if (devices.size) console.info(`[SPOG] ${devices.size} device(s) from the Discovery Engine`);
  return devices.size;
}

/** AFTER boot: keep it live — the bus (a setup arriving adds or replaces its
 *  device, an empty one, the engine's erase, removes it), a minute's HTTP poll,
 *  and the decay that drops whatever stopped being said. */
export function followDiscovered(bus: TwistBus): () => void {
  const off = bus.subscribe(SETUP_TOPIC, (topic, payload) => {
    const key = topic.split('/').pop() ?? '';
    if (!key) return;
    if (isSetup(payload)) { if (note(payload)) scheduleRebuild(); }
    else if (devices.delete(key)) { seenAt.delete(key); scheduleRebuild(); }
  });
  const poll = setInterval(() => { void fetchList(5000).then((c) => { if (c) scheduleRebuild(); }); }, POLL_MS);
  const decay = setInterval(() => {
    const cutoff = Date.now() - STALE_MS;
    let gone = false;
    for (const [key, at] of seenAt) if (at < cutoff) { seenAt.delete(key); gone = devices.delete(key) || gone; }
    if (gone) scheduleRebuild();
  }, 30_000);
  return () => { off(); clearInterval(poll); clearInterval(decay); };
}
