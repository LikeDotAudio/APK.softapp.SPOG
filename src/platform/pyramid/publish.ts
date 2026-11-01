// src/platform/pyramid/publish — stages 7 and 8 of the import pipeline: derive the
// layout chunks once, over the full model the import already holds, and publish them
// top down — one L1 skeleton for the project plus one L2/L3 chunk per group — so the
// FIRST open of an imported project is already progressive.
//
// A group's chunk is addressed by SHA-256 of its canonical JSON. When the cache
// already holds that address the group is not laid out again (a clean group costs a
// hash, not a layout). The work yields to the event loop every few groups so a big
// import never holds the main thread for one long task.
import type { Skeleton, SkeletonGroup, Topology } from '../../model/pyramid.js';
import { canonicalGroup, devicesByGroup, layoutGroup, skeletonBoxes, wiresByGroup } from '../../domain/pyramid/layout.js';
import type { ChunkCache, Evicted } from './chunk-cache.js';
import { sha256Hex } from './hash.js';

export interface Published {
  skeleton: Skeleton;
  /** Groups laid out by this publish (cache misses). */
  layouts: number;
  /** Groups whose chunk was already in the cache under the same hash. */
  hits: number;
  /** What the cache's bound dropped when this skeleton landed (ROAD-3481). */
  evicted: Evicted;
}

const YIELD_EVERY = 16;
const yieldToLoop = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export async function deriveAndPublish(t: Topology, version: number, cache: ChunkCache): Promise<Published> {
  const byGroup = devicesByGroup(t);
  const wires = wiresByGroup(t);
  const list = [...byGroup].map(([id, devs]) => ({ id, side: devs[0]!.side, devices: devs.length }));
  const boxes = skeletonBoxes(list);
  const groups: SkeletonGroup[] = [];
  let layouts = 0, hits = 0, i = 0;
  for (const g of list) {
    const box = boxes.get(g.id)!;
    const devs = byGroup.get(g.id)!;
    const gw = wires.get(g.id) ?? [];
    const hash = await sha256Hex(canonicalGroup(g.id, box, devs, gw));
    if (await cache.hasChunk(hash)) hits++;
    else {
      await cache.putChunk({ group: g.id, hash, devices: layoutGroup(box, devs), wires: gw });
      layouts++;
    }
    groups.push({ id: g.id, side: g.side, box, devices: g.devices, hash });
    if (++i % YIELD_EVERY === 0) await yieldToLoop();
  }
  const skeleton: Skeleton = {
    identity: { name: t.name, version, devices: t.devices.length, wires: t.wires.length, groups: groups.length },
    groups,
  };
  const evicted = await cache.putSkeleton(t.name, skeleton);
  return { skeleton, layouts, hits, evicted };
}
