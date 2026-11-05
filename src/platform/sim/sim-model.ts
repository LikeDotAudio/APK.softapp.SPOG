// src/platform/sim/sim-model — the PURE half of the SPOG simulator: a Routes/**
// JSON file as a running device, and one tick of what that device would report.
// No DOM, no bus, no fetch, so it is testable; simulator.ts walks the tree and
// feeds the device receiver.
//
// WHAT A SIMULATED DEVICE IS. The same DeviceManifest a real box publishes at
// SPOG/devices/<id>/manifest (platform/device/types.ts), so every surface that
// draws a device — the Device editor's groups, faders, meters, toggles — draws
// these with no special case. Its three halves are the app's three halves:
//
//   INPUTS   what you control: per audio channel a GAIN fader and a MUTE, and
//            ONLINE (pull it and the box goes OFFLINE, as a real one would)
//   OUTPUTS  what it reports: per audio channel a LEVEL meter, per video feed
//            its FORMAT and TALLY, and the box's STATUS
//   (routing stays the console's own: a destination's twists are its inputs)
//
// A source that the file marks faulted (status other than OK) runs faulted:
// STATUS says so and its meters still move, because a faulted box still
// reports what it thinks it has (the ControlValue rule).

import type { DeviceIO, DeviceManifest } from '../device/types.js';

/** Most channels one simulated device carries; the rest are not simulated. */
export const MAX_CHANNELS = 64;
export const FLOOR_DB = -60;
export const SIM_PREFIX = 'sim-';
export const VIDEO_FORMAT = '1080p59.94';

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : []);
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** What a Routes file carries, as audio channels and video feeds. */
export interface Signals { audio: string[]; video: string[] }

/** Every shape Routes/Sources/** and Routes/Talent/** use today, read for signal. */
export function signalsOf(doc: Json): Signals {
  const audio: string[] = [];
  const video: string[] = [];
  const kind = typeof doc['kind'] === 'string' ? doc['kind'] : '';
  const prefix = typeof doc['prefix'] === 'string' ? doc['prefix'] : '';
  const count = typeof doc['count'] === 'number' ? doc['count'] : 0;
  // a stage box: prefix + count. Video boxes are cameras (video + 4 audio each, pools-video).
  if (count > 0) {
    const isVideo = kind === 'video' || /video/i.test(String(doc['extraClass'] ?? '')) || /^V/i.test(prefix);
    for (let i = 1; i <= count; i++) {
      const id = `${prefix}${String(i).padStart(2, '0')}`;
      if (isVideo) { video.push(id); for (let a = 1; a <= 4; a++) audio.push(`${id} A${a}`); }
      else audio.push(id);
    }
  }
  audio.push(...strs(doc['items']));
  if (Array.isArray(doc['video'])) video.push(...strs(doc['video']));
  else if (kind === 'video' && !count) video.push(String(doc['name'] ?? 'VIDEO'));
  for (const holder of [doc['outputs'], doc['source'], isObj(doc['kit']) ? (doc['kit'] as Json)['source'] : undefined]) {
    if (!isObj(holder)) continue;
    audio.push(...strs(holder['audio']));
    video.push(...strs(holder['video']));
  }
  for (const box of Array.isArray(doc['boxes']) ? doc['boxes'] : []) {
    if (!isObj(box)) continue;
    const name = String(box['name'] ?? '');
    audio.push(...strs(box['audio']).map((a) => (name ? `${name} ${a}` : a)));
    if (Array.isArray(box['video'])) video.push(...strs(box['video']).map((v) => (name ? `${name} ${v}` : v)));
    else if (box['video'] === true && name) video.push(name);
  }
  for (const player of Array.isArray(doc['players']) ? doc['players'] : []) {
    if (!isObj(player)) continue;
    const pname = String(player['name'] ?? 'PLAYER');
    for (const v of Array.isArray(player['videos']) ? player['videos'] : []) {
      if (!isObj(v) || !isObj(v['stack'])) continue;
      const stack = v['stack'] as Json;
      const vname = `${pname} ${String(v['name'] ?? '')}`.trim();
      if (typeof stack['video'] === 'string') video.push(vname);
      audio.push(...strs(stack['audio']).map((a) => `${vname} ${a}`));
    }
  }
  const uniq = (l: string[]) => [...new Set(l)].slice(0, MAX_CHANNELS);
  return { audio: uniq(audio), video: uniq(video) };
}

const io = (o: Partial<DeviceIO> & Pick<DeviceIO, 'id' | 'name' | 'type'>): DeviceIO => ({ writable: false, ...o });

/** The simulated device for one Routes file, or null for a file with nothing to run.
 *  `url` is where it was read from (its id when the file names none); `area` is
 *  Sources | Destinations | Talent. */
