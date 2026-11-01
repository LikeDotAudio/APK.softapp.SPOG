// src/domain/pyramid/interpret — stages 1–3 of the import pipeline for the formats
// SPOG reads, pure (so the worker can run them):
//   sniff      what is this? one format from the first bytes, or a named refusal
//   interpret  bytes → a proved value → the ONE project shape (Topology), plus the
//              flat sheets the 1990s view's DOM replay still commits from.
// SpreadsheetML needs DOMParser, which a Worker does not have — the pipeline parses
// it on the main thread with the reader ui/ hands it, then calls `fromSheets`.
import type { Topology } from '../../model/pyramid.js';
import { fromJson } from '../router-doc/json.js';
import { parseCsv, type Sheet } from '../router-doc/sheet.js';
import { sheetsToTopology } from './translate.js';

export type ImportFormat = 'spog.router/1' | 'spog.topology/1' | 'csv' | 'spreadsheetml';
export const FORMATS: readonly ImportFormat[] = ['spog.router/1', 'spog.topology/1', 'csv', 'spreadsheetml'];

export interface Sheets { sources: Sheet | null; destinations: Sheet | null }
export interface Interpreted { format: ImportFormat; topology: Topology; sheets: Sheets; notes: string[] }

export function sniff(text: string): ImportFormat | null {
  const t = text.trimStart();
  if (t.startsWith('{')) {
    const head = t.slice(0, 4096);
    if (/"schema"\s*:\s*"spog\.topology\/1"/.test(head)) return 'spog.topology/1';
    if (/"schema"\s*:\s*"spog\.router\/1"/.test(head) || /"(sources|destinations)"\s*:/.test(head)) return 'spog.router/1';
    return null;
  }
  if (/^<\?xml|^<\?mso|^<Workbook/i.test(t)) return 'spreadsheetml';
  const first = (t.split(/\r?\n/, 1)[0] ?? '').toLowerCase();
  if (first.includes(',') && /\b(origin|twist)\b/.test(first)) return 'csv';
  return null;
}

const hasCol = (s: Sheet, h: string): boolean => s.headers.some((x) => x.trim().toLowerCase() === h);

/** Which sheet is which: by tab name first, then by the columns it carries. */
export function pickSheets(sheets: Sheet[]): Sheets {
  const destinations = sheets.find((s) => /dest/i.test(s.name) && hasCol(s, 'twist'))
    ?? sheets.find((s) => hasCol(s, 'twist') && hasCol(s, 'routed feed')) ?? null;
  const sources = sheets.find((s) => /source/i.test(s.name) && hasCol(s, 'origin'))
    ?? sheets.find((s) => hasCol(s, 'origin') && hasCol(s, 'feed') && !hasCol(s, 'twist')) ?? null;
  return { sources, destinations };
}

export function fromSheets(format: ImportFormat, name: string, sheets: Sheet[]): Interpreted {
  const picked = pickSheets(sheets);
  if (!picked.sources && !picked.destinations) {
    throw new Error('no Sources tab (Origin, Feed) and no Destinations tab (Room, Twist, Routed Feed)');
  }
  const { topology, notes } = sheetsToTopology(name, picked.sources, picked.destinations);
  return { format, topology, sheets: picked, notes };
}

function proveTopology(v: unknown): Topology {
  const t = v as Partial<Topology>;
  if (!t || t.schema !== 'spog.topology/1') throw new Error('schema is not spog.topology/1');
  if (!Array.isArray(t.devices)) throw new Error('devices: expected an array');
  if (!Array.isArray(t.wires)) throw new Error('wires: expected an array');
  return { schema: t.schema, name: String(t.name ?? ''), devices: t.devices, wires: t.wires };
}

/** Stages 2 + 3 for every format a Worker can read (all but SpreadsheetML). */
export function interpret(format: ImportFormat, name: string, text: string): Interpreted {
  switch (format) {
    case 'spog.router/1': {
      const { sources, destinations } = fromJson(text);
      return fromSheets(format, name, [sources, destinations]);
    }
    case 'spog.topology/1': {
      const topology = proveTopology(JSON.parse(text));
      return { format, topology: { ...topology, name: topology.name || name }, sheets: { sources: null, destinations: null }, notes: [] };
    }
    case 'csv': {
      const rows = parseCsv(text);
      const headers = rows.shift() ?? [];
      return fromSheets(format, name, [{ name: 'CSV', headers, rows }]);
    }
    default:
      throw new Error(`${format} needs a DOM parser — it cannot be read off the main thread`);
  }
}
