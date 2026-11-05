// src/platform/sim/simulator — the SPOG simulator: every source, room and person
// DEFINED IN Routes/** JSON runs as a live device, ON BY DEFAULT.
//
// The console's Routes tree is a facility on paper. The simulator makes it run:
// it walks Routes/Sources, Routes/Destinations and Routes/Talent (drafts and
// imports included — it reads through the same listDirectory/fetchJSON the
// console does), hands each file to sim-model.ts, lays the result into the
// device receiver as a manifest, and ticks it: meters move, ONLINE / GAIN / MUTE
// are live controls, STATUS follows them. The Device editor and anything else
// that reads platform/device draws them exactly as it draws a real box.
//
// LOCAL, NOT ON THE BUS. Every console runs its own copy; publishing would have
// N consoles each claiming the same devices on a shared broker. A value an
// operator sets still goes out through publishDeviceValue like any other.
//
// The discovered layer (090_Discovered) is real hardware and is never simulated.
//
// OFF: ?sim=off on the URL, or localStorage `spog.sim` = "off" (a seat that
// wants only real devices). ?sim=on forces it back on.

import { listDirectory, fetchJSON } from '../discovery.js';
import { ingestManifest, ingestValue, getDevice } from '../device/receiver.js';
import { manifestFor, tick, SIM_PREFIX } from './sim-model.js';

export const SIM_AREAS = ['Sources', 'Destinations', 'Talent'] as const;
export const TICK_MS = 250;
export const SIM_PREF_KEY = 'spog.sim';
const SKIP_DIR = /^\d*_?Discovered$/i;

/** Whether this console simulates: on unless ?sim=off or the seat said off. */
export function simEnabled(search: string = typeof location !== 'undefined' ? location.search : '',
  pref: string | null = readPref()): boolean {
  const asked = new URLSearchParams(search).get('sim');
  if (asked === 'off' || asked === '0' || asked === 'false') return false;
  if (asked === 'on' || asked === '1' || asked === 'true') return true;
  return pref !== 'off';
}

function readPref(): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(SIM_PREF_KEY) : null; } catch { return null; }
}

interface Running { id: string; status: string }
const running = new Map<string, Running>();
let timer: ReturnType<typeof setInterval> | undefined;

/** Every Routes file under `dir`, depth first, the discovered layer skipped. */
async function walk(dir: string, out: string[]): Promise<void> {
  const { dirs, files } = await listDirectory(dir);
  for (const f of files) out.push(dir + f.href);
  for (const d of dirs) {
    if (SKIP_DIR.test(d.name.replace(/\/$/, ''))) continue;
    await walk(dir + d.href, out);
  }
}

/** Load every defined device into the receiver. Resolves the number running. */
export async function loadSimulated(): Promise<number> {
  for (const area of SIM_AREAS) {
    const urls: string[] = [];
    try { await walk(`Routes/${area}/`, urls); } catch { continue; }
    await Promise.all(urls.map(async (url) => {
      const doc = await fetchJSON<Record<string, unknown>>(url);
      const m = manifestFor(doc, decodeURIComponent(url), area);
      if (!m || running.has(m.id)) return;
      if (ingestManifest(m)) running.set(m.id, { id: m.id, status: String((doc as { status?: unknown })?.status ?? 'OK') });
    }));
  }
  return running.size;
}

/** One tick for every running device. */
export function stepAll(now: number = Date.now()): void {
  for (const r of running.values()) {
    const m = getDevice(r.id);
    if (!m) continue;
    for (const [io, v] of tick(m, now, r.status)) ingestValue(r.id, io, v);
  }
}

/** Start the simulator (no-op when disabled or already running). */
export async function startSimulator(): Promise<number> {
  if (!simEnabled() || timer) return running.size;
  const n = await loadSimulated();
  if (n) {
    timer = setInterval(() => stepAll(), TICK_MS);
    console.info(`[SPOG] simulator: ${n} device(s) defined in Routes/** are running (?sim=off to stop)`);
  }
  return n;
}

export function stopSimulator(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}

/** True for a device the simulator runs (its id carries the sim prefix). */
export const isSimulated = (id: string): boolean => id.startsWith(SIM_PREFIX) && running.has(id);