export function manifestFor(doc: unknown, url: string, area: string): DeviceManifest | null {
  if (!isObj(doc)) return null;
  const base = typeof doc['id'] === 'string' && doc['id'] ? doc['id'] : slug(url.replace(/^Routes\//, '').replace(/\.json$/i, ''));
  const name = String(doc['name'] ?? base);
  const status = typeof doc['status'] === 'string' && doc['status'] ? doc['status'] : 'OK';
  const inputs: DeviceIO[] = [io({ id: 'online', name: 'ONLINE', type: 'toggle', group: 'control', value: true, writable: true })];
  const outputs: DeviceIO[] = [io({ id: 'status', name: 'STATUS', type: 'indicator', group: 'status', value: status })];

  if (area === 'Destinations') {
    const twists = (Array.isArray(doc['twists']) ? doc['twists'] : []).filter(isObj).slice(0, MAX_CHANNELS);
    if (!twists.length) return null;
    twists.forEach((t, i) => {
      const tname = String(t['name'] ?? `INPUT ${i + 1}`);
      outputs.push(io({ id: `in_${i}`, name: `${tname} LEVEL`, type: 'meter', group: 'inputs', unit: 'dBFS', min: FLOOR_DB, max: 0, value: FLOOR_DB }));
      outputs.push(io({ id: `src_${i}`, name: `${tname} SOURCE`, type: 'readout', group: 'inputs', value: t['from'] ? JSON.stringify(t['from']) : '—' }));
    });
  } else {
    const { audio, video } = signalsOf(doc);
    if (!audio.length && !video.length) return null;
    audio.forEach((ch, i) => {
      inputs.push(io({ id: `gain_${i}`, name: `${ch} GAIN`, type: 'fader', group: 'audio', unit: 'dB', min: FLOOR_DB, max: 10, step: 0.5, value: 0, writable: true }));
      inputs.push(io({ id: `mute_${i}`, name: `${ch} MUTE`, type: 'toggle', group: 'audio', value: false, writable: true }));
      outputs.push(io({ id: `lvl_${i}`, name: `${ch} LEVEL`, type: 'meter', group: 'audio', unit: 'dBFS', min: FLOOR_DB, max: 0, value: FLOOR_DB }));
    });
    video.forEach((v, i) => {
      outputs.push(io({ id: `fmt_${i}`, name: `${v} FORMAT`, type: 'readout', group: 'video', value: VIDEO_FORMAT }));
      outputs.push(io({ id: `tally_${i}`, name: `${v} TALLY`, type: 'select', group: 'video', options: ['OFF', 'PVW', 'PGM'], value: 'OFF' }));
    });
  }

  return {
    id: SIM_PREFIX + base,
    name,
    category: `SIM · ${area.toUpperCase()}`,
    color: typeof doc['color'] === 'string' ? doc['color'] : undefined,
    groups: [
      { id: 'status', name: 'STATUS', order: 0, direction: 'out' },
      { id: 'control', name: 'CONTROL', order: 1, direction: 'in' },
      { id: 'audio', name: 'AUDIO', order: 2, direction: 'both' },
      { id: 'video', name: 'VIDEO', order: 3, direction: 'out' },
      { id: 'inputs', name: 'INPUTS', order: 4, direction: 'in' },
    ],
    inputs,
    outputs,
    types: { simulated: 'true', file: url },
    ts: Date.now(),
  };
}

/** A stable 0..1 per (device, channel), so each channel has its own character. */
function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

const valueOf = (m: DeviceManifest, id: string): unknown =>
  [...m.inputs, ...m.outputs].find((x) => x.id === id)?.value;

/**
 * One tick: the values this device reports at time `t` (ms), as [ioId, value].
 * Meters follow each channel's own programme-like level (a slow swell and a
 * faster flutter around a seeded base), offset by its GAIN, on the floor when
 * MUTED or when the box is not ONLINE. STATUS reads OFFLINE while ONLINE is off,
 * else what the file says. Values the operator sets are read back from the
 * manifest, where the receiver keeps them (publishDeviceValue).
 */
export function tick(m: DeviceManifest, t: number, fileStatus: string): Array<[string, unknown]> {
  const online = valueOf(m, 'online') !== false;
  const out: Array<[string, unknown]> = [['status', online ? fileStatus : 'OFFLINE']];
  for (const o of m.outputs) {
    if (o.type !== 'meter') continue;
    const idx = o.id.slice(o.id.indexOf('_') + 1);
    const muted = valueOf(m, `mute_${idx}`) === true;
    const gain = Number(valueOf(m, `gain_${idx}`) ?? 0) || 0;
    if (!online || muted) { out.push([o.id, FLOOR_DB]); continue; }
    const s = seed(`${m.id}/${o.id}`);
    const base = -30 + s * 18;                                    // -30 .. -12 dBFS
    const swell = 6 * Math.sin(t / (2200 + s * 3000) + s * 6.28);  // phrase-length rise and fall
    const flutter = 3 * Math.sin(t / (90 + s * 70) + s * 40);      // syllable-length movement
    const db = Math.max(FLOOR_DB, Math.min(0, base + swell + flutter + gain));
    out.push([o.id, Math.round(db * 10) / 10]);
  }
  return out;
}
