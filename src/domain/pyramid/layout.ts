// src/domain/pyramid/layout — stage 7 of the import pipeline and the geometry the
// pyramid is read by, pure. World units are px at zoom 1.
//
//   skeletonBoxes  every group's box from its device COUNT alone (cheap: no device
//                  is placed) — sources in the left field, destinations in the right.
//   layoutGroup    the per-group pass that places each device in its group's box —
//                  the work a chunk-cache hit skips.
//   detailAt       which pyramid level a zoom shows: devices at ≥ 14 px tall (L2),
//                  wires at ≥ 40 px (L3) — the doctrine's two thresholds.
//   groupsInView   the groups a viewport intersects — the only ones whose chunks load.
import type { Box, PlacedDevice, Side, SkeletonGroup, TopoDevice, TopoWire, Topology } from '../../model/pyramid.js';

export const DEVICE = { w: 120, h: 40, gap: 10, cols: 5, header: 24 } as const;
export const GROUPS_PER_ROW = 10;
export const DEVICE_PX_FOR_L2 = 14;
export const DEVICE_PX_FOR_L3 = 40;

export function groupSize(devices: number): { w: number; h: number } {
  const rows = Math.max(1, Math.ceil(devices / DEVICE.cols));
  return {
    w: DEVICE.cols * (DEVICE.w + DEVICE.gap) + DEVICE.gap,
    h: DEVICE.header + rows * (DEVICE.h + DEVICE.gap) + DEVICE.gap,
  };
}

/** Group id → its devices, in the topology's (normalised) order. */
export function devicesByGroup(t: Topology): Map<string, TopoDevice[]> {
  const m = new Map<string, TopoDevice[]>();
  for (const d of t.devices) {
    const arr = m.get(d.group);
    if (arr) arr.push(d); else m.set(d.group, [d]);
  }
  return m;
}

/** Group id → every wire with an end in it (a crossing wire is in both groups). */
export function wiresByGroup(t: Topology): Map<string, TopoWire[]> {
  const groupOf = new Map(t.devices.map((d) => [d.id, d.group]));
  const m = new Map<string, TopoWire[]>();
  const add = (g: string | undefined, w: TopoWire): void => {
    if (!g) return;
    const arr = m.get(g);
    if (arr) { if (arr[arr.length - 1] !== w) arr.push(w); } else m.set(g, [w]);
  };
  for (const w of t.wires) { add(groupOf.get(w.from.device), w); add(groupOf.get(w.to.device), w); }
  return m;
}

/** L1 boxes: a grid of groups per side, row by row, from counts only. */
export function skeletonBoxes(groups: Array<{ id: string; side: Side; devices: number }>): Map<string, Box> {
  const out = new Map<string, Box>();
  const field = GROUPS_PER_ROW * (groupSize(0).w + DEVICE.gap * 4);
  for (const side of ['source', 'destination'] as const) {
    const x0 = side === 'source' ? 0 : field + 400;
    let x = x0, y = 0, rowH = 0, col = 0;
    for (const g of groups.filter((gg) => gg.side === side)) {
      const s = groupSize(g.devices);
      if (col === GROUPS_PER_ROW) { col = 0; x = x0; y += rowH + DEVICE.gap * 4; rowH = 0; }
      out.set(g.id, { x, y, w: s.w, h: s.h });
      x += s.w + DEVICE.gap * 4; rowH = Math.max(rowH, s.h); col++;
    }
  }
  return out;
}

/** L2: place one group's devices inside its box (row-major, DEVICE.cols wide). */
export function layoutGroup(box: Box, devices: TopoDevice[]): PlacedDevice[] {
  return devices.map((d, i) => ({
    ...d,
    box: {
      x: box.x + DEVICE.gap + (i % DEVICE.cols) * (DEVICE.w + DEVICE.gap),
      y: box.y + DEVICE.header + DEVICE.gap + Math.floor(i / DEVICE.cols) * (DEVICE.h + DEVICE.gap),
      w: DEVICE.w, h: DEVICE.h,
    },
  }));
}

/** The canonical text a group's chunk is addressed by: its devices + wires + box. */
export const canonicalGroup = (id: string, box: Box, devices: TopoDevice[], wires: TopoWire[]): string =>
  JSON.stringify({ id, box, devices, wires });

/** The deepest level a zoom (px per world unit) shows: 1 = boxes, 2 = devices, 3 = wires. */
export function detailAt(scale: number): 1 | 2 | 3 {
  const px = DEVICE.h * scale;
  return px >= DEVICE_PX_FOR_L3 ? 3 : px >= DEVICE_PX_FOR_L2 ? 2 : 1;
}

const meets = (a: Box, b: Box): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const groupsInView = (groups: SkeletonGroup[], view: Box): SkeletonGroup[] => groups.filter((g) => meets(g.box, view));
