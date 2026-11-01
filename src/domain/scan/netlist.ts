// src/domain/scan/netlist — the SPOG netlist as the scanner sees it, and the
// matching of a scanned code against it (ROAD-3476). Pure: no DOM, no fetch.
//
// SPOG's netlist is Routes/**: a source leaf is a device whose feeds are its
// outputs, a destination file is a room or device whose twists are its inputs,
// and a route (wire) is a source feed placed on a twist. A discovered device
// (ui/console/discovered.ts) carries the engine's `device` record — its serial
// and MAC are the device's own word. Every document becomes one entry, and every
// twist of a destination one more, so a label on a camera finds "CAM 2" in its
// room and a label on a stagebox finds the stagebox.

export type NetKind = 'source' | 'destination' | 'twist';
export type IdentityField = 'serial' | 'asset_tag';
export type MatchField = IdentityField | 'mac' | 'id' | 'name';

export interface NetEntry {
  /** Stable key: the url, plus `#<index>` for a twist. */
  key: string;
  /** The Routes file this entry lives in (the draft/edit target). */
  url: string;
  kind: NetKind;
  name: string;
  id?: string;
  /** The room/device a twist belongs to. */
  parent?: string;
  twistIndex?: number;
  serial?: string;
  asset_tag?: string;
  mac?: string;
  /** In the live (discovered) layer — the device reports its own identity. */
  live: boolean;
}

export interface Hit { entry: NetEntry; field: MatchField }

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/** The entries one Routes document contributes. Non-objects and nameless files
 *  contribute nothing. */
export function entriesOf(url: string, doc: unknown, live = false): NetEntry[] {
  if (!isObj(doc)) return [];
  const name = str(doc.name);
  if (!name) return [];
  const dev = isObj(doc.device) ? doc.device : {};
  const destination = url.includes('/Destinations/');
  const out: NetEntry[] = [{
    key: url, url, kind: destination ? 'destination' : 'source', name, id: str(doc.id),
    serial: str(doc.serial) ?? str(dev.serial), asset_tag: str(doc.asset_tag), mac: str(dev.mac), live,
  }];
  const kit = isObj(doc.kit) ? doc.kit : {};
  const twists = Array.isArray(doc.twists) ? doc.twists : Array.isArray(kit.twists) ? kit.twists : [];
  if (destination) {
    twists.forEach((t: unknown, i: number) => {
      const tn = typeof t === 'string' ? str(t) : isObj(t) ? str(t.name) : undefined;
      if (!tn) return;
      const to = isObj(t) ? t : {};
      out.push({ key: `${url}#${i}`, url, kind: 'twist', name: tn, parent: name, twistIndex: i,
        serial: str(to.serial), asset_tag: str(to.asset_tag), live });
    });
  }
  return out;
}

/** Codes compare without case, spaces or separators: `00:1d:c1:12` = `001DC112`. */
export const normCode = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

const PREFIX = /^\s*(?:S\/?N|SER(?:IAL)?(?:\s*(?:NO|NUMBER))?|ASSET(?:\s*(?:TAG|NO))?|TAG|MAC)\s*[:#=.\-]?\s*/i;

/** A label's value without a printed field prefix (`S/N: 1234` → `1234`). */
export function cleanValue(code: string): string {
  const t = code.trim();
  const v = t.replace(PREFIX, '').trim();
  return v || t;
}

/** Every reading of a scanned text worth matching: as printed, without its
 *  field prefix, and — for a URL-shaped QR — its serial/asset/id query values
 *  and last path segment. */
export function candidates(code: string): string[] {
  const t = code.trim();
  const out = new Set<string>([t, cleanValue(t)]);
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      for (const k of ['serial', 'sn', 'asset', 'asset_tag', 'tag', 'id']) {
        const v = u.searchParams.get(k); if (v) out.add(v);
      }
      const last = u.pathname.split('/').filter(Boolean).pop();
      if (last) out.add(decodeURIComponent(last));
    } catch { /* not a URL after all */ }
  }
  return [...out].map(normCode).filter((c) => c.length > 0);
}

const RANK: MatchField[] = ['serial', 'asset_tag', 'mac', 'id', 'name'];

/** Every entry the code names, best first: label identity (serial, asset tag,
 *  MAC) before id before name. Exact after normalisation — never a substring,
 *  so a short code cannot "find" half the netlist. */
export function locate(code: string, entries: readonly NetEntry[]): Hit[] {
  const want = new Set(candidates(code));
  if (!want.size) return [];
  const hits: Hit[] = [];
  for (const entry of entries) {
    const field = RANK.find((f) => { const v = entry[f]; return typeof v === 'string' && want.has(normCode(v)); });
    if (field) hits.push({ entry, field });
  }
  return hits.sort((a, b) => RANK.indexOf(a.field) - RANK.indexOf(b.field));
}

/** The Routes tab id destinations.ts gives a destination file (footer tab). */
export function destTabId(url: string): string {
  const cut = url.lastIndexOf('/') + 1;
  const base = url.slice(0, cut), file = decodeURIComponent(url.slice(cut)).replace(/\.json$/i, '');
  return base.replace(/[^a-zA-Z0-9]/g, '-') + '--' + file.replace(/[^a-zA-Z0-9]+/g, '-');
}

/** Write `value` into an entry's field on its document, in place. A string
 *  twist becomes `{ name }` so it can carry identity. Returns the previous value. */
export function applyIdentity(doc: Obj, entry: NetEntry, field: IdentityField, value: string): string | undefined {
  if (entry.kind !== 'twist') {
    const prev = str(doc[field]);
    doc[field] = value;
    return prev;
  }
  const kit = isObj(doc.kit) ? doc.kit : null;
  const list = Array.isArray(doc.twists) ? doc.twists : kit && Array.isArray(kit.twists) ? kit.twists : null;
  const i = entry.twistIndex ?? -1;
  if (!list || i < 0 || i >= list.length) throw new Error(`twist ${i} is not in ${entry.url}`);
  const cur: unknown = list[i];
  const t: Obj = typeof cur === 'string' ? { name: cur } : isObj(cur) ? cur : { name: entry.name };
  const prev = str(t[field]);
  t[field] = value;
  list[i] = t;
  return prev;
}
