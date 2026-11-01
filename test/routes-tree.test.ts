// ROAD-3479 — the authored netlist (Routes/**) holds its own rules:
//   • every `id` is unique on its side — Destinations; Sources + Talent (nested
//     players / videos / streams included; a prompter script's block ids are its own). A repeated id made a SCAN Locate return
//     two devices and gave two rooms the same twist DOM ids (`<prod id>-<twist>`).
//   • the one allowed cross-side repeat is a production re-exposed as a source: the
//     same id on both sides only with the same name (PROD 3's outputs and its room).
//   • an authored `wire` / `format` is a word the Discipline Lens knows, so it lights
//     its lens instead of falling to OTHER.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { classifyConnection } from '../src/domain/lens/disciplines.js';

const ROUTES = resolve(__dirname, '../Routes');
const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : n.endsWith('.json') && n !== 'index.json' ? [p] : [];
});
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const docs = files(ROUTES).map((p) => ({ rel: relative(ROUTES, p), doc: JSON.parse(readFileSync(p, 'utf8')) as unknown }));
const side = (rel: string): 'dest' | 'src' | null =>
  rel.startsWith('Destinations/') ? 'dest' : rel.startsWith('Sources/') || rel.startsWith('Talent/') ? 'src' : null;

/** Prompter script `blocks` carry ids local to their script (b1, b2 … in every
 *  rundown), not devices — they are not in the netlist. */
const LOCAL = new Set(['blocks']);

/** Every `id` in a document, nested ones too, with the name beside it. */
function ids(v: unknown, out: Array<{ id: string; name: string; top: boolean }> = [], top = true): typeof out {
  if (Array.isArray(v)) v.forEach((x) => ids(x, out, false));
  else if (isObj(v)) {
    if (typeof v.id === 'string') out.push({ id: v.id, name: String(v.name ?? ''), top });
    Object.entries(v).forEach(([k, x]) => { if (!LOCAL.has(k)) ids(x, out, false); });
  }
  return out;
}

/** id → the files that declare it, per side. */
function byId(which: 'dest' | 'src', topOnly: boolean): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const { rel, doc } of docs) {
    if (side(rel) !== which) continue;
    for (const e of ids(doc)) if (!topOnly || e.top) m.set(e.id, [...(m.get(e.id) ?? []), rel]);
  }
  return m;
}
const repeats = (m: Map<string, string[]>): string[] => [...m].filter(([, f]) => f.length > 1).map(([id, f]) => `${id}: ${f.join(' | ')}`);

describe('Routes ids (ROAD-3479)', () => {
  it('reads the tree', () => {
    expect(docs.filter((d) => side(d.rel) === 'dest').length).toBeGreaterThan(20);
    expect(docs.filter((d) => side(d.rel) === 'src').length).toBeGreaterThan(20);
  });

  it('no id repeats among Destinations', () => {
    expect(repeats(byId('dest', false))).toEqual([]);
  });

  it('no id repeats among Sources and Talent, nested ids included', () => {
    expect(repeats(byId('src', false))).toEqual([]);
  });

  it('an id on both sides is the same production, by name', () => {
    const name = (rel: string): string => String((docs.find((d) => d.rel === rel)!.doc as Obj).name);
    const src = byId('src', true);
    const clash = [...byId('dest', true)].flatMap(([id, [d]]) => {
      const s = src.get(id)?.[0];
      return s && name(s) !== name(d!) ? [`${id}: ${s} (${name(s)}) vs ${d} (${name(d!)})`] : [];
    });
    expect(clash).toEqual([]);
  });
});

describe('Routes wire / format (ROAD-3479)', () => {
  const carriers = docs.flatMap(({ rel, doc }) => {
    const out: Array<{ rel: string; wire?: string; format?: string }> = [];
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (isObj(v)) {
        if (typeof v.wire === 'string' || typeof v.format === 'string') {
          out.push({ rel, wire: v.wire as string | undefined, format: v.format as string | undefined });
        }
        Object.values(v).forEach(walk);
      }
    };
    walk(doc);
    return out;
  });

  it('some authored leaves say what they ride on', () => {
    expect(carriers.map((c) => c.rel).sort()).toEqual(expect.arrayContaining([
      'Sources/010_Telemetry/002_Endpoints/001_PTP Grandmaster.json',
      'Sources/010_Telemetry/002_Endpoints/002_NMOS Registry.json',
    ]));
  });

  it('every authored wire / format is a word the lens classifies (never OTHER alone)', () => {
    const unknown = carriers.filter((c) => classifyConnection({ wire: c.wire ?? null, format: c.format ?? null }).join() === 'other');
    expect(unknown).toEqual([]);
  });
});
