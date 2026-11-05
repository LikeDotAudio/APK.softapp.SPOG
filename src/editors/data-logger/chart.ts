// src/editors/data-logger/chart — the strip chart: every logged meter as a line
// over the last span, on one canvas, sized to its box (device pixels).

import { windowOf, type Series } from './series.js';
import { PAL } from '../../domain/palette.js';

export const COLOURS = [PAL.orange50, PAL.cyan59, PAL.green53, PAL.indigo83, PAL.amber60, PAL.blue68, PAL.green74, PAL.cyan76];

const fmt = (v: number): string => {
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) return v.toExponential(3);
  return Number(v.toPrecision(6)).toString();
};

export function draw(canvas: HTMLCanvasElement, series: Series[], now: number, spanMs: number): void {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, w, h);
  const padL = 70 * dpr;
  const padB = 18 * dpr;
  const { from, lo, hi } = windowOf(series, now, spanMs);
  const x = (t: number): number => padL + ((t - from) / spanMs) * (w - padL - 6 * dpr);
  const y = (v: number): number => (h - padB) - ((v - lo) / (hi - lo)) * (h - padB - 8 * dpr);

  // grid + range labels
  g.strokeStyle = PAL.grey21;
  g.fillStyle = PAL.grey64;
  g.font = `${11 * dpr}px Inter, system-ui, sans-serif`;
  g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = lo + ((hi - lo) * i) / 4;
    const yy = y(v);
    g.beginPath(); g.moveTo(padL, yy); g.lineTo(w, yy); g.stroke();
    g.fillText(fmt(v), 4 * dpr, yy + 4 * dpr);
  }
  const mins = spanMs / 60_000;
  g.fillText(mins >= 1 ? `−${mins} min` : `−${spanMs / 1000} s`, padL, h - 4 * dpr);
  g.fillText('now', w - 30 * dpr, h - 4 * dpr);

  // one line per meter
  series.forEach((s, i) => {
    const pts = s.samples.filter((p) => p.t >= from);
    if (!pts.length) return;
    g.strokeStyle = COLOURS[i % COLOURS.length]!;
    g.lineWidth = 1.6 * dpr;
    g.beginPath();
    pts.forEach((p, k) => (k ? g.lineTo(x(p.t), y(p.v)) : g.moveTo(x(p.t), y(p.v))));
    g.stroke();
    const last = pts.at(-1)!;
    g.fillStyle = g.strokeStyle;
    g.beginPath(); g.arc(x(last.t), y(last.v), 2.5 * dpr, 0, Math.PI * 2); g.fill();
  });
}

export { fmt };
