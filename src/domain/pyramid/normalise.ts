// src/domain/pyramid/normalise — stages 4 and 5 of the import pipeline, pure.
//   gate       refuse, don't degrade: an empty project, a device id twice, a wire
//              with no end, a device with no group. Returns the reason or null.
//   normalise  the same rewrites for every import, each one said out loud in
//              `notes`: names trimmed, duplicate ports and wires dropped, devices
//              and wires in one canonical order (so the same input always gives
//              the same chunks and the same hashes).
import type { Topology, TopoDevice, TopoWire } from '../../model/pyramid.js';

export function gate(t: Topology): string | null {
  if (!t.devices.length) return 'the file holds no devices — nothing to import';
  const seen = new Set<string>();
  for (const d of t.devices) {
    if (!d.id) return `a device has no id (named "${d.name}")`;
    if (!d.group) return `device "${d.id}" has no group`;
    if (seen.has(d.id)) return `device id "${d.id}" appears twice`;
    seen.add(d.id);
  }
  for (const w of t.wires) if (!w.from?.device || !w.to?.device) return `wire "${w.id}" is missing an end`;
  return null;
}

const byId = <T extends { id: string }>(a: T, b: T): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function normalise(t: Topology): { topology: Topology; notes: string[] } {
  const notes: string[] = [];
  let trimmed = 0, dupPorts = 0;
  const devices: TopoDevice[] = t.devices.map((d) => {
    const name = d.name.trim();
    if (name !== d.name) trimmed++;
    const ports = [...new Set(d.ports.map((p) => p.trim()))];
    dupPorts += d.ports.length - ports.length;
    return { ...d, name, ports };
  });
  devices.sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : byId(a, b)));
  const wireIds = new Set<string>();
  const wires: TopoWire[] = [];
  for (const w of t.wires) {
    if (wireIds.has(w.id)) continue;
    wireIds.add(w.id);
    wires.push(w);
  }
  wires.sort(byId);
  if (trimmed) notes.push(`trimmed whitespace from ${trimmed} device name(s)`);
  if (dupPorts) notes.push(`dropped ${dupPorts} duplicate port(s)`);
  if (t.wires.length !== wires.length) notes.push(`dropped ${t.wires.length - wires.length} duplicate wire(s)`);
  return { topology: { ...t, devices, wires }, notes };
}
