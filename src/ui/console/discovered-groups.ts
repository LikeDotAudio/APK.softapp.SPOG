// src/ui/console/discovered-groups — the high-level groups a device is laid in
// (pure). Split from discovered-layer.

import type { DeviceIO, DeviceSetup } from './discovered-types.js';

/* ─────────── the high-level groups ───────────
   A flat list of every sighting (250 on the bench, most of them NIC / ping /
   NMOS mirrors) buries the few things an operator can actually drive. So the
   layer is laid in groups, in this order — what you can CONTROL first, then
   what carries signal IN and OUT, then everything else by the wire it was
   found on:

     001_Touch Panels         presents a panel that takes commands, with pages
     002_Displays             presents a panel with no command (shows, can't drive)
     003_Inputs and Outputs   audio/video both ways
     004_Outputs              audio/video out only (a source)
     005_Inputs               audio/video in only (a destination)
     006_Network and Control  no audio/video: <Domain>/<WIRE>/<Make>/<Model>/ below */

export type DeviceClass = 'meter' | 'touch' | 'display' | 'both' | 'out' | 'in' | 'network';

export const CLASS_FOLDERS: Record<DeviceClass, string> = {
  meter: '000_Meters',
  touch: '001_Touch Panels',
  display: '002_Displays',
  both: '003_Inputs and Outputs',
  out: '004_Outputs',
  in: '005_Inputs',
  network: '006_Network and Control',
};

/** What a device's panel says about it (discovered-gui-match PanelRef). */
export interface PanelFacts { command?: boolean; pages?: number }

/** The sightings every networked box has (an address, a ping, an mDNS name):
 *  wire names from the contract's vocabulary, not a device list. */
export const GENERIC_WIRES: readonly string[] = ['nic', 'ping', 'mdns'];

/** The wire that says most about a device — the first that is not generic. */
export function primaryWire(d: Pick<DeviceSetup, 'wires'>): string {
  const specific = d.wires.find((w) => !GENERIC_WIRES.includes(w));
  return (specific ?? d.wires[0] ?? 'device').toLowerCase();
}

const isMedia = (io: DeviceIO): boolean => io.kind === 'audio' || io.kind === 'video';

/** Which group a device is presented in. */
export function classify(d: DeviceSetup, panel: PanelFacts | null): DeviceClass {
  if (panel) return panel.command && (panel.pages ?? 0) > 0 ? 'touch' : 'display';
  const mediaIn = d.inputs.some(isMedia);
  const mediaOut = d.outputs.some(isMedia);
  if (mediaIn && mediaOut) return 'both';
  if (mediaOut) return 'out';
  if (mediaIn) return 'in';
  return 'network';
}

/* ─────────── Network and Control, by domain ───────────
   A flat run of wires (AVB, MDNS, … VISA, WIRELESS_WWB) reads as one long
   menu. Each wire is laid one level down, under the domain it serves, and the
   devices on it spill further by make, then model:

     006_Network and Control/<NNN>_<Domain>/<NNN>_<WIRE>/<Make>/<Model>/

   The domains are wire VOCABULARY (as GENERIC_WIRES is), not a device list:
   a wire nobody named here falls to Network. A prefix ending in '_' matches
   the family (wireless_csv, wireless_wwb, trunk_sim …). */
export const WIRE_DOMAINS: ReadonlyArray<{ folder: string; wires: readonly string[] }> = [
  { folder: '001_Audio', wires: ['avb', 'milan', 'aes67', 'aes70', 'dante', 'ravenna', 'sap', 'ptp', 'nmos', 'nmos_control', 'midi', 'osc', 'ember', 'soundcard_in', 'soundcard_out', 'wireless_'] },
  { folder: '002_Intercom', wires: ['trunk_'] },
  { folder: '003_Routers', wires: ['snmp', 'netgear', 'trendnet', 'wifi', 'netbox'] },
  { folder: '004_Testing', wires: ['visa', 'serial_com', 'serial', 'usbtmc', 'scpi'] },
];
export const OTHER_DOMAIN = '005_Network';

/** The domain folder a wire is laid under. */
export function domainOf(wire: string): string {
  const w = wire.toLowerCase();
  const hit = WIRE_DOMAINS.find((d) => d.wires.some((x) => (x.endsWith('_') ? w.startsWith(x) : w === x)));
  return hit?.folder ?? OTHER_DOMAIN;
}

const clean = (s: string | null | undefined): string => (s ?? '').replace(/[\\/]/g, '-').trim();

/** Where each Network-and-Control device goes below the class folder, and the
 *  name its tab carries: domain → wire → make → model. A make level is laid
 *  only when the device says its make; a model level only when two or more
 *  units share it — and then each unit is named by serial (else address), as
 *  the model is already the folder.
 *
 *  A device whose TYPE is known (`typeOf` — an instrument's family from the
 *  instrument library: DMM, Generator, Oscilloscope …) is laid by what it IS
 *  first: domain → wire → TYPE → MODEL → MAKE, each unit named by serial
 *  (else address). Owner, 2026-11-05: "the visa should present by group type
 *  not by manufacturer … type then model then manufacturer".
 *  Pure, so it is testable. */
export function networkPaths(
  list: DeviceSetup[], typeOf: (d: DeviceSetup) => string = () => '',
): Map<string, { path: string[]; name?: string }> {
  const out = new Map<string, { path: string[]; name?: string }>();
  const byDomain = new Map<string, DeviceSetup[]>();
  list.forEach((d) => {
    const dom = domainOf(primaryWire(d));
    byDomain.set(dom, [...(byDomain.get(dom) ?? []), d]);
  });
  byDomain.forEach((devs, dom) => {
    const wires = [...new Set(devs.map(primaryWire))].sort();
    const wireFolder = new Map(wires.map((w, i) => [w, `${String(i + 1).padStart(3, '0')}_${w.toUpperCase()}`] as const));
    const modelKey = (d: DeviceSetup): string => `${primaryWire(d)}|${clean(d.make).toLowerCase()}|${clean(d.model).toLowerCase()}`;
    const units = new Map<string, number>();
    devs.forEach((d) => { if (clean(d.model)) units.set(modelKey(d), (units.get(modelKey(d)) ?? 0) + 1); });
    devs.forEach((d) => {
      const path = [dom, wireFolder.get(primaryWire(d))!];
      const type = clean(typeOf(d));
      if (type) {
        path.push(type.toUpperCase());
        if (clean(d.model)) path.push(clean(d.model).toUpperCase());
        if (clean(d.make)) path.push(clean(d.make).toUpperCase());
        const unit = clean(d.serial) || clean(d.address);
        out.set(d.key, unit ? { path, name: unit.toUpperCase() } : { path });
        return;
      }
      if (clean(d.make)) path.push(clean(d.make).toUpperCase());
      const shared = (units.get(modelKey(d)) ?? 0) > 1;
      if (shared) path.push(clean(d.model).toUpperCase());
      const unit = clean(d.serial) || clean(d.address);
      out.set(d.key, shared && unit ? { path, name: unit.toUpperCase() } : { path });
    });
  });
  return out;
}

/** The folder path (under 000_Discovered/) a device's files go in, raw names. */
export function groupPath(d: DeviceSetup, cls: DeviceClass, net: Map<string, { path: string[] }>): string[] {
  const top = CLASS_FOLDERS[cls];
  if (cls !== 'network') return [top];
  return [top, ...(net.get(d.key)?.path ?? [OTHER_DOMAIN, primaryWire(d).toUpperCase()])];
}
