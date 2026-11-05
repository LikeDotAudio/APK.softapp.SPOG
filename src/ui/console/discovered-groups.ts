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
     006_Network and Control  no audio/video: <NNN>_<WIRE>/ per primary wire       */

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

/** The folder path (under 000_Discovered/) a device's files go in, raw names. */
export function groupPath(d: DeviceSetup, cls: DeviceClass, wireFolders: Map<string, string>): string[] {
  const top = CLASS_FOLDERS[cls];
  if (cls !== 'network') return [top];
  return [top, wireFolders.get(primaryWire(d)) ?? primaryWire(d).toUpperCase()];
}
