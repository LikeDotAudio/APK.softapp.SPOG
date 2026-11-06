// src/ui/audio-scope — broadcast AUDIO scopes, the audio companion to ui/scopes.ts
// (which holds the video parade + vectorscope). Ported to typed, context-guarded TS:
//   • drawAudioWave  — the oscilloscope trace (from js/editors/shared/audio-scope.js,
//                      itself lifted from the IFB confidence feed).
//   • drawLissajous  — the stereo PHASE scope (from the Audio Monitor's drawLiss):
//                      L/R rotated 45° into X/Y; green in-phase, red anti-phase.
// Shared so the IFB monitor, the Audio Monitor, and the Meter Input test tool all
// draw the same instruments from one place (Phase 4 consumes these).

import { withTrueColour } from '../domain/true-colour.js';
import { PAL, alpha } from '../domain/palette.js';
import { tripleColour } from '../domain/colour-resolve.js';

export interface AudioWaveOpts {
  /** Red "attention" trace (the IFB uses it while a Talk key is held). */
  alert?: boolean;
  /** Override the normal trace colour. */
  color?: string;
  /** Sine cycles across the width (default 6). */
  cycles?: number;
}

/** Animated oscilloscope trace at `level` (0..1) amplitude. */
/** Signal content: drawn in TRUE colour whatever the mode (src/domain/true-colour.ts). */
export function drawAudioWave(cv: HTMLCanvasElement, level: number, opts: AudioWaveOpts = {}): void {
  withTrueColour(cv.getContext('2d'), () => paintAudioWave(cv, level, opts));
}
function paintAudioWave(cv: HTMLCanvasElement, level: number, opts: AudioWaveOpts = {}): void {
  const w = (cv.width = cv.clientWidth);
  const h = (cv.height = cv.clientHeight);
  if (!w || !h) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const cycles = opts.cycles || 6;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = opts.alert ? alpha(PAL.red74s100, .9) : (opts.color || alpha(PAL.green62, .9));
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 3) {
    const t = (x / w) * Math.PI * 2 * cycles;
    const y = h / 2 + Math.sin(t + performance.now() * 0.004) * level * (h * 0.42) * (0.6 + Math.random() * 0.4);
    x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

/**
 * Stereo Lissajous (phase) scope. `corr` is the phase correlation (-1..+1),
 * `frame` an animation counter, `amp` the level (0..1) scaling the figure. The
 * trace is green when in-phase, red when anti-correlated (mono-compatibility risk).
 */
/** Signal content: drawn in TRUE colour whatever the mode (src/domain/true-colour.ts). */
export function drawLissajous(cv: HTMLCanvasElement, corr: number, frame: number, amp: number): void {
  withTrueColour(cv.getContext('2d'), () => paintLissajous(cv, corr, frame, amp));
}
function paintLissajous(cv: HTMLCanvasElement, corr: number, frame: number, amp: number): void {
  const w = (cv.width = cv.clientWidth | 0);
  const h = (cv.height = cv.clientHeight | 0);
  if (!w || !h) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  // crosshair graticule
  ctx.strokeStyle = alpha(PAL.sky45s30, .25);
  ctx.beginPath();
  ctx.moveTo(w / 2, 4); ctx.lineTo(w / 2, h - 4);
  ctx.moveTo(4, h / 2); ctx.lineTo(w - 4, h / 2);
  ctx.stroke();
  ctx.strokeStyle = corr < 0 ? alpha(PAL.red68s100, .85) : alpha(PAL.green70s74, .85);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const a = (0.5 + amp * 0.5) * (w / 2 - 8);
  const spread = (1 - Math.abs(corr)) * 0.9;
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2;
    const l = Math.sin(t + frame * 0.06);
    const r = Math.sin(t + frame * 0.06 + spread * Math.PI * (corr < 0 ? 1 : 0.3));
    // rotate L/R into X/Y (45°): the classic audio Lissajous
    const x = w / 2 + (l - r) * a * 0.5;
    const y = h / 2 - (l + r) * a * 0.5;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

/** One stacked lane per trace — [bytes 0..255 (128 = centre), label, "r,g,b"].
 *  The Meter Input's L/R/L+R scope (scopes-audio drawScope3) and a bench
 *  scope's channels (editors/instrument) draw through this one painter. */
export type Lane = [Uint8Array | null, string, string];
export function drawLanes(cv: HTMLCanvasElement, lanes: Lane[]): void {
  const c = cv.getContext('2d'); if (!c) return; const W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
  if (!lanes.length) return;
  const lh = H / lanes.length;
  c.font = 'bold 9px "Courier New",monospace';
  lanes.forEach(([data, label, rgb], li) => {
    const y0 = li * lh, mid = y0 + lh / 2;
    c.strokeStyle = PAL.sky13; c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke();
    c.fillStyle = PAL.sky44s20; c.fillText(label, 5, y0 + 12);
    if (!data) return;
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = tripleColour(rgb, 0.5); c.lineWidth = 1; c.beginPath();
    for (let x = 0; x < W; x++) {
      const v = (data[(x / W * data.length) | 0] ?? 128) / 128 - 1;
      const y = mid - v * (lh / 2) * 0.82;
      x ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  });
}
