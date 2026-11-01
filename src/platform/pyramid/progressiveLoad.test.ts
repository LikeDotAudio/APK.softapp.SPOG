// ROAD-3474 proof — an arena-scale facility (5,000 devices, 20,000 connections, in
// SPOG's own spog.router/1 import shape) goes through the one import pipeline and is
// read back as a pyramid: L1 skeleton within 50 ms, L2/L3 chunks loading
// asynchronously only for the groups in view, editing refused until L4, and a re-import
// of unchanged groups served from the content-addressed chunk cache with no re-layout.
import { describe, it, expect, beforeAll } from 'vitest';
import type { Box, Topology } from '../../model/pyramid.js';
import { arenaDoc, arenaText } from '../../domain/pyramid/arena-fixture.js';
import { runImport, ImportError, type ImportResult } from '../import/pipeline.js';
import { memoryProjects } from '../import/projects.js';
import { memoryChunkCache, openChunkCache } from './chunk-cache.js';
import { PyramidView, ReadOnlyError, cachedSource } from './loader.js';

const cache = memoryChunkCache();
const projects = memoryProjects();
let first: ImportResult;
let releaseFull: (t: Topology) => void = () => {};

/** L4 that arrives only when the test says so — the real one is MBs over the wire. */
const lateFull = (): Promise<Topology> => new Promise((r) => { releaseFull = r; });

beforeAll(async () => {
  first = await runImport(arenaText(), { file: 'ARENA.json', cache, projects });
  console.log('[ROAD-3474] first import ms', JSON.stringify(first.ms), 'layouts', first.published?.layouts);
});

describe('import pipeline (sniff → parse → gate → normalise → diff → commit → layout → publish)', () => {
  it('interprets the arena fixture into one Topology and publishes one chunk per group', () => {
    expect(first.format).toBe('spog.router/1');
    expect(first.where).toBe('inline');               // node has no Worker; the browser uses one
    expect(first.topology.devices).toHaveLength(5000);
    expect(first.topology.wires).toHaveLength(20000);
    expect(first.version).toBe(1);
    expect(first.published!.skeleton.groups).toHaveLength(200);
    expect(first.published!.layouts).toBe(200);
  });

  it('refuses by stage, naming the file', async () => {
    await expect(runImport('hello, world', { file: 'x.txt' })).rejects.toMatchObject({ stage: 'sniff', file: 'x.txt' });
    const empty = JSON.stringify({ schema: 'spog.router/1', sources: [], destinations: [] });
    const err = await runImport(empty, { file: 'empty.json' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ImportError);
    expect((err as ImportError).stage).toBe('gate');
  });
});

describe('loading pyramid (L0 → L1 → L2/L3 on view → L4 → L5)', () => {
  let view: PyramidView;
  let openMs = 0;

  beforeAll(async () => {
    const t0 = performance.now();
    view = await PyramidView.open(cachedSource('ARENA', cache, lateFull));
    openMs = performance.now() - t0;
    console.log(`[ROAD-3474] L0+L1 open ${openMs.toFixed(2)} ms`);
  });

  it('draws the L1 skeleton of the 5,000-node fixture within 50 ms, before any device', () => {
    expect(openMs).toBeLessThan(50);
    expect(view.identity).toMatchObject({ name: 'ARENA', devices: 5000, wires: 20000, groups: 200 });
    expect(view.skeleton.groups).toHaveLength(200);
    expect(view.chunks.size).toBe(0);
  });

  // The first row of groups on both sides: 10 source walls + 10 destination rooms.
  const firstRow: Box = { x: 0, y: 0, w: 1e6, h: 100 };

  it('fetches nothing while a device would be under 14 px', () => {
    const r = view.view(firstRow, 0.25);              // 40 × 0.25 = 10 px
    expect(r.detail).toBe(1);
    expect(r.requested).toEqual([]);
  });

  it('streams L2 chunks asynchronously, only for the groups in view', async () => {
    const r = view.view(firstRow, 0.5);               // 20 px → devices
    expect(r.detail).toBe(2);
    expect(r.requested).toHaveLength(20);
    expect(view.chunks.size).toBe(0);                 // nothing arrived synchronously
    await r.ready;
    expect(view.chunks.size).toBe(20);
    const d = view.drawable(firstRow, 0.5);
    expect(d.devices).toHaveLength(20 * 25);
    expect(d.wires).toHaveLength(0);                  // wires wait for ≥ 40 px
  });

  it('draws L3 wires at ≥ 40 px, and only those with both ends loaded', async () => {
    await view.view(firstRow, 1).ready;
    const d = view.drawable(firstRow, 1);
    expect(d.detail).toBe(3);
    const loaded = new Set(d.devices.map((x) => x.id));
    expect(d.wires.length).toBeGreaterThan(0);
    expect(d.wires.length).toBeLessThan(20000);
    expect(d.wires.every((w) => loaded.has(w.from.device) && loaded.has(w.to.device))).toBe(true);
  });

  it('refuses edits and L5 reports until L4, then allows them', async () => {
    expect(view.canEdit).toBe(false);
    expect(() => view.edit(() => {})).toThrow(ReadOnlyError);
    expect(() => view.derive()).toThrow(ReadOnlyError);
    releaseFull(first.topology);
    await view.fullReady;
    expect(view.canEdit).toBe(true);
    expect(() => view.edit((t) => { t.name = 'ARENA'; })).not.toThrow();
    expect(view.derive().devices).toEqual({ source: 2500, destination: 2500 });
  });
});

describe('content-addressed chunk cache', () => {
  it('re-importing unchanged groups is a cache hit with no re-layout', async () => {
    const again = await runImport(arenaText(), { file: 'ARENA.json', cache, projects });
    expect(again.version).toBe(2);
    expect(again.delta.touchedGroups).toEqual([]);
    expect(again.published).toMatchObject({ layouts: 0, hits: 200 });
    console.log('[ROAD-3474] cached re-import ms', JSON.stringify(again.ms));
  });

  it('one changed device re-lays out one group; the other 199 are hits', async () => {
    const doc = arenaDoc();
    doc.sources[0]!.children![0]!.children![0]!.status = 'FAULT';
    const r = await runImport(JSON.stringify(doc), { file: 'ARENA.json', cache, projects });
    expect(r.delta.changed).toHaveLength(1);
    expect(r.delta.touchedGroups).toHaveLength(1);
    expect(r.published).toMatchObject({ layouts: 1, hits: 199 });
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    expect((await openChunkCache()).kind).toBe('memory');   // node: no indexedDB
  });
});
