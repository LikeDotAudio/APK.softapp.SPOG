// src/ui/timer-graphic — the RC1000 dual-timer graphic a routed PRODUCTION TIMERS
// feed paints on a preview surface (the destination MONITOR today). One band per
// channel the routed label shows: a tag column (channel letter, ▲ UP / ▼ DN, run
// state) and the red seven-seg HH:MM:SS read-out the TIMER editor's keypads drive.
// The rows come pre-computed from domain/timer-core/graphic (timerRows), so this
// is pure canvas 2D with no bus or clock access.
import { drawSegString } from './seven-seg.js';
import type { TimerRow } from '../domain/timer-core/graphic.js';

const TAG = '#C864C8';   // the PRODUCTION TIMERS pool colour

export function drawTimerGraphic(cvs: HTMLCanvasElement, rows: TimerRow[]): void {
  const dpr = window.devicePixelRatio || 1;
  const cw = cvs.clientWidth, ch = cvs.clientHeight;
  if (!cw || !ch) return;
  const bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
  if (cvs.width !== bw) cvs.width = bw;
  if (cvs.height !== bh) cvs.height = bh;
  const g = cvs.getContext('2d'); if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#000'; g.fillRect(0, 0, cw, ch);
  if (!rows.length) return;
  const pad = Math.round(ch * 0.06);
  const band = (ch - pad * (rows.length + 1)) / rows.length;
  const tagW = Math.round(cw * 0.2);
  rows.forEach((r, i) => {
    const y = pad + i * (band + pad);
    // tag column: channel letter over direction + run state
    g.fillStyle = TAG; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${Math.max(10, Math.round(band * 0.42))}px 'Courier New',monospace`;
    g.fillText(r.id, pad + tagW / 2, y + band * 0.36);
    g.fillStyle = r.running ? '#7CFC9A' : '#6b7686';
    g.font = `700 ${Math.max(7, Math.round(band * 0.16))}px 'Courier New',monospace`;
    const dir = r.direction === 'down' ? '▼ DN' : r.direction === 'up' ? '▲ UP' : '— —';
    g.fillText(`${dir} ${r.running ? '▶' : '‖'}`, pad + tagW / 2, y + band * 0.78);
    // read-out: drawSegString paints from (0,0), so translate into the band. Its
    // HH:MM:SS run is ~3.4× its box height wide, so cap the height to fit the width.
    const w = cw - tagW - pad * 3, h = Math.min(band, w / 3.6);
    g.save();
    g.translate(pad * 2 + tagW, y + (band - h) / 2);
    drawSegString(g, w, h, r.text, 'seg', 'red', '#000');
    g.restore();
  });
}
