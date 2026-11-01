// src/domain/scan/scan-route — what ONE admitted scan means in each mode
// (ROAD-3476). Pure: it decides, the SCAN panel (ui/scan) carries it out.
//
//   LOCATE  the code names device(s)/twist(s) in the netlist → reveal them
//   FILL    write the code into the ACTIVE entry's serial or asset tag
//   VERIFY  compare the code with the ACTIVE entry's recorded identity
//
// Every outcome that changes nothing says why (`refused`), and nothing is ever
// guessed: a code that names no entry is `not-found`, a card with nothing
// recorded is `unrecorded`, not a match.

import { cleanValue, locate, normCode, candidates, type Hit, type IdentityField, type NetEntry } from './netlist.js';

export type ScanMode = 'locate' | 'fill' | 'verify';

export interface RouteContext {
  entries: readonly NetEntry[];
  /** The device card the operator is working on (picked, or set by Locate). */
  active: NetEntry | null;
  /** Fill writes this field. */
  fillField: IdentityField;
}

export type Outcome =
  | { kind: 'located'; code: string; hits: Hit[] }
  | { kind: 'not-found'; code: string }
  | { kind: 'fill'; code: string; entry: NetEntry; field: IdentityField; value: string; previous?: string }
  | { kind: 'verified'; code: string; entry: NetEntry; field: IdentityField }
  | { kind: 'mismatch'; code: string; entry: NetEntry; recorded: Partial<Record<IdentityField, string>> }
  | { kind: 'unrecorded'; code: string; entry: NetEntry }
  | { kind: 'refused'; code: string; reason: string };

const recordedOf = (e: NetEntry): Partial<Record<IdentityField, string>> => {
  const r: Partial<Record<IdentityField, string>> = {};
  if (e.serial) r.serial = e.serial;
  if (e.asset_tag) r.asset_tag = e.asset_tag;
  if (e.mac) r.mac = e.mac;
  return r;
};

const label = (e: NetEntry): string => (e.parent ? `${e.parent} · ${e.name}` : e.name);

export function routeRead(mode: ScanMode, code: string, ctx: RouteContext): Outcome {
  const text = code.trim();
  if (!text) return { kind: 'refused', code, reason: 'empty code' };

  if (mode === 'locate') {
    const hits = locate(text, ctx.entries);
    return hits.length ? { kind: 'located', code: text, hits } : { kind: 'not-found', code: text };
  }

  const entry = ctx.active;
  if (!entry) return { kind: 'refused', code: text, reason: `no device card is active — Locate or pick one before ${mode === 'fill' ? 'Fill' : 'Verify'}` };

  if (mode === 'verify') {
    const want = new Set(candidates(text));
    const rec = recordedOf(entry);
    const fields = Object.keys(rec) as Array<IdentityField>;
    if (!fields.length) return { kind: 'unrecorded', code: text, entry };
    const field = fields.find((f) => want.has(normCode(rec[f]!)));
    return field ? { kind: 'verified', code: text, entry, field } : { kind: 'mismatch', code: text, entry, recorded: rec };
  }

  // FILL
  if (entry.live) {
    return { kind: 'refused', code: text, reason: `${label(entry)} is a discovered device — its identity is what the device reports; Verify it instead` };
  }
  const value = cleanValue(text);
  const field = ctx.fillField;
  if (normCode(entry[field] ?? '') === normCode(value)) {
    return { kind: 'refused', code: text, reason: `${label(entry)} already has ${field} ${value}` };
  }
  // A serial or asset tag names ONE unit: refuse to give it to a second one.
  const owner = ctx.entries.find((e) => e.key !== entry.key && normCode(e[field] ?? '') === normCode(value));
  if (owner) return { kind: 'refused', code: text, reason: `${field} ${value} is already recorded on ${label(owner)}` };
  return { kind: 'fill', code: text, entry, field, value, previous: entry[field] };
}
