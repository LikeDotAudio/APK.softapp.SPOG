// src/ui/console/discovered-layer — the PURE half of discovered.ts: the engine's
// device setup as the Routes/** files the console draws. No DOM, no bus, so it
// is testable; discovered.ts owns fetching, following and redrawing.

import { slugId } from '../sources/format.js';
import { PAL } from '../../domain/palette.js';
import { type DeviceSetup } from './discovered-types.js';
import { layStreams } from './discovered-streams.js';
import { classify, groupPath, networkPaths, type DeviceClass } from './discovered-groups.js';
import type { MeterInfo } from './discovered-meters.js';

export * from './discovered-types.js';
export * from './discovered-groups.js';
export * from './discovered-meters.js';

export const SETUP_URL = '/discovery/api/setup';
export const SETUP_TOPIC = 'APK.audio/Discovery/_engine/setup/+';
/* 000_: DISCOVERED is the first category in the sources rail — what is really
   on the network comes before what is only drawn (owner, 2026-11-05). */
export const FOLDER = '000_Discovered';
export const SRC_ROOT = 'Routes/Sources/index.json';
export const DEST_ROOT = 'Routes/Destinations/index.json';
export const SRC_DIR = `Routes/Sources/${FOLDER}/`;
export const DEST_DIR = `Routes/Destinations/${FOLDER}/`;


const withFolder = (root: string[], has: boolean): string[] => {
  const rest = root.filter((e) => e.replace(/\/$/, '') !== FOLDER);
  return has ? [`${FOLDER}/`, ...rest] : rest;
};

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
  // Network and Control: <Domain>/<WIRE>/<Make>/<Model>/ (discovered-groups networkPaths).
  const net = networkPaths(sorted.filter((d) => classes.get(d.key) === 'network'));
  const srcTree = folder();
  const destTree = folder();
  const into = (tree: Folder, path: string[]): Folder => path.reduce((f, name) => {
    let sub = f.dirs.get(name);
    if (!sub) { sub = folder(); f.dirs.set(name, sub); }
    return sub;
  }, tree);
  // The Meters group opens with a DATA LOGGER: route there, graph any meter (editors/data-logger).
  if (sorted.some((d) => classes.get(d.key) === 'meter' && meters.get(d.key)?.role === 'meter')) {
    const path = groupPath(sorted[0]!, 'meter', net);
    out.set(DEST_DIR + path.map(seg).join('') + '000_Data Logger.json', {
      id: 'disc-data-logger', name: 'DATA LOGGER',
      twists: [1, 2, 3, 4].map((n) => ({ name: `LOGGER ${n}`, accepts: 'both' })),
    });
    into(destTree, path).files.push('000_Data Logger.json');
  }
  sorted.forEach((d) => {
    const path = groupPath(d, classes.get(d.key)!, net);
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

    // 2. Stream audio: each SAP and Ravenna stream is its own source leaf (discovered-streams)
    layStreams(out, d, streamOutputs, srcDir, srcFiles, base, common);

    // 2b. The jacks the BIM library says it gives OUT — a generator's OUTPUT and
    //     SYNC, a supply's DC OUT ±, a router's coax outs: one source leaf.
    const bim = meters.get(d.key);
    if (bim?.outputs.length) {
      const n = String(srcFiles.length + 1).padStart(3, '0');
      const f = `${n}_${slugId(bim.label) || base}-bim.json`;
      out.set(srcDir + f, {
        id: `disc-${d.key}-bim`, name: bim.label.toUpperCase(), extraClass: 'audio-imported bim-output',
        items: bim.outputs.map((o) => o.name), domains: bim.outputs.map((o) => o.domain), bim: bim.part, ...common,
      });
      srcFiles.push(f);
    }

    // 3. Video outputs
    if (video.length) {
      const n = String(srcFiles.length + 1).padStart(3, '0');
      const f = `${n}_${base}${nonStreamAudio.length ? '-v' : ''}.json`;
      out.set(srcDir + f, { id: `disc-${d.key}${nonStreamAudio.length ? '-v' : ''}`, name: d.name, kind: 'video', extraClass: 'video-imported', video, ...common });
      srcFiles.push(f);
    }

    const meter = classes.get(d.key) === 'meter' && bim?.role === 'meter' ? bim : undefined;
    if (meter) {
      const mn = String(destFiles.length + 1).padStart(3, '0');
      // The footer tab is the file's name: name it by the meter's label, so four
      // 34401As read as four ports, not one model four times.
      const mf = `${mn}_${slugId(meter.label.replace(/^\S+\s+/, '')) || base}.json`;
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

    const twists: Array<Record<string, unknown>> = d.inputs
      .filter((i) => i.kind === 'audio' || i.kind === 'video')
      .map((i) => ({
        name: i.name, accepts: i.kind, ...(i.kind === 'video' ? { maxVideo: 1 } : {}), from: i.from ?? null,
        ...(i.wire ? { wire: i.wire } : {}), ...(i.format ? { format: i.format } : {}),
      }));
    // A unit in a shared model folder is named by its serial: the folder is the model.
    const unit = net.get(d.key)?.name;
    // A device the library knows takes what its part's input jacks take.
    if (!twists.length && bim) bim.inputs.forEach((i) => twists.push({ name: i.name, accepts: i.accepts }));
    const dn = String(destFiles.length + 1).padStart(3, '0');
    const df = `${dn}_${(unit && slugId(unit)) || base}.json`;
    out.set(destDir + df, {
      id: `disc-${d.key}`,
      name: unit ?? (bim ? bim.label.toUpperCase() : d.name.toUpperCase()),
      ...(bim ? { bim: bim.part } : {}),
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

