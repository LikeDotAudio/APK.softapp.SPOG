// src/ui/console/discovered-meters — which discovered devices are METERS, from
// the BIM library (pure; discovered-bim fetches). Split from discovered-layer.

import type { DeviceSetup } from './discovered-types.js';

/* ─────────── meters ───────────
   Owner (2026-11-04): "I want to see all the meters as destinations." The engine
   knows a meter answered; the BIM library (DATABASE.server.BIM) knows it is a
   measuring instrument and which jacks it has. A device the library files under
   "Test & Measurement" is a METER, ahead of every other class (a meter with a
   running front panel is still a meter), and its destination's twists are the
   input terminals its part declares. Data, not a device list. */

/** What the library says about one discovered meter (matchMeters). */
export interface MeterInfo {
  label: string;
  part: string;
  symbol?: string;
  inputs: { name: string; accepts: 'audio' | 'video' | 'both' }[];
}

/** One bench device as the BIM library reports it (/api/bim/instances). */
export interface BimInstance {
  key: string;
  state: string;
  serial?: string | null;
  resource?: string | null;
  part?: { id?: string; manufacturer?: string; model?: string; name?: string; category?: string; class?: string; symbol?: string };
}

/** A BIM part's ports (/api/bim/parts?full=1). */
export interface BimPart {
  id: string;
  ports?: { group?: string; terminal?: string; side?: string; domain?: string; count?: number }[];
}

export const BIM_INSTANCES_URL = '/api/bim/instances?state=online,graveyard';
export const BIM_PARTS_URL = '/api/bim/parts?full=1&limit=200&id=';
const MEASURING = 'Test & Measurement';

/** One spelling of a VISA resource: case-free, board 0 implied (TCPIP0:: is TCPIP::). */
export const visa = (r: string | null | undefined): string =>
  String(r ?? '').trim().toUpperCase().replace(/^(TCPIP|GPIB|ASRL|USB|VXI|PXI)0::/, '$1::');

/** The part of an address that names the port: no ASRL prefix, no ::INSTR —
 *  discovery writes a serial port as `/dev/ttyUSB0`, VISA as `ASRL/dev/ttyUSB0::INSTR`. */
export const visaCore = (r: string | null | undefined): string =>
  visa(r).replace(/^ASRL/, '').replace(/::INSTR$/, '');

/** Every discovered device the library calls a measuring instrument you can route
 *  INTO, by device key — matched by serial, else by address. One bench device is
 *  one meter: when two sightings match it, the VISA one keeps it. Inputs: the
 *  part's input terminals, power excluded; a group of N is N twists (at most 32).
 *  A measuring part with no input (a power module) is a source, not a meter. */
export function matchMeters(devices: DeviceSetup[], instances: BimInstance[], parts: BimPart[]): Map<string, MeterInfo> {
  const byPart = new Map(parts.map((p) => [p.id, p] as const));
  const out = new Map<string, MeterInfo>();
  const claimed = new Set<string>();
  const visaFirst = [...devices].sort((a, b) => Number(!a.wires.includes('visa') || !a.key.startsWith('visa')) - Number(!b.wires.includes('visa') || !b.key.startsWith('visa')));
  for (const d of visaFirst) {
    const serial = (d.serial || '').trim();
    const inst = instances.find((i) => i.part?.category === MEASURING && !claimed.has(i.key) && (
      (serial !== '' && String(i.serial ?? '') === serial) || (!!d.address && visaCore(i.resource) === visaCore(d.address))));
    if (!inst?.part?.id) continue;
    const inputs: MeterInfo['inputs'] = [];
    for (const p of byPart.get(inst.part.id)?.ports ?? []) {
      if (p.side !== 'input' || p.domain === 'power') continue;
      const accepts = p.domain === 'video' ? 'video' : (p.domain === 'audio' || p.domain === 'signal' ? 'audio' : 'both');
      const n = Math.max(1, Math.min(p.count ?? 1, 32));
      const name = p.group || p.terminal || 'IN';
      for (let k = 1; k <= n; k++) inputs.push({ name: n > 1 ? `${name} ${k}` : name, accepts });
    }
    if (!inputs.length) continue;
    claimed.add(inst.key);
    const make = inst.part.manufacturer || d.make;
    out.set(d.key, {
      // no serial (four 34401As on four serial ports): the port tells them apart
      label: `${make} ${inst.part.model ?? d.model}${serial ? ` #${serial}` : d.address ? ` @ ${d.address}` : ''}`.trim(),
      part: inst.part.id,
      ...(inst.part.symbol ? { symbol: inst.part.symbol } : {}),
      inputs,
    });
  }
  return out;
}
