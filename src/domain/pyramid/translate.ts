// src/domain/pyramid/translate — stage 3 of the import pipeline for SPOG's own
// formats: the flat two-tab Sheet model (what the 1990s view's JSON and CSV both
// flatten to) → the ONE project shape, `Topology`. A source Origin is a device in the
// group named by its parent path ("STUDIO 01 — WALL 03"); a destination twist is a
// device in its Category — Room; every routed feed is a wire. Pure.
import type { Topology, TopoDevice, TopoWire } from '../../model/pyramid.js';
import { columnMap, type Sheet } from '../router-doc/sheet.js';

const SEP = ' — ';
const parentOf = (path: string): string => {
  const i = path.lastIndexOf(SEP);
  return i >= 0 ? path.slice(0, i) : '(top)';
};
export const sourceId = (origin: string): string => 'src:' + origin;
export const twistId = (category: string, room: string, twist: string): string => `dst:${category}${SEP}${room}${SEP}${twist}`;

export interface Translated { topology: Topology; notes: string[] }

export function sheetsToTopology(name: string, sources: Sheet | null, destinations: Sheet | null): Translated {
  const notes: string[] = [];
  const devices = new Map<string, TopoDevice>();
  if (sources) {
    const col = columnMap(sources);
    for (const r of sources.rows) {
      const origin = col(r, 'Origin').trim(), feed = col(r, 'Feed').trim();
      if (!origin || !feed) continue;
      const id = sourceId(origin);
      let d = devices.get(id);
      if (!d) {
        d = { id, name: origin.slice(origin.lastIndexOf(SEP) + (origin.includes(SEP) ? SEP.length : 0)), group: 'src:' + parentOf(origin), side: 'source', ports: [] };
        const kind = col(r, 'Type').trim(), color = col(r, 'Color').trim(), status = col(r, 'Status').trim();
        if (kind) d.kind = kind;
        if (color) d.color = color;
        if (status) d.status = status;
        devices.set(id, d);
      }
      d.ports.push(feed);
    }
  }
  const wires: TopoWire[] = [];
  if (destinations) {
    const col = columnMap(destinations);
    for (const r of destinations.rows) {
      const cat = col(r, 'Category').trim() || '—', room = col(r, 'Room').trim(), twist = col(r, 'Twist').trim();
      if (!room || !twist) continue;
      const id = twistId(cat, room, twist);
      let d = devices.get(id);
      if (!d) {
        d = { id, name: twist, group: `dst:${cat}${SEP}${room}`, side: 'destination', ports: [] };
        const accepts = col(r, 'Accepts').trim(), row = col(r, 'Row').trim();
        if (accepts) d.accepts = accepts;
        if (row) d.row = row;
        devices.set(id, d);
      }
      const feed = col(r, 'Routed Feed').trim();
      if (!feed) continue;
      const origin = col(r, 'Routed Origin').trim();
      d.ports.push(feed);
      const type = col(r, 'Type').trim();
      const w: TopoWire = { id: `${sourceId(origin)}|${feed}>${id}`, from: { device: sourceId(origin), port: feed }, to: { device: id, port: feed } };
      if (type) w.type = type;
      wires.push(w);
    }
  }
  const outside = wires.filter((w) => !devices.has(w.from.device)).length;
  if (outside) notes.push(`${outside} wire(s) start at a source not in this file — they are drawn only if that source is loaded`);
  return { topology: { schema: 'spog.topology/1', name, devices: [...devices.values()], wires }, notes };
}
