// src/platform/mqtt/wire — the v3 compact wire (payload-optimisation, roadmap §3.7).
//
// Behind a reversible switch: `?wire=compact` (or localStorage `spog.wire` =
// `compact`) makes THIS console's encoder write
//   • crosspoints FRONT-CODED — each entry interned against the previous one
//     (`CAM 1, CAM 2` → `CAM 1` + {4, "2"}), and
//   • Captain's Log entries as a protobuf LogMsg instead of JSON in json_fallback.
// Every build's DECODER reads v3 regardless, so a compact seat is understood by
// any console on this build; a console on an OLDER build skips the new fields
// (crosspoints read as empty, log entries as absent) — hence opt-in, not default.

import type { spog } from './schema.js';

let override: boolean | null = null;
let cached: boolean | null = null;

/** Is the v3 compact encoder on for this console? */
export function wireCompact(): boolean {
  if (override !== null) return override;
  if (cached !== null) return cached;
  let on = false;
  try { on = new URLSearchParams(globalThis.location?.search ?? '').get('wire') === 'compact'; } catch { /* no location */ }
  try { on = on || globalThis.localStorage?.getItem('spog.wire') === 'compact'; } catch { /* private mode */ }
  return (cached = on);
}
/** Force the switch (tests, diagnostics); null returns to URL / localStorage. */
export function setWireCompact(on: boolean | null): void { override = on; }

/** Common prefix length in UTF-16 units, never splitting a surrogate pair. */
function shared(a: string, b: string): number {
  let n = 0;
  const max = Math.min(a.length, b.length);
  while (n < max && a.charCodeAt(n) === b.charCodeAt(n)) n++;
  if (n > 0 && n < b.length && /[\uD800-\uDBFF]/.test(b[n - 1]!)) n--;
  return n;
}

/** Intern a crosspoint list against itself: each entry keeps only what differs from the one before. */
export function frontCode(list: string[]): { xpShared: number[]; xpSuffix: string[] } {
  const xpShared: number[] = [], xpSuffix: string[] = [];
  list.forEach((s, i) => { const n = i ? shared(list[i - 1]!, s) : 0; xpShared.push(n); xpSuffix.push(s.slice(n)); });
  return { xpShared, xpSuffix };
}
export function frontDecode(xpShared: number[], xpSuffix: string[]): string[] {
  const out: string[] = [];
  xpSuffix.forEach((suf, i) => { out.push((i ? out[i - 1]!.slice(0, xpShared[i] ?? 0) : '') + suf); });
  return out;
}

/** A log-bridge payload ({voyage, entry, dest, …}) — sniffed by shape like the other arms. */
export const isLogPayload = (p: any): boolean =>
  !!p && typeof p === 'object' && typeof p.voyage === 'number' && typeof p.entry === 'number' && typeof p.dest === 'string';

export function logToProto(p: any, originId: number): spog.LogMsg.$Shape {
  return {
    voyage: p.voyage >>> 0, entry: p.entry >>> 0, tsMs: p.ts ?? 0, dest: p.dest ?? '', prod: p.prod ?? '',
    added: p.added ?? [], removed: p.removed ?? [], text: p.text ?? '', by: p.by ?? '', role: p.role ?? '',
    reversed: !!p.reversed, reversedBy: p.reversedBy ?? '', reversedTs: p.reversedTs ?? 0, originId,
  };
}

/** Rebuild the JSON shape log-bridge consumers read; empty optionals read as absent. */
export function logFromProto(m: spog.LogMsg.$Properties, num: (v: unknown) => number, fullId: string): Record<string, unknown> {
  const opt = (s: string | null | undefined): string | undefined => (s ? s : undefined);
  const rts = num(m.reversedTs);
  return {
    voyage: m.voyage, entry: m.entry, ts: num(m.tsMs), dest: m.dest ?? '', prod: m.prod ?? '',
    added: m.added ?? [], removed: m.removed ?? [], text: m.text ?? '', by: opt(m.by), role: opt(m.role),
    reversed: !!m.reversed, reversedBy: opt(m.reversedBy), reversedTs: rts || undefined, full_id: fullId,
  };
}
