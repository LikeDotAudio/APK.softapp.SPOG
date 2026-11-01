// src/domain/pyramid/diff — stage 5½ of the import pipeline: the delta between the
// committed project and the incoming one, by device / wire id. It is what a Gate
// prompt shows ("+23 added · −4 removed · 3 of 41 groups touched") and what decides
// which groups' chunks must be re-derived. Pure.
import type { Topology, TopoDevice } from '../../model/pyramid.js';

export interface Delta {
  added: string[];
  removed: string[];
  changed: string[];
  wiresAdded: number;
  wiresRemoved: number;
  /** Groups with any device or wire-end difference — the chunks that change. */
  touchedGroups: string[];
}

const same = (a: TopoDevice, b: TopoDevice): boolean => JSON.stringify(a) === JSON.stringify(b);

export function diffTopology(prev: Topology | null, next: Topology): Delta {
  const before = new Map((prev?.devices ?? []).map((d) => [d.id, d]));
  const after = new Map(next.devices.map((d) => [d.id, d]));
  const groupOf = new Map<string, string>();
  before.forEach((d, id) => groupOf.set(id, d.group));
  after.forEach((d, id) => groupOf.set(id, d.group));
  const touched = new Set<string>();
  const delta: Delta = { added: [], removed: [], changed: [], wiresAdded: 0, wiresRemoved: 0, touchedGroups: [] };
  for (const [id, d] of after) {
    const old = before.get(id);
    if (!old) { delta.added.push(id); touched.add(d.group); }
    else if (!same(old, d)) { delta.changed.push(id); touched.add(d.group); touched.add(old.group); }
  }
  for (const [id, d] of before) if (!after.has(id)) { delta.removed.push(id); touched.add(d.group); }
  const wb = new Set((prev?.wires ?? []).map((w) => w.id));
  const wa = new Set(next.wires.map((w) => w.id));
  const touchWire = (from: string, to: string): void => {
    for (const end of [from, to]) { const g = groupOf.get(end); if (g) touched.add(g); }
  };
  for (const w of next.wires) if (!wb.has(w.id)) { delta.wiresAdded++; touchWire(w.from.device, w.to.device); }
  for (const w of prev?.wires ?? []) if (!wa.has(w.id)) { delta.wiresRemoved++; touchWire(w.from.device, w.to.device); }
  delta.touchedGroups = [...touched].sort();
  return delta;
}
