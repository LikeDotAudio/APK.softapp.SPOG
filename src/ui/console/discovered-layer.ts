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

/** The live layer for a set of devices — pure, so it is testable. `srcRoot` /
 *  `destRoot` are the root manifests as they stand without this layer. */
export function buildLayer(list: DeviceSetup[], srcRoot: string[], destRoot: string[]): Map<string, unknown> {
  const out = new Map<string, unknown>();
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || a.key.localeCompare(b.key));
  const srcFiles: string[] = [];
  const destFiles: string[] = [];
  sorted.forEach((d) => {
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
      out.set(SRC_DIR + f, { id: `disc-${d.key}${video.length ? '-a' : ''}`, name: d.name, extraClass: 'audio-imported', items: nonStreamAudio, ...common });
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
        out.set(SRC_DIR + f, {
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
      out.set(SRC_DIR + f, { id: `disc-${d.key}${nonStreamAudio.length ? '-v' : ''}`, name: d.name, kind: 'video', extraClass: 'video-imported', video, ...common });
      srcFiles.push(f);
    }

    const twists = d.inputs
      .filter((i) => i.kind === 'audio' || i.kind === 'video')
      .map((i) => ({
        name: i.name, accepts: i.kind, ...(i.kind === 'video' ? { maxVideo: 1 } : {}), from: i.from ?? null,
        ...(i.wire ? { wire: i.wire } : {}), ...(i.format ? { format: i.format } : {}),
      }));
    const dn = String(destFiles.length + 1).padStart(3, '0');
    const df = `${dn}_${base}.json`;
    out.set(DEST_DIR + df, {
      id: `disc-${d.key}`,
      name: d.name.toUpperCase(),
      device: d,
      twists: twists.length ? twists : [{ name: 'Device', accepts: 'both' }],
    });
    destFiles.push(df);
  });
  if (srcFiles.length) out.set(SRC_DIR + 'index.json', srcFiles);
  if (destFiles.length) out.set(DEST_DIR + 'index.json', destFiles);
  out.set(SRC_ROOT, withFolder(srcRoot, srcFiles.length > 0));
  out.set(DEST_ROOT, withFolder(destRoot, destFiles.length > 0));
  return out;
}

