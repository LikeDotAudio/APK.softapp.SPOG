// src/domain/pyramid/prepare — the part of the import pipeline that needs nothing
// but the bytes: parse + translate (interpret), gate, normalise. It is one function
// so the Web Worker runs all of it and hands the main thread a finished, proved,
// normalised Topology — or a refusal naming the stage. Pure.
import { interpret, fromSheets, type ImportFormat, type Interpreted } from './interpret.js';
import { gate, normalise } from './normalise.js';
import type { Sheet } from '../router-doc/sheet.js';

export type StageName = 'sniff' | 'parse' | 'gate' | 'normalise' | 'diff' | 'commit' | 'layout' | 'publish';

export type Prepared =
  | { ok: true; value: Interpreted }
  | { ok: false; stage: StageName; reason: string };

function finish(value: Interpreted): Prepared {
  const refusal = gate(value.topology);
  if (refusal) return { ok: false, stage: 'gate', reason: refusal };
  const n = normalise(value.topology);
  return { ok: true, value: { ...value, topology: n.topology, notes: [...value.notes, ...n.notes] } };
}

const reasonOf = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** From text — what the Worker runs. */
export function prepare(format: ImportFormat, name: string, text: string): Prepared {
  let value: Interpreted;
  try { value = interpret(format, name, text); } catch (e) { return { ok: false, stage: 'parse', reason: reasonOf(e) }; }
  return finish(value);
}

/** From sheets already parsed on the main thread (SpreadsheetML, via DOMParser). */
export function prepareSheets(format: ImportFormat, name: string, sheets: Sheet[]): Prepared {
  let value: Interpreted;
  try { value = fromSheets(format, name, sheets); } catch (e) { return { ok: false, stage: 'parse', reason: reasonOf(e) }; }
  return finish(value);
}
