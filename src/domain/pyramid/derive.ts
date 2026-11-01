// src/domain/pyramid/derive — L5 of the loading pyramid: reports computed from the
// full model (L4) only when one is asked for, and never cached. Pure.
import type { Topology } from '../../model/pyramid.js';

export interface BillOfMaterials {
  devices: { source: number; destination: number };
  byKind: Record<string, number>;
  ports: number;
  wires: number;
  /** Wires whose source is not in this project (routed from the live catalog). */
  dangling: number;
}

export function billOfMaterials(t: Topology): BillOfMaterials {
  const ids = new Set(t.devices.map((d) => d.id));
  const bom: BillOfMaterials = { devices: { source: 0, destination: 0 }, byKind: {}, ports: 0, wires: t.wires.length, dangling: 0 };
  for (const d of t.devices) {
    bom.devices[d.side]++;
    const k = d.kind ?? (d.side === 'destination' ? 'twist' : 'device');
    bom.byKind[k] = (bom.byKind[k] ?? 0) + 1;
    bom.ports += d.ports.length;
  }
  for (const w of t.wires) if (!ids.has(w.from.device) || !ids.has(w.to.device)) bom.dangling++;
  return bom;
}
