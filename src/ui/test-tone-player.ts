// src/ui/test-tone-player — voice the routed source's line-up tone (Web Audio).
//
// ONE shared listen bus for the whole page: a 1 kHz sine split into L/R gains,
// with the left leg's ident dropouts scheduled one cycle ahead from the pure
// src/domain/test-tone gaps. Only one monitor is audible at a time — starting a
// listen on another monitor takes the bus over. Opt-in behind `?tone=1` (search or
// hash query) since it puts a LISTEN button on every MONITOR fixture.
//
// Fail-soft by design: no AudioContext, a blocked autoplay or any node error just
// makes listen() return false — the picture keeps running, nothing throws.

import { dbToGain, identGaps, type ToneSpec } from '../domain/test-tone/index.js';

/** `?tone=1` in the page query or the hash query turns the LISTEN buttons on. */
export function toneEnabled(): boolean {
  try {
    const h = location.hash;
    const hq = new URLSearchParams(h.indexOf('?') >= 0 ? h.slice(h.indexOf('?') + 1) : '');
    return [new URLSearchParams(location.search).get('tone'), hq.get('tone')].some((v) => v === '1' || v === 'on');
  } catch { return false; }
}

interface Voice { stop(): void }
let ac: AudioContext | null = null;
let voice: Voice | null = null;
let owner: Node | null = null;
let current: string | null = null;

function context(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ac ??= new Ctor();
    if (ac.state === 'suspended') void ac.resume().catch(() => undefined);
    return ac;
  } catch { return null; }
}

function start(a: AudioContext, spec: ToneSpec, who: Node): Voice {
  const osc = a.createOscillator();
  const gl = a.createGain(), gr = a.createGain();
  const merge = a.createChannelMerger(2);
  const lvl = spec.silent ? 0 : dbToGain(spec.levelDbfs);
  osc.frequency.value = spec.freqHz;
  gl.gain.value = lvl; gr.gain.value = lvl;
  osc.connect(gl); osc.connect(gr);
  gl.connect(merge, 0, 0); gr.connect(merge, 0, 1);
  merge.connect(a.destination);
  const t0 = a.currentTime + 0.05;
  osc.start(t0);
  // Schedule the left-leg ident one cycle ahead; the same timer stops the voice
  // once its monitor has left the page (the fixture loop dies silently).
  let n = 0;
  const schedule = (): void => {
    if (!who.isConnected) { stopTone(); return; }
    if (spec.silent) return;
    const base = t0 + (n++ * spec.cycleMs) / 1000;
    for (const [s, e] of identGaps(spec)) {
      gl.gain.setValueAtTime(0, base + s / 1000);
      gl.gain.setValueAtTime(lvl, base + e / 1000);
    }
  };
  schedule(); schedule();
  const timer = window.setInterval(schedule, spec.cycleMs);
  return {
    stop(): void {
      window.clearInterval(timer);
      try { osc.stop(); osc.disconnect(); merge.disconnect(); } catch { /* already stopped */ }
    },
  };
}

/** Voice `spec` for monitor `who` (replacing whatever was playing). Returns false
 *  when audio is unavailable — callers keep going and just show it as muted. */
export function listenTone(spec: ToneSpec, who: Node): boolean {
  stopTone();
  const a = context();
  if (!a) return false;
  try {
    voice = start(a, spec, who);
    owner = who; current = spec.id;
    return true;
  } catch (err) {
    console.warn('[test-tone] listen failed:', err);
    stopTone();
    return false;
  }
}

/** Silence the listen bus. Safe to call any time. */
export function stopTone(): void {
  const v = voice;
  voice = null; owner = null; current = null;
  try { v?.stop(); } catch { /* ignore */ }
}

/** The monitor currently holding the bus and the source id it is voicing. */
export const listening = (): { owner: Node | null; id: string | null } => ({ owner, id: current });
