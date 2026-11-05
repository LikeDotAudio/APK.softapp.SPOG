// src/ui/console/discovered-layer — the PURE half of discovered.ts: the engine's
// device setup as the Routes/** files the console draws. No DOM, no bus, so it
// is testable; discovered.ts owns fetching, following and redrawing.

import { slugId } from '../sources/format.js';
import { PAL } from '../../domain/palette.js';

export interface DeviceIO {
  id: string;
  name: string;
  kind: string;            // 'audio' | 'video' | 'data'
  wire: string;            // 'dante' | 'aes67' | 'chromecast' | 'visa' | …
  channel?: number;
  format?: string | null;
  address?: string | null;
  port?: number | null;
  from?: { device: string; channel: string; status: string } | null;
}

export interface DeviceSetup {
  id: string;
  key: string;
  name: string;
  make: string;
  model: string;
  serial: string;
  mac: string | null;
  address: string;
  wires: string[];
  online: boolean;
  outputs: DeviceIO[];
  inputs: DeviceIO[];
  control: string | null;
}

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

/** Every discovered device the library calls a measuring instrument, by device
 *  key — matched by serial, else by VISA resource. Inputs: the part's input
 *  terminals, power excluded; a group of N is N twists (at most 32). */
export function matchMeters(devices: DeviceSetup[], instances: BimInstance[], parts: BimPart[]): Map<string, MeterInfo> {
  const byPart = new Map(parts.map((p) => [p.id, p] as const));
  const out = new Map<string, MeterInfo>();
  for (const d of devices) {
    const serial = (d.serial || '').trim();
    const inst = instances.find((i) => i.part?.category === MEASURING && (
      (serial !== '' && String(i.serial ?? '') === serial) || (!!d.address && visa(i.resource) === visa(d.address))));
    if (!inst?.part?.id) continue;
    const inputs: MeterInfo['inputs'] = [];
    for (const p of byPart.get(inst.part.id)?.ports ?? []) {
      if (p.side !== 'input' || p.domain === 'power') continue;
      const accepts = p.domain === 'video' ? 'video' : (p.domain === 'audio' || p.domain === 'signal' ? 'audio' : 'both');
      const n = Math.max(1, Math.min(p.count ?? 1, 32));
      const name = p.group || p.terminal || 'IN';
      for (let k = 1; k <= n; k++) inputs.push({ name: n > 1 ? `${name} ${k}` : name, accepts });
    }
    const make = inst.part.manufacturer || d.make;
    out.set(d.key, {
      label: `${make} ${inst.part.model ?? d.model}${serial ? ` #${serial}` : ''}`.trim(),
      part: inst.part.id,
      ...(inst.part.symbol ? { symbol: inst.part.symbol } : {}),
      inputs,
    });
  }
  return out;
}

export const SETUP_URL = '/discovery/api/setup';
export const SETUP_TOPIC = 'APK.audio/Discovery/_engine/setup/+';
export const FOLDER = '090_Discovered';
export const SRC_ROOT = 'Routes/Sources/index.json';
export const DEST_ROOT = 'Routes/Destinations/index.json';
export const SRC_DIR = `Routes/Sources/${FOLDER}/`;
export const DEST_DIR = `Routes/Destinations/${FOLDER}/`;


export const isSetup = (v: unknown): v is DeviceSetup =>
  !!v && typeof v === 'object' && typeof (v as DeviceSetup).key === 'string'
  && Array.isArray((v as DeviceSetup).outputs) && Array.isArray((v as DeviceSetup).inputs);

const withFolder = (root: string[], has: boolean): string[] => {
  const rest = root.filter((e) => e.replace(/\/$/, '') !== FOLDER);
  return has ? [...rest, `${FOLDER}/`] : rest;
};

/** The root manifests a layer is built on. */
export interface Roots { src: string[]; dest: string[] }

/** The roots the layer must be rebuilt on when the stored drafts change, or null
 *  when the layer built on `last` still holds. A drafted root wins (an import or an
 *  edit wrote it); without one the root is disk's — null in `disk` when disk was
 *  never read, so the caller must fetch (ROAD-3483: the layer used to keep the root
 *  it was first built on, hiding the folder a later workbook import registered). */
