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

/** The live layer for a set of devices — pure, so it is testable. `srcRoot` /
 *  `destRoot` are the root manifests as they stand without this layer. */
export function buildLayer(list: DeviceSetup[], srcRoot: string[], destRoot: string[]): Map<string, unknown> {
  const out = new Map<string, unknown>();
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || a.key.localeCompare(b.key));
  const srcFiles: string[] = [];
  const destFiles: string[] = [];
  sorted.forEach((d, i) => {
    const n = String(i + 1).padStart(3, '0');
    const base = slugId(d.name) || d.key;
    const audio = d.outputs.filter((o) => o.kind === 'audio').map((o) => o.name);
    const video = d.outputs.filter((o) => o.kind === 'video').map((o) => o.name);
    const common = { name: d.name, color: PAL.sky67, status: d.online ? 'OK' : 'OFFLINE', device: d };
    // Split media so the person heuristic (video[] AND items[] on one leaf)
    // never fires; both leaves share `name`, so they merge under one origin.
    if (audio.length) {
      const f = `${n}_${base}${video.length ? '-a' : ''}.json`;
      out.set(SRC_DIR + f, { id: `disc-${d.key}${video.length ? '-a' : ''}`, extraClass: 'audio-imported', items: audio, ...common });
      srcFiles.push(f);
    }
    if (video.length) {
      const f = `${n}_${base}${audio.length ? '-v' : ''}.json`;
      out.set(SRC_DIR + f, { id: `disc-${d.key}${audio.length ? '-v' : ''}`, kind: 'video', extraClass: 'video-imported', video, ...common });
      srcFiles.push(f);
    }
    const twists = d.inputs
      .filter((i) => i.kind === 'audio' || i.kind === 'video')
      .map((i) => ({
        name: i.name, accepts: i.kind, ...(i.kind === 'video' ? { maxVideo: 1 } : {}), from: i.from ?? null,
        ...(i.wire ? { wire: i.wire } : {}), ...(i.format ? { format: i.format } : {}),
      }));
    const f = `${n}_${base}.json`;
    out.set(DEST_DIR + f, {
      id: `disc-${d.key}`,
      name: d.name.toUpperCase(),
      device: d,
      twists: twists.length ? twists : [{ name: 'Device', accepts: 'both' }],
    });
    destFiles.push(f);
  });
  if (srcFiles.length) out.set(SRC_DIR + 'index.json', srcFiles);
  if (destFiles.length) out.set(DEST_DIR + 'index.json', destFiles);
  out.set(SRC_ROOT, withFolder(srcRoot, srcFiles.length > 0));
  out.set(DEST_ROOT, withFolder(destRoot, destFiles.length > 0));
  return out;
}

