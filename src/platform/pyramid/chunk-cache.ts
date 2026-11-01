// src/platform/pyramid/chunk-cache — where published L1 skeletons and L2/L3 chunks
// live in the browser. Chunks are keyed by the SHA-256 of their group's canonical
// JSON, so a group that did not change is found again under the same key and is
// never laid out twice; a skeleton is keyed by project name (it is replaced on every
// publish). IndexedDB when it opens; otherwise an in-memory map for the life of the
// page — the cache is a speed-up, never a dependency.
//
// Eviction (ROAD-3481) is by project, bounded: every skeleton carries when it was
// last published or opened; publishing a skeleton keeps the `maxProjects` most
// recently used and drops the rest, then sweeps every chunk no kept skeleton names
// (a re-import's replaced groups included — old chunks were never cleared before).
// Chunks written in this page in the last `graceMs` are spared, so a publish still
// writing its chunks is not swept by another project's publish before its own
// skeleton lands.
import type { Chunk, Skeleton } from '../../model/pyramid.js';
import { idbAvailable, idbDelete, idbGet, idbGetAll, idbKeys, idbPut } from '../store-idb.js';

export interface Evicted { projects: string[]; chunks: number }

export interface ChunkCache {
  readonly kind: 'indexeddb' | 'memory';
  hasChunk(hash: string): Promise<boolean>;
  getChunk(hash: string): Promise<Chunk | undefined>;
  putChunk(chunk: Chunk): Promise<void>;
  getSkeleton(project: string): Promise<Skeleton | undefined>;
  /** Store a project's skeleton, then evict down to the bound (what went is returned). */
  putSkeleton(project: string, skeleton: Skeleton): Promise<Evicted>;
  /** Run the eviction alone (also what putSkeleton runs). */
  evict(): Promise<Evicted>;
}

export interface CacheBounds {
  /** Most-recently-used projects kept (their skeletons and every chunk they name). */
  maxProjects?: number;
  /** A chunk written this recently by this page is never swept. */
  graceMs?: number;
  /** Clock, for tests. */
  now?: () => number;
}
export const DEFAULT_MAX_PROJECTS = 8;
const DEFAULT_GRACE_MS = 10 * 60_000;

interface Used { project: string; used: number; hashes: string[] }

/** Which projects to drop and which chunk hashes survive — pure. */
export function planEviction(projects: Used[], maxProjects: number): { drop: string[]; live: Set<string> } {
  const byRecency = [...projects].sort((a, b) => b.used - a.used || a.project.localeCompare(b.project));
  const kept = byRecency.slice(0, Math.max(0, maxProjects));
  return {
    drop: byRecency.slice(kept.length).map((p) => p.project),
    live: new Set(kept.flatMap((p) => p.hashes)),
  };
}

const hashesOf = (s: Skeleton): string[] => s.groups.map((g) => g.hash);

/** Chunks this page wrote recently, spared by the sweep. */
function freshness(graceMs: number, now: () => number) {
  const at = new Map<string, number>();
  return {
    mark: (h: string): void => { at.set(h, now()); },
    isFresh: (h: string): boolean => {
      const t = at.get(h);
      if (t == null) return false;
      if (now() - t <= graceMs) return true;
      at.delete(h); return false;
    },
  };
}

export function memoryChunkCache(bounds: CacheBounds = {}): ChunkCache {
  const max = bounds.maxProjects ?? DEFAULT_MAX_PROJECTS, now = bounds.now ?? Date.now;
  const fresh = freshness(bounds.graceMs ?? DEFAULT_GRACE_MS, now);
  const chunks = new Map<string, Chunk>();
  const skeletons = new Map<string, { skeleton: Skeleton; used: number }>();
  const evict = async (): Promise<Evicted> => {
    const plan = planEviction([...skeletons].map(([project, r]) => ({ project, used: r.used, hashes: hashesOf(r.skeleton) })), max);
    plan.drop.forEach((p) => skeletons.delete(p));
    let n = 0;
    for (const h of [...chunks.keys()]) if (!plan.live.has(h) && !fresh.isFresh(h)) { chunks.delete(h); n++; }
    return { projects: plan.drop, chunks: n };
  };
  return {
    kind: 'memory',
    hasChunk: async (h) => chunks.has(h),
    getChunk: async (h) => chunks.get(h),
    putChunk: async (c) => { chunks.set(c.hash, c); fresh.mark(c.hash); },
    getSkeleton: async (p) => {
      const r = skeletons.get(p); if (!r) return undefined;
      r.used = now(); return r.skeleton;
    },
    putSkeleton: async (p, s) => { skeletons.set(p, { skeleton: s, used: now() }); return evict(); },
    evict,
  };
}

interface ChunkRow { k: string; chunk: Chunk }
interface SkeletonRow { k: string; skeleton: Skeleton; used?: number }

/** IndexedDB-backed, with a memory front so one page never reads its own write back.
 *  Exported for the fake-indexeddb test; the app goes through openChunkCache. */
export function idbChunkCache(bounds: CacheBounds = {}): ChunkCache {
  const max = bounds.maxProjects ?? DEFAULT_MAX_PROJECTS, now = bounds.now ?? Date.now;
  const fresh = freshness(bounds.graceMs ?? DEFAULT_GRACE_MS, now);
  // The front never evicts by itself (it holds only what this page touched); the
  // sweep below drops from it whatever it drops from IndexedDB.
  const front = new Map<string, Chunk>();
  const frontSkel = new Map<string, Skeleton>();
  const evict = async (): Promise<Evicted> => {
    const rows = await idbGetAll<SkeletonRow>('skeletons');
    const plan = planEviction(rows.map((r) => ({ project: r.k, used: r.used ?? 0, hashes: hashesOf(r.skeleton) })), max);
    for (const p of plan.drop) { frontSkel.delete(p); await idbDelete('skeletons', p); }
    let n = 0;
    for (const h of await idbKeys('chunks')) {
      if (plan.live.has(h) || fresh.isFresh(h)) continue;
      front.delete(h); await idbDelete('chunks', h); n++;
    }
    return { projects: plan.drop, chunks: n };
  };
  return {
    kind: 'indexeddb',
    hasChunk: async (h) => front.has(h) || (await idbGet<ChunkRow>('chunks', h)) != null,
    getChunk: async (h) => front.get(h) ?? (await idbGet<ChunkRow>('chunks', h))?.chunk,
    putChunk: async (c) => { front.set(c.hash, c); fresh.mark(c.hash); await idbPut('chunks', { k: c.hash, chunk: c }); },
    getSkeleton: async (p) => {
      const s = frontSkel.get(p) ?? (await idbGet<SkeletonRow>('skeletons', p))?.skeleton;
      // Opening a project counts as using it (it is what LRU ranks by).
      if (s) await idbPut('skeletons', { k: p, skeleton: s, used: now() });
      return s;
    },
    putSkeleton: async (p, s) => {
      frontSkel.set(p, s);
      await idbPut('skeletons', { k: p, skeleton: s, used: now() });
      return evict();
    },
    evict,
  };
}

let shared: Promise<ChunkCache> | null = null;

/** The page's chunk cache: IndexedDB if it opens, else memory. */
export function openChunkCache(): Promise<ChunkCache> {
  shared ??= idbAvailable().then((ok) => (ok ? idbChunkCache() : memoryChunkCache()));
  return shared;
}
