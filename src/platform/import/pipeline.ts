// src/platform/import/pipeline — the ONE import interpreter every file import
// passes through (ROAD-3474), eight stages in order:
//
//   1 sniff      what is this? → exactly one format, or a refusal listing the formats
//   2 parse      in a Web Worker: bytes → proved value → the ONE Topology shape
//   3 gate       refuse, don't degrade (empty, duplicate ids, wire with no end)
//   4 normalise  the same rewrites for everyone, each one said in `notes`
//   5 diff       the delta against the project already committed under that name
//   6 commit     the only write: the caller's sink (e.g. the 1990s view's DOM
//                replay), then the project store's next version
//   7 layout     once, over the full model, per group (skipped on a chunk-cache hit)
//   8 publish    L1 skeleton + one content-addressed L2/L3 chunk per group
//
// A stage that fails stops the import with an ImportError naming the file, the stage
// and the reason; nothing after it runs. 2–4 run in the worker (domain/pyramid/prepare).
// Layout/publish failing does NOT undo the commit: the project is in, the preview is not.
import type { Topology } from '../../model/pyramid.js';
import { FORMATS, sniff, type ImportFormat, type Interpreted } from '../../domain/pyramid/interpret.js';
import { prepareSheets, type StageName } from '../../domain/pyramid/prepare.js';
import { diffTopology, type Delta } from '../../domain/pyramid/diff.js';
import type { Sheet } from '../../domain/router-doc/sheet.js';
import { prepareOffThread, type Where } from './off-thread.js';
import { deriveAndPublish, type Published } from '../pyramid/publish.js';
import type { ChunkCache } from '../pyramid/chunk-cache.js';
import { memoryProjects, type ProjectStore } from './projects.js';

export class ImportError extends Error {
  constructor(readonly file: string, readonly stage: StageName, readonly reason: string) {
    super(`${file}: ${stage} refused — ${reason}`);
    this.name = 'ImportError';
  }
}

export interface ImportOptions {
  /** File name (for messages) — also the project name unless `name` is given. */
  file?: string;
  name?: string;
  /** SpreadsheetML reader (needs DOMParser, so ui/ supplies it; runs on the main thread). */
  parseXml?: (text: string) => Sheet[];
  /** Committed projects, for the delta and the version. Default: a fresh memory store. */
  projects?: ProjectStore;
  /** The caller's write (runs before the store's version moves). Throwing aborts the import. */
  commit?: (value: Interpreted, delta: Delta, version: number) => unknown;
  /** Where chunks are published. Null skips stages 7–8. */
  cache?: ChunkCache | null;
}

export interface ImportResult<C = unknown> {
  format: ImportFormat;
  where: Where;
  topology: Topology;
  value: Interpreted;
  notes: string[];
  delta: Delta;
  version: number;
  committed: C | undefined;
  published: Published | null;
  ms: Partial<Record<StageName, number>>;
}

export async function runImport<C = unknown>(text: string, opts: ImportOptions = {}): Promise<ImportResult<C>> {
  const file = opts.file ?? 'import';
  const name = opts.name ?? file.replace(/\.[^.]+$/, '');
  const ms: Partial<Record<StageName, number>> = {};
  let t = performance.now();
  const lap = (s: StageName): void => { const n = performance.now(); ms[s] = Math.round((n - t) * 10) / 10; t = n; };

  const format = sniff(text);
  if (!format || (format === 'spreadsheetml' && !opts.parseXml)) {
    throw new ImportError(file, 'sniff', `not a format this build can import (it reads ${FORMATS.join(', ')})`);
  }
  lap('sniff');

  const { prepared, where } = format === 'spreadsheetml'
    ? { prepared: prepareSheets(format, name, opts.parseXml!(text)), where: 'inline' as const }
    : await prepareOffThread(format, name, text);
  if (!prepared.ok) throw new ImportError(file, prepared.stage, prepared.reason);
  const value = prepared.value;
  lap('parse');

  const projects = opts.projects ?? memoryProjects();
  const head = projects.get(value.topology.name);
  const delta = diffTopology(head?.topology ?? null, value.topology);
  lap('diff');

  const version = (head?.version ?? 0) + 1;
  let committed: C | undefined;
  try {
    committed = (await opts.commit?.(value, delta, version)) as C | undefined;
  } catch (e) {
    throw new ImportError(file, 'commit', e instanceof Error ? e.message : String(e));
  }
  projects.put(value.topology.name, version, value.topology);
  lap('commit');

  let published: Published | null = null;
  const notes = [...value.notes];
  if (opts.cache) {
    try { published = await deriveAndPublish(value.topology, version, opts.cache); }
    catch (e) { notes.push(`layout/publish failed — the project is committed, its preview is not: ${String(e)}`); }
  }
  lap('publish');
  return { format, where, topology: value.topology, value, notes, delta, version, committed, published, ms };
}