export function movedRoots(
  last: Roots,
  drafted: { src: string[] | null; dest: string[] | null },
  disk: { src: string[] | null; dest: string[] | null },
): Roots | 'fetch' | null {
  const src = Array.isArray(drafted.src) ? drafted.src : disk.src;
  const dest = Array.isArray(drafted.dest) ? drafted.dest : disk.dest;
  if (!src || !dest) return 'fetch';
  const same = (a: string[], b: string[]): boolean => a.length === b.length && a.every((e, i) => e === b[i]);
  return same(src, last.src) && same(dest, last.dest) ? null : { src, dest };
}

function streamChannels(format?: string | null, name?: string): string[] {
  if (format) {
    const m = format.match(/(\d+)\s*ch\b/i);
    if (m && m[1]) {
      const count = parseInt(m[1], 10);
      if (count > 0 && count <= 64) {
        return Array.from({ length: count }, (_, idx) => `CH ${idx + 1}`);
      }
    }
  }
  return [name || 'CH 1'];
}

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

/** The folder path (under 090_Discovered/) a device's files go in, raw names. */
export function groupPath(d: DeviceSetup, cls: DeviceClass, wireFolders: Map<string, string>): string[] {
  const top = CLASS_FOLDERS[cls];
  if (cls !== 'network') return [top];
  return [top, wireFolders.get(primaryWire(d)) ?? primaryWire(d).toUpperCase()];
}

/** A folder's URL segment, as listDirectory spells an index entry's href. */
const seg = (name: string): string => encodeURIComponent(name) + '/';

/** One folder being filled: its raw name, its files, its sub-folders. */
interface Folder { files: string[]; dirs: Map<string, Folder> }
const folder = (): Folder => ({ files: [], dirs: new Map() });

/** The live layer for a set of devices — pure, so it is testable. `srcRoot` /
 *  `destRoot` are the root manifests as they stand without this layer.
 *  `classOf` says which group a device goes in (discovered.ts asks the panel
 *  index); without it a device is grouped by its inputs and outputs alone. */
