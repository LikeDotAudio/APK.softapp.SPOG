// src/platform/pyramid/loader — reading a project as a pyramid, top down, a level at
// a time (ROAD-3474; OneThing's "Import interpreter and the loading pyramid").
//
//   open()   L0 identity, then L1 skeleton — the boxes are drawable before any
//            device is fetched. L4 (the full model) starts loading IN PARALLEL.
//   view()   L2 devices for the groups in the viewport once a device would be
//            ≥ 14 px tall; L3 wires once ≥ 40 px, drawn only when BOTH ends'
//            devices have arrived. Chunks load asynchronously; nothing off-screen
//            is fetched.
//   edit()   refused until L4 is in memory: L0–L3 are a picture of the project and
//            nothing is ever saved from a half-loaded one ("read-only until L4").
//   derive() L5 reports, computed from L4 on demand, never cached.
import type { Box, Chunk, Identity, PlacedDevice, Skeleton, SkeletonGroup, Topology, TopoWire } from '../../model/pyramid.js';
import { detailAt, groupsInView } from '../../domain/pyramid/layout.js';
import { billOfMaterials, type BillOfMaterials } from '../../domain/pyramid/derive.js';
import type { ChunkCache } from './chunk-cache.js';

export interface PyramidSource {
  identity(): Promise<Identity>;
  skeleton(): Promise<Skeleton>;
  chunk(group: SkeletonGroup): Promise<Chunk>;
  full(): Promise<Topology>;
}

export class ReadOnlyError extends Error {
  constructor(what: string) { super(`${what} refused: the full model (L4) is not loaded yet — read-only until L4`); this.name = 'ReadOnlyError'; }
}

export interface Drawable { detail: 1 | 2 | 3; boxes: SkeletonGroup[]; devices: PlacedDevice[]; wires: TopoWire[] }

export class PyramidView {
  readonly chunks = new Map<string, Chunk>();
  private readonly pending = new Map<string, Promise<Chunk>>();
  private model: Topology | null = null;
  /** Resolves when L4 is in memory (editing allowed from then on). */
  readonly fullReady: Promise<Topology>;

  private constructor(private readonly src: PyramidSource, readonly identity: Identity, readonly skeleton: Skeleton) {
    this.fullReady = src.full().then((t) => (this.model = t));
    this.fullReady.catch(() => { /* stays read-only; the caller sees it on fullReady */ });
  }

  /** L0 then L1 — the only levels opening waits for. */
  static async open(src: PyramidSource): Promise<PyramidView> {
    const identity = await src.identity();
    const skeleton = await src.skeleton();
    return new PyramidView(src, identity, skeleton);
  }

  /** Ask for what this viewport needs; returns the groups requested and when they land. */
  view(viewport: Box, scale: number): { detail: 1 | 2 | 3; requested: string[]; ready: Promise<void> } {
    const detail = detailAt(scale);
    if (detail < 2) return { detail, requested: [], ready: Promise.resolve() };
    const requested: string[] = [];
    const waits: Array<Promise<Chunk>> = [];
    for (const g of groupsInView(this.skeleton.groups, viewport)) {
      if (this.chunks.has(g.id)) continue;
      let p = this.pending.get(g.id);
      if (!p) {
        p = this.src.chunk(g).then(
          (c) => { this.chunks.set(g.id, c); this.pending.delete(g.id); return c; },
          (e: unknown) => { this.pending.delete(g.id); throw e; },   // a later view() may retry
        );
        this.pending.set(g.id, p);
        requested.push(g.id);
      }
      waits.push(p);
    }
    return { detail, requested, ready: Promise.all(waits).then(() => undefined) };
  }

  /** What can be drawn for this viewport from what has arrived — never waits. */
  drawable(viewport: Box, scale: number): Drawable {
    const detail = detailAt(scale);
    const boxes = groupsInView(this.skeleton.groups, viewport);
    const devices: PlacedDevice[] = [];
    const wires: TopoWire[] = [];
    if (detail >= 2) for (const g of boxes) devices.push(...(this.chunks.get(g.id)?.devices ?? []));
    if (detail >= 3) {
      const loaded = new Set<string>();
      this.chunks.forEach((c) => c.devices.forEach((d) => loaded.add(d.id)));
      const seen = new Set<string>();
      for (const g of boxes) for (const w of this.chunks.get(g.id)?.wires ?? []) {
        if (seen.has(w.id) || !loaded.has(w.from.device) || !loaded.has(w.to.device)) continue;
        seen.add(w.id); wires.push(w);
      }
    }
    return { detail, boxes, devices, wires };
  }

  get canEdit(): boolean { return this.model != null; }

  /** Change the full model. Throws ReadOnlyError before L4. */
  edit(fn: (t: Topology) => void): void {
    if (!this.model) throw new ReadOnlyError('edit');
    fn(this.model);
  }

  /** L5: the bill of materials, from L4. Throws ReadOnlyError before L4. */
  derive(): BillOfMaterials {
    if (!this.model) throw new ReadOnlyError('a derived report');
    return billOfMaterials(this.model);
  }
}

/** A source reading a published project out of the chunk cache; L4 from the caller. */
export function cachedSource(project: string, cache: ChunkCache, full: () => Promise<Topology>): PyramidSource {
  let skel: Promise<Skeleton> | null = null;
  const skeleton = (): Promise<Skeleton> => (skel ??= cache.getSkeleton(project).then((s) => {
    if (!s) throw new Error(`no published skeleton for "${project}" — import it first`);
    return s;
  }));
  return {
    identity: async () => (await skeleton()).identity,
    skeleton,
    chunk: async (g) => {
      const c = await cache.getChunk(g.hash);
      if (!c) throw new Error(`chunk ${g.hash.slice(0, 12)}… for group "${g.id}" is not in the cache`);
      return c;
    },
    full,
  };
}
