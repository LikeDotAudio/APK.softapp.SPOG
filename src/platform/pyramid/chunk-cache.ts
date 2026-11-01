// src/platform/pyramid/chunk-cache — where published L1 skeletons and L2/L3 chunks
// live in the browser. Chunks are keyed by the SHA-256 of their group's canonical
// JSON, so a group that did not change is found again under the same key and is
// never laid out twice; a skeleton is keyed by project name (it is replaced on every
// publish). IndexedDB when it opens; otherwise an in-memory map for the life of the
// page — the cache is a speed-up, never a dependency.
import type { Chunk, Skeleton } from '../../model/pyramid.js';
import { idbAvailable, idbGet, idbPut } from '../store-idb.js';

export interface ChunkCache {
  readonly kind: 'indexeddb' | 'memory';
  hasChunk(hash: string): Promise<boolean>;
  getChunk(hash: string): Promise<Chunk | undefined>;
  putChunk(chunk: Chunk): Promise<void>;
  getSkeleton(project: string): Promise<Skeleton | undefined>;
  putSkeleton(project: string, skeleton: Skeleton): Promise<void>;
}

export function memoryChunkCache(): ChunkCache {
  const chunks = new Map<string, Chunk>();
  const skeletons = new Map<string, Skeleton>();
  return {
    kind: 'memory',
    hasChunk: async (h) => chunks.has(h),
    getChunk: async (h) => chunks.get(h),
    putChunk: async (c) => { chunks.set(c.hash, c); },
    getSkeleton: async (p) => skeletons.get(p),
    putSkeleton: async (p, s) => { skeletons.set(p, s); },
  };
}

interface ChunkRow { k: string; chunk: Chunk }
interface SkeletonRow { k: string; skeleton: Skeleton }

/** IndexedDB-backed, with a memory front so one page never reads its own write back. */
function idbChunkCache(): ChunkCache {
  const front = memoryChunkCache();
  return {
    kind: 'indexeddb',
    hasChunk: async (h) => (await front.hasChunk(h)) || (await idbGet<ChunkRow>('chunks', h)) != null,
    getChunk: async (h) => (await front.getChunk(h)) ?? (await idbGet<ChunkRow>('chunks', h))?.chunk,
    putChunk: async (c) => { await front.putChunk(c); await idbPut('chunks', { k: c.hash, chunk: c }); },
    getSkeleton: async (p) => (await front.getSkeleton(p)) ?? (await idbGet<SkeletonRow>('skeletons', p))?.skeleton,
    putSkeleton: async (p, s) => { await front.putSkeleton(p, s); await idbPut('skeletons', { k: p, skeleton: s }); },
  };
}

let shared: Promise<ChunkCache> | null = null;

/** The page's chunk cache: IndexedDB if it opens, else memory. */
export function openChunkCache(): Promise<ChunkCache> {
  shared ??= idbAvailable().then((ok) => (ok ? idbChunkCache() : memoryChunkCache()));
  return shared;
}
