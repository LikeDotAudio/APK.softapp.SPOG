// ROAD-3481 — the chunk cache's REAL IndexedDB path (store-idb v2, 'chunks' and
// 'skeletons'), under fake-indexeddb: a publish lands in IndexedDB, a second page
// (a fresh cache, empty memory front) reads the project back from it, and the
// by-project bound evicts the least recently used project and sweeps the chunks
// nothing names any more — including the groups a re-import replaced.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import type { Chunk, Skeleton } from '../../model/pyramid.js';
import { arenaDoc } from '../../domain/pyramid/arena-fixture.js';
import { runImport } from '../import/pipeline.js';
import { memoryProjects } from '../import/projects.js';
import { idbKeys } from '../store-idb.js';
import { idbChunkCache, memoryChunkCache, openChunkCache, planEviction } from './chunk-cache.js';
import { PyramidView, cachedSource } from './loader.js';

const small = { areas: 2, groups: 2, perGroup: 3, ports: 2 };   // 8 groups (4 walls + 4 rooms)
const text = (_name: string, status = 'OK'): string => {
  const doc = arenaDoc(small);
  doc.sources[0]!.children![0]!.children![0]!.status = status;
  return JSON.stringify(doc);
};
const noFull = () => Promise.reject(new Error('L4 not needed'));

const chunk = (hash: string): Chunk => ({ group: hash, hash, devices: [], wires: [] });
const skel = (name: string, hashes: string[]): Skeleton => ({
  identity: { name, version: 1, devices: 0, wires: 0, groups: hashes.length },
  groups: hashes.map((h) => ({ id: h, side: 'source' as const, box: { x: 0, y: 0, w: 1, h: 1 }, devices: 0, hash: h })),
});

describe('chunk cache on IndexedDB (fake-indexeddb)', () => {
  it('opens on IndexedDB when it is there', async () => {
    expect((await openChunkCache()).kind).toBe('indexeddb');
  });

  it('publishes into IndexedDB and a second page reads the project back from it', async () => {
    const page1 = idbChunkCache({ graceMs: 0 });
    const r = await runImport(text('A'), { file: 'A.json', name: 'A', cache: page1, projects: memoryProjects() });
    expect(r.published!.layouts).toBe(8);
    const stored = await idbKeys('chunks');
    for (const g of r.published!.skeleton.groups) expect(stored).toContain(g.hash);

    const page2 = idbChunkCache({ graceMs: 0 });            // empty memory front: every read is IndexedDB
    const view = await PyramidView.open(cachedSource('A', page2, noFull));
    expect(view.identity).toMatchObject({ name: 'A', groups: 8 });
    const g0 = r.published!.skeleton.groups[0]!;
    expect((await page2.getChunk(g0.hash))?.group).toBe(g0.id);
    expect(await page2.hasChunk('not-a-hash')).toBe(false);
  });

  it('a re-import sweeps the chunk of the group it replaced', async () => {
    const cache = idbChunkCache({ graceMs: 0 });
    const before = new Set(await idbKeys('chunks'));
    const r = await runImport(text('A', 'FAULT'), { file: 'A.json', name: 'A', cache, projects: memoryProjects() });
    expect(r.published!.layouts).toBe(1);                    // one changed group laid out again
    expect(r.published!.evicted.chunks).toBe(1);              // its old chunk is gone
    const after = new Set(await idbKeys('chunks'));
    expect(after.size).toBe(before.size);
    for (const g of r.published!.skeleton.groups) expect(after).toContain(g.hash);
  });

  it('keeps the most recently used projects and drops the rest with their chunks', async () => {
    let t = 1_000;
    const cache = idbChunkCache({ maxProjects: 2, graceMs: 0, now: () => t });
    await cache.evict();                                      // start from what the earlier tests left: A only
    await cache.putChunk(chunk('b1')); await cache.putChunk(chunk('shared'));
    t += 1; await cache.putSkeleton('B', skel('B', ['b1', 'shared']));
    t += 1; await cache.getSkeleton('A');                     // opening A makes it recent again
    await cache.putChunk(chunk('c1'));
    t += 1; const ev = await cache.putSkeleton('C', skel('C', ['c1', 'shared']));
    expect(ev.projects).toEqual(['B']);                       // B was least recently used
    const keys = await idbKeys('chunks');
    expect(keys).not.toContain('b1');
    expect(keys).toContain('shared');                         // still named by C
    expect(keys).toContain('c1');
    expect(await idbChunkCache().getSkeleton('B')).toBeUndefined();
    expect((await idbChunkCache().getSkeleton('A'))?.identity.name).toBe('A');
  });

  it('spares chunks this page wrote within the grace window', async () => {
    let t = 0;
    const cache = idbChunkCache({ maxProjects: 2, graceMs: 1_000, now: () => t });
    await cache.putChunk(chunk('in-flight'));                 // a publish still writing its chunks
    await cache.evict();
    expect(await idbKeys('chunks')).toContain('in-flight');
    t = 5_000;
    await cache.evict();
    expect(await idbKeys('chunks')).not.toContain('in-flight');
  });
});

describe('eviction plan and the memory cache follow the same rule', () => {
  it('planEviction keeps the newest N and the hashes they name', () => {
    const plan = planEviction([
      { project: 'old', used: 1, hashes: ['x', 's'] },
      { project: 'new', used: 3, hashes: ['y', 's'] },
      { project: 'mid', used: 2, hashes: ['z'] },
    ], 2);
    expect(plan.drop).toEqual(['old']);
    expect([...plan.live].sort()).toEqual(['s', 'y', 'z']);
  });

  it('memory cache evicts by project too', async () => {
    let t = 0;
    const m = memoryChunkCache({ maxProjects: 1, graceMs: 0, now: () => t });
    await m.putChunk(chunk('p')); t++; await m.putSkeleton('P', skel('P', ['p']));
    await m.putChunk(chunk('q')); t++;
    const ev = await m.putSkeleton('Q', skel('Q', ['q']));
    expect(ev).toEqual({ projects: ['P'], chunks: 1 });
    expect(await m.hasChunk('p')).toBe(false);
    expect(await m.getSkeleton('P')).toBeUndefined();
  });
});
