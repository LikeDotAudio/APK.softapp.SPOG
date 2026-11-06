// src/ui/console/discovered-meters — which discovered devices are METERS, from
// the BIM library (pure; discovered-bim fetches). Split from discovered-layer.

import type { DeviceSetup } from './discovered-types.js';

/* ─────────── meters ───────────
   Owner (2026-11-04): "I want to see all the meters as destinations." The engine
   knows a meter answered; the BIM library (DATABASE.server.BIM) knows it is a
   measuring instrument and which jacks it has. A device the library files under
   "Test & Measurement" is a METER, ahead of every other class (a meter with a
   running front panel is still a meter), and its destination's twists are the
   input terminals its part declares. Data, not a device list.

   ROAD-3516: the FAMILY says what it is first. Each INSTRUMENT.<Family> repo's
   thing.json names its roles (inputs / metering / monitoring / source), served on
   the instrument catalogue (discovered-families rolesOf). A family that takes
   inputs AND measures them (metering or monitoring) is a meter — a destination
   whose twists are its part's input jacks, opening the instrument editor on its
   readings and trace (editors/instrument). A source with no inputs is a source.
   Only a box whose family names no roles falls back to the BIM category. */

/** What the library says about one discovered device it knows (matchMeters):
 *  its jacks as the part declares them — what it takes IN, what it gives OUT —
 *  and the role those make it. A measuring part whose outputs are at least its
 *  inputs is a SOURCE (generators, supplies); otherwise it is a meter. Any other
 *  part is in / out / both by the jacks it has. */
export type BimRole = 'meter' | 'out' | 'both' | 'in';
export interface MeterInfo {
  label: string;
  part: string;
  symbol?: string;
  role: BimRole;
  /** Its family's thing.json roles, [] when the library names none. */
  roles: readonly string[];
  /** Its family in the instrument library (DMM, Oscilloscope …), '' when unknown. */
  family: string;
  /** Its bus prefix (`APK.audio/System/Protocols/visa/Device/<F>/<M>/Dev…`), from the panel it presents. */
  prefix?: string;
  inputs: { name: string; accepts: 'audio' | 'video' | 'both' }[];
  outputs: { name: string; domain: string }[];
}

/** One bench device as the BIM library reports it (/api/bim/instances). */
export interface BimInstance {
  key: string;
  state: string;
  serial?: string | null;
  resource?: string | null;
  panel?: { prefix?: string } | null;
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

/** What a family's roles make a box, or null when they name none (the BIM decides). */
export function roleFromThing(roles: readonly string[], inputs: number, outputs: number): BimRole | null {
  if (!roles.length) return null;
  const has = (r: string): boolean => roles.includes(r);
  if (has('inputs') && (has('metering') || has('monitoring'))) return 'meter';
  if (has('inputs')) return outputs ? 'both' : 'in';
  if (has('source')) return 'out';
  return inputs && outputs ? 'both' : outputs ? 'out' : 'in';
}

/** The instrument library's answers matchMeters reads (discovered-families). */
export interface Library {
  rolesOf(d: { model?: string }): readonly string[];
  typeOf(d: { model?: string }): string;
}
const NO_LIBRARY: Library = { rolesOf: () => [], typeOf: () => '' };

const expand = (p: { group?: string; terminal?: string; count?: number }): string[] => {
  const n = Math.max(1, Math.min(p.count ?? 1, 32));
  const name = p.group || p.terminal || '?';
  return Array.from({ length: n }, (_, k) => (n > 1 ? `${name} ${k + 1}` : name));
};

/** Every discovered device the BIM library knows, by device key — matched by
 *  address first, else by a serial only ONE bench unit carries (a 6612x module
 *  reports serial 0; four of them must not all be the first). One bench device
 *  is one entry: when two sightings match it, the VISA one keeps it.
 *  Inputs: input jacks, power excluded (mains is not a route). Outputs: every
 *  output jack — signal, clock AND power: a supply's DC OUT is what it gives. */
export function matchMeters(devices: DeviceSetup[], instances: BimInstance[], parts: BimPart[], lib: Library = NO_LIBRARY): Map<string, MeterInfo> {
  const byPart = new Map(parts.map((p) => [p.id, p] as const));
  const out = new Map<string, MeterInfo>();
  const claimed = new Set<string>();
  const serialCount = new Map<string, number>();
  instances.forEach((i) => { const s = String(i.serial ?? '').trim(); if (s) serialCount.set(s, (serialCount.get(s) ?? 0) + 1); });
  const visaFirst = [...devices].sort((a, b) => Number(!a.wires.includes('visa') || !a.key.startsWith('visa')) - Number(!b.wires.includes('visa') || !b.key.startsWith('visa')));
  for (const d of visaFirst) {
    const serial = (d.serial || '').trim();
    const open = instances.filter((i) => !!i.part?.id && !claimed.has(i.key));
    const inst = (d.address ? open.find((i) => !!i.resource && visaCore(i.resource) === visaCore(d.address)) : undefined)
      ?? (serial && serialCount.get(serial) === 1 ? open.find((i) => String(i.serial ?? '').trim() === serial) : undefined);
    if (!inst?.part?.id) continue;
    const inputs: MeterInfo['inputs'] = [];
    const outputs: MeterInfo['outputs'] = [];
    for (const p of byPart.get(inst.part.id)?.ports ?? []) {
      if (p.side === 'output') expand(p).forEach((name) => outputs.push({ name, domain: p.domain ?? 'signal' }));
      if (p.side !== 'input' || p.domain === 'power') continue;
      const accepts = p.domain === 'video' ? 'video' : (p.domain === 'audio' || p.domain === 'signal' ? 'audio' : 'both');
      expand(p).forEach((name) => inputs.push({ name, accepts }));
    }
    if (!inputs.length && !outputs.length) continue;
    const measuring = inst.part.category === MEASURING;
    const asPart = { model: inst.part.model };
    const roles = lib.rolesOf(d).length ? lib.rolesOf(d) : lib.rolesOf(asPart);
    const role: BimRole = roleFromThing(roles, inputs.length, outputs.length) ?? (measuring
      ? (outputs.length >= inputs.length ? 'out' : 'meter')
      : (inputs.length && outputs.length ? 'both' : outputs.length ? 'out' : 'in'));
    claimed.add(inst.key);
    const make = inst.part.manufacturer || d.make;
    out.set(d.key, {
      // no serial (four 34401As on four serial ports): the port tells them apart
      label: `${make} ${inst.part.model ?? d.model}${serial && serial !== '0' ? ` #${serial}` : d.address ? ` @ ${d.address}` : ''}`.trim(),
      part: inst.part.id,
      ...(inst.part.symbol ? { symbol: inst.part.symbol } : {}),
      ...(inst.panel?.prefix ? { prefix: inst.panel.prefix } : {}),
      role, roles, family: lib.typeOf(d) || lib.typeOf(asPart), inputs, outputs,
    });
  }
  return out;
}
