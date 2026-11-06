// src/editors/instrument/data — the instrument editor's data, pure (no DOM, no bus).
//
// A bench box is laid as a SPOG destination by what its family's thing.json says
// it IS (ui/console/discovered-meters, ROAD-3516). This is what the editor reads
// for each role, from topics the bench already publishes — nothing is polled here:
//
//   metering    <prefix>/Reading/<command>[/<field>]   {"value": …, "unit"?: …, "ts"?: …}
//               every answer KOMAND publishes for the box (nab / get), whoever asked.
//   monitoring  System/Captures/Rig/<device>            {device, ts, rig: {"Trace/CHAN1": "<json>"}}
//               the capture recorder's retained rig; each Trace/<source> leaf is the
//               points and preamble to redraw it (the CAPTURE.Recorder agent's tracer).

// @ts-expect-error TS7016 — untyped vendored ES module (a .d.ts beside it would fail the vendor check)
import { Topics as T, captureSegment as seg } from '../../vendor/apk-contracts/apk-contracts.mjs';

/** The contract's capture slot topic and device segment, typed for this module. */
const Topics = T as { captures: { topic(a: { kind: string; capture: string }): string } };
const captureSegment = seg as (device: string) => string;

export interface Reading { name: string; value: string; unit: string; ts: string }

export interface Trace {
  source: string;
  /** 0..255, one per sample — a BYTE transfer spans the screen's vertical. */
  points: Uint8Array;
  /** Seconds at the first and last point, when the preamble said. */
  start: number | null;
  stop: number | null;
  /** Volts at point value p, when the preamble said: (p - yRef) * yInc + yOrigin. */
  volts: ((p: number) => number) | null;
}

// What the roles open — one definition, shared with the Discovered layer.
export { panesFor, opensInstrument as isInstrumentRoles } from '../../domain/instrument-roles.js';

const json = (payload: unknown): unknown => {
  if (typeof payload !== 'string') return payload;
  try { return JSON.parse(payload) as unknown; } catch { return payload; }
};

/** `APK.audio/System/Protocols/visa/Device/DMM/34401A/DevttyUSB0` → `visa/DMM/34401A/DevttyUSB0`,
 *  the capture recorder's device key; null for anything that is not a device prefix. */
export function deviceKey(prefix: string): string | null {
  const m = prefix.replace(/\/+$/, '').match(/\/Protocols\/([^/]+)\/Device\/(.+)$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** The retained rig topic the box's traces arrive on, or null. */
export function rigTopic(prefix: string): string | null {
  const key = deviceKey(prefix);
  return key ? Topics.captures.topic({ kind: 'Rig', capture: captureSegment(key) }) : null;
}

/** The readings filter for a box. */
export const readingsFilter = (prefix: string): string => `${prefix.replace(/\/+$/, '')}/Reading/#`;

/** One `…/Reading/<name>` message as a row, or null when it is not one. */
export function readingOf(topic: string, payload: unknown): Reading | null {
  const at = topic.indexOf('/Reading/');
  if (at < 0) return null;
  const name = topic.slice(at + '/Reading/'.length);
  if (!name) return null;
  const p = json(payload);
  const body = p && typeof p === 'object' && !Array.isArray(p) ? p as Record<string, unknown> : { value: p };
  if (!('value' in body)) return null;
  const v = body.value;
  return {
    name,
    value: v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v),
    unit: typeof body.unit === 'string' ? body.unit : '',
    ts: typeof body.ts === 'string' ? body.ts : typeof body.ts === 'number' ? new Date(body.ts).toISOString() : '',
  };
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Every Trace/<source> leaf of a rig message, in source order. A leaf that does
 *  not parse, or carries no points, is not drawn — nothing is invented. */
export function tracesOf(payload: unknown): Trace[] {
  const p = json(payload) as { rig?: Record<string, unknown> } | null;
  const rig = p && typeof p === 'object' ? p.rig : null;
  if (!rig || typeof rig !== 'object') return [];
  const out: Trace[] = [];
  for (const [leaf, raw] of Object.entries(rig)) {
    if (!leaf.startsWith('Trace/')) continue;
    const doc = json(raw) as Record<string, unknown> | null;
    const pts = doc && Array.isArray(doc.points) ? doc.points : null;
    if (!pts || !pts.length) continue;
    const yi = num(doc!.y_increment), yo = num(doc!.y_origin), yr = num(doc!.y_reference);
    out.push({
      source: String(doc!.source ?? leaf.slice('Trace/'.length)),
      points: Uint8Array.from(pts.map((x) => Math.max(0, Math.min(255, Number(x) || 0)))),
      start: num(doc!.start),
      stop: num(doc!.stop),
      volts: yi !== null && yo !== null && yr !== null ? (v: number) => (v - yr) * yi + yo : null,
    });
  }
  return out.sort((a, b) => a.source.localeCompare(b.source, undefined, { numeric: true }));
}