export function buildLayer(
  list: DeviceSetup[], srcRoot: string[], destRoot: string[],
  classOf: (d: DeviceSetup) => DeviceClass = (d) => classify(d, null),
  meters: Map<string, MeterInfo> = new Map(),
): Map<string, unknown> {
  const out = new Map<string, unknown>();
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || a.key.localeCompare(b.key));
  const classes = new Map(sorted.map((d) => [d.key, classOf(d)] as const));
  // <NNN>_<WIRE> under Network and Control, numbered in name order of the wires present.
  const wires = [...new Set(sorted.filter((d) => classes.get(d.key) === 'network').map(primaryWire))].sort();
  const wireFolders = new Map(wires.map((w, i) => [w, `${String(i + 1).padStart(3, '0')}_${w.toUpperCase()}`] as const));
  const srcTree = folder();
  const destTree = folder();
  const into = (tree: Folder, path: string[]): Folder => path.reduce((f, name) => {
    let sub = f.dirs.get(name);
    if (!sub) { sub = folder(); f.dirs.set(name, sub); }
    return sub;
  }, tree);
  sorted.forEach((d) => {
    const path = groupPath(d, classes.get(d.key)!, wireFolders);
    const srcDir = SRC_DIR + path.map(seg).join('');
    const destDir = DEST_DIR + path.map(seg).join('');
    const srcFiles = into(srcTree, path).files;
    const destFiles = into(destTree, path).files;
    const base = slugId(d.name) || d.key;
    const video = d.outputs.filter((o) => o.kind === 'video').map((o) => o.name);

    // Streams: each SAP and Ravenna / AES67 stream is a separate source
    const streamOutputs = d.outputs.filter((o) =>
      o.kind === 'audio' && (o.id.startsWith('stream:') || o.wire === 'aes67' || o.wire === 'ravenna' || o.wire === 'sap')
    );
    const nonStreamAudio = d.outputs.filter((o) =>
      o.kind === 'audio' && !o.id.startsWith('stream:') && o.wire !== 'aes67' && o.wire !== 'ravenna' && o.wire !== 'sap'
    ).map((o) => o.name);

    const common = { color: PAL.sky67, status: d.online ? 'OK' : 'OFFLINE', device: d };

    // 1. Non-stream audio (e.g. Dante channels Ch1..Ch16 on Metro16)
    if (nonStreamAudio.length) {
      const n = String(srcFiles.length + 1).padStart(3, '0');
      const f = `${n}_${base}${video.length ? '-a' : ''}.json`;
      out.set(srcDir + f, { id: `disc-${d.key}${video.length ? '-a' : ''}`, name: d.name, extraClass: 'audio-imported', items: nonStreamAudio, ...common });
      srcFiles.push(f);
    }

    // 2. Stream audio: each SAP and Ravenna stream is its own source leaf
    streamOutputs.forEach((s) => {
      const isRavenna = s.wire === 'ravenna' || (s.wire === 'aes67' && d.wires.includes('ravenna'));
      const isSap = s.wire === 'sap' || (s.wire === 'aes67' && d.wires.includes('sap'));
      const flavors: { tag: string; wire: string }[] = [];

      if (isRavenna && isSap) {
        flavors.push({ tag: 'RAVENNA', wire: 'ravenna' });
        flavors.push({ tag: 'SAP', wire: 'sap' });
      } else if (isSap) {
        flavors.push({ tag: 'SAP', wire: 'sap' });
      } else if (isRavenna) {
        flavors.push({ tag: 'RAVENNA', wire: 'ravenna' });
      } else {
        flavors.push({ tag: (s.wire || 'AES67').toUpperCase(), wire: s.wire || 'aes67' });
      }

      flavors.forEach(({ tag, wire }) => {
        const n = String(srcFiles.length + 1).padStart(3, '0');
        const streamSlug = slugId(`${s.name}-${tag}`);
        const f = `${n}_${base}_${streamSlug}.json`;
        const channels = streamChannels(s.format, s.name);
        const displayName = s.name.toUpperCase().includes(tag) ? s.name : `${s.name} (${tag})`;
        out.set(srcDir + f, {
          id: `disc-${d.key}-${streamSlug}`,
          name: displayName,
          extraClass: 'audio-imported audio-stream',
          items: channels,
          wire: wire,
          format: s.format ?? null,
          address: s.address ?? d.address,
          port: s.port ?? null,
          ...common
        });
        srcFiles.push(f);
      });
    });

    // 3. Video outputs
    if (video.length) {
      const n = String(srcFiles.length + 1).padStart(3, '0');
      const f = `${n}_${base}${nonStreamAudio.length ? '-v' : ''}.json`;
      out.set(srcDir + f, { id: `disc-${d.key}${nonStreamAudio.length ? '-v' : ''}`, name: d.name, kind: 'video', extraClass: 'video-imported', video, ...common });
      srcFiles.push(f);
    }

    const meter = classes.get(d.key) === 'meter' ? meters.get(d.key) : undefined;
    if (meter) {
      const mn = String(destFiles.length + 1).padStart(3, '0');
      const mf = `${mn}_${base}.json`;
      out.set(destDir + mf, {
        id: `disc-${d.key}`,
        name: meter.label.toUpperCase(),
        device: d,
        bim: meter.part,
        status: d.online ? 'OK' : 'OFFLINE',
        twists: meter.inputs.length ? meter.inputs.map((i) => ({ name: i.name, accepts: i.accepts })) : [{ name: 'Input', accepts: 'both' }],
      });
      destFiles.push(mf);
      return;
    }

    const twists = d.inputs
      .filter((i) => i.kind === 'audio' || i.kind === 'video')
      .map((i) => ({
        name: i.name, accepts: i.kind, ...(i.kind === 'video' ? { maxVideo: 1 } : {}), from: i.from ?? null,
        ...(i.wire ? { wire: i.wire } : {}), ...(i.format ? { format: i.format } : {}),
      }));
    const dn = String(destFiles.length + 1).padStart(3, '0');
    const df = `${dn}_${base}.json`;
    out.set(destDir + df, {
      id: `disc-${d.key}`,
      name: d.name.toUpperCase(),
      device: d,
      twists: twists.length ? twists : [{ name: 'Device', accepts: 'both' }],
    });
    destFiles.push(df);
  });
  // Every folder's index.json: its files, then its sub-folders (in name order,
  // which is the group order above). A folder with nothing in it is not laid.
  const lay = (dir: string, f: Folder): boolean => {
    const subs = [...f.dirs.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .filter(([name, sub]) => lay(dir + seg(name), sub)).map(([name]) => `${name}/`);
    const entries = [...f.files, ...subs];
    if (entries.length) out.set(dir + 'index.json', entries);
    return entries.length > 0;
  };
  const hasSrc = lay(SRC_DIR, srcTree);
  const hasDest = lay(DEST_DIR, destTree);
  out.set(SRC_ROOT, withFolder(srcRoot, hasSrc));
  out.set(DEST_ROOT, withFolder(destRoot, hasDest));
  return out;
}

