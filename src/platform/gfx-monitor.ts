// src/platform/gfx-monitor — the switcher → multiviewer "on-air graphics" channel.
//
// Roadmap §2 Auto-multiviewer: any graphic on a DSK / the switcher automatically
// lands in a multiviewer tile, monitored without a manual route. Editors never
// import editors, so the vision mixer ANNOUNCES its on-air graphics here (per
// production) and the multiviewer WATCHES them.
//
// Transport (ROAD-3447): the set rides the TwistBus RETAINED at
// SPOG/productions/<id>/gfx/on-air, so a wall in another browser, seat or
// production sees what is on air and a wall opened later replays it. Same-tab
// delivery is the in-memory listener set. With no broker the last set is mirrored
// to localStorage instead (the same-browser path: a later or other tab reads it,
// live via the `storage` event) — localStorage is never written while a bus is up.
//
// Fail-soft by design: a listener that throws, a full/blocked localStorage or a
// malformed payload never breaks the announcer or the other watchers — the
// switcher keeps switching and the wall keeps drawing.

import type { TwistBus } from './mqtt/types.js';
import { gfxOnAirTopic } from './mqtt/topics.js';

/** One graphic on air somewhere on the switcher. */
export interface OnAirGraphic {
  /** The source's label as the switcher names it (e.g. "SW 20"). */
  label: string;
  /** Where it rides: "DSK 1", "M/E 2 KEY 3", "M/E 1 PGM"… (a graphic can ride several). */
  via: string[];
}

/** The retained payload: self-describing, like seat-sync's envelope. */
interface OnAirEnvelope { v: 1; ts: number; production: string; full_id: string; list: OnAirGraphic[] }

type Listener = (list: OnAirGraphic[]) => void;

export interface GfxMonitor {
  /** Announce the production's on-air graphics. Unchanged sets are not re-emitted. */
  announce(production: string, list: OnAirGraphic[]): void;
  /** The last known set for a production (memory/bus, else the no-broker mirror). */
  current(production: string): OnAirGraphic[];
  /** Watch a production's on-air graphics (this tab, the bus, other tabs). Returns an unsubscribe. */
  watch(production: string, cb: Listener): () => void;
  /** The bus came up after announcements/watchers began: publish what this seat announced, subscribe its watchers. */
  rebind(): void;
}

const LS_KEY = (production: string): string => `spog.gfx.onair.${production}`;
const keyOf = (list: OnAirGraphic[]): string => list.map((g) => `${g.label}@${g.via.join('+')}`).join('|');

function sanitize(raw: unknown): OnAirGraphic[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((g): OnAirGraphic[] => {
    if (!g || typeof g !== 'object') return [];
    const { label, via } = g as Partial<OnAirGraphic>;
    if (typeof label !== 'string' || !label) return [];
    return [{ label, via: Array.isArray(via) ? via.filter((v): v is string => typeof v === 'string') : [] }];
  });
}

/** One monitor over one bus (null or a disabled bus = this browser only). */
export function createGfxMonitor(getBus: () => TwistBus | null): GfxMonitor {
  const listeners = new Map<string, Set<Listener>>();
  const busSubs = new Map<string, () => void>();
  const current = new Map<string, OnAirGraphic[]>();
  const lastKey = new Map<string, string>();
  const mine = new Set<string>();   // productions THIS seat announced
  const live = (): TwistBus | null => { const b = getBus(); return b && b.status().enabled ? b : null; };

  /** Adopt a set (from any transport) and tell this tab's watchers — once per change. */
  function adopt(production: string, list: OnAirGraphic[]): boolean {
    const key = keyOf(list);
    if (lastKey.get(production) === key) return false;
    lastKey.set(production, key);
    current.set(production, list);
    for (const cb of [...(listeners.get(production) ?? [])]) {
      try { cb(list); } catch (e) { console.warn('[gfx-monitor] watcher failed — others continue', e); }
    }
    return true;
  }

  function publish(production: string, list: OnAirGraphic[]): void {
    const bus = live();
    if (bus) {
      const env: OnAirEnvelope = { v: 1, ts: Date.now(), production, full_id: bus.sessionId, list };
      bus.publishRaw(gfxOnAirTopic(production), env, { retain: true });
    } else {
      try { localStorage.setItem(LS_KEY(production), JSON.stringify(list)); } catch { /* no storage — same-tab still works */ }
    }
  }

  /** One bus subscription per production, shared by every watcher of it. */
  function subscribe(production: string): void {
    const bus = live();
    if (!bus || busSubs.has(production)) return;
    busSubs.set(production, bus.subscribe(gfxOnAirTopic(production), (_t, p) => {
      const env = p as Partial<OnAirEnvelope> | null;
      if (!env || env.v !== 1 || env.production !== production) return;
      adopt(production, sanitize(env.list));
    }));
  }

  return {
    announce(production, list) {
      const clean = sanitize(list);
      mine.add(production);
      if (adopt(production, clean)) publish(production, clean);
    },

    rebind() {
      for (const production of listeners.keys()) if (listeners.get(production)!.size) subscribe(production);
      for (const production of mine) publish(production, current.get(production) ?? []);
    },

    current(production) {
      const mem = current.get(production);
      if (mem) return mem;
      if (live()) return [];   // the bus replays the retained set to watchers
      try {
        const raw = localStorage.getItem(LS_KEY(production));
        return raw ? sanitize(JSON.parse(raw)) : [];
      } catch { return []; }
    },

    watch(production, cb) {
      let set = listeners.get(production);
      if (!set) listeners.set(production, (set = new Set()));
      set.add(cb);
      subscribe(production);
      const onStorage = (e: StorageEvent): void => {
        if (e.key !== LS_KEY(production)) return;
        try { adopt(production, sanitize(JSON.parse(e.newValue ?? '[]'))); }
        catch (err) { console.warn('[gfx-monitor] bad cross-tab update ignored', err); }
      };
      const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
      if (hasWindow) window.addEventListener('storage', onStorage);
      return () => {
        set!.delete(cb);
        if (hasWindow) window.removeEventListener('storage', onStorage);
        if (!set!.size) { busSubs.get(production)?.(); busSubs.delete(production); }
      };
    },
  };
}

// ---- the page's monitor ------------------------------------------------------
// The shell binds the TwistBus at boot (bindGfxMonitorBus); until then, and in
// tests, the monitor is this browser only.

let pageBus: TwistBus | null = null;
const page = createGfxMonitor(() => pageBus);

/** Put the page's on-air graphics on the bus (shell boot). */
export function bindGfxMonitorBus(bus: TwistBus): void { pageBus = bus; page.rebind(); }

export const announceOnAirGraphics = (production: string, list: OnAirGraphic[]): void => page.announce(production, list);
export const onAirGraphics = (production: string): OnAirGraphic[] => page.current(production);
export const watchOnAirGraphics = (production: string, cb: Listener): (() => void) => page.watch(production, cb);
