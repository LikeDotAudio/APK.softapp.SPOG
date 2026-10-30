// src/platform/gfx-monitor — the switcher → multiviewer "on-air graphics" channel.
//
// Roadmap §2 Auto-multiviewer: any graphic on a DSK / the switcher automatically
// lands in a multiviewer tile, monitored without a manual route. Editors never
// import editors, so the vision mixer ANNOUNCES its on-air graphics here (per
// production) and the multiviewer WATCHES them. Same-tab delivery is an in-memory
// listener set; the last set is mirrored to localStorage so a multiviewer opened
// later (or in another tab, via the `storage` event) sees what is on air now.
//
// Fail-soft by design: a listener that throws, a full/blocked localStorage or a
// malformed mirror never breaks the announcer or the other watchers — the
// switcher keeps switching and the wall keeps drawing.

/** One graphic on air somewhere on the switcher. */
export interface OnAirGraphic {
  /** The source's label as the switcher names it (e.g. "SW 20"). */
  label: string;
  /** Where it rides: "DSK 1", "M/E 2 KEY 3", "M/E 1 PGM"… (a graphic can ride several). */
  via: string[];
}

type Listener = (list: OnAirGraphic[]) => void;

const LS_KEY = (production: string): string => `spog.gfx.onair.${production}`;
const listeners = new Map<string, Set<Listener>>();
const current = new Map<string, OnAirGraphic[]>();
const lastKey = new Map<string, string>();

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

function emit(production: string, list: OnAirGraphic[]): void {
  for (const cb of [...(listeners.get(production) ?? [])]) {
    try { cb(list); } catch (e) { console.warn('[gfx-monitor] watcher failed — others continue', e); }
  }
}

/** Announce the production's on-air graphics. Unchanged sets are not re-emitted. */
export function announceOnAirGraphics(production: string, list: OnAirGraphic[]): void {
  const clean = sanitize(list);
  const key = keyOf(clean);
  if (lastKey.get(production) === key) return;
  lastKey.set(production, key);
  current.set(production, clean);
  try { localStorage.setItem(LS_KEY(production), JSON.stringify(clean)); } catch { /* no storage — same-tab still works */ }
  emit(production, clean);
}

/** The last announced set for a production (memory, else the localStorage mirror). */
export function onAirGraphics(production: string): OnAirGraphic[] {
  const mem = current.get(production);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(LS_KEY(production));
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch { return []; }
}

/** Watch a production's on-air graphics (same tab + other tabs). Returns an unsubscribe. */
export function watchOnAirGraphics(production: string, cb: Listener): () => void {
  let set = listeners.get(production);
  if (!set) listeners.set(production, (set = new Set()));
  set.add(cb);
  const onStorage = (e: StorageEvent): void => {
    if (e.key !== LS_KEY(production)) return;
    try {
      const list = sanitize(JSON.parse(e.newValue ?? '[]'));
      current.set(production, list);
      lastKey.set(production, keyOf(list));
      cb(list);
    } catch (err) { console.warn('[gfx-monitor] bad cross-tab update ignored', err); }
  };
  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  if (hasWindow) window.addEventListener('storage', onStorage);
  return () => {
    set!.delete(cb);
    if (hasWindow) window.removeEventListener('storage', onStorage);
  };
}
