// src/editors/meter-input/scopes-audio — AUDIO scope painters (render analysis
// onto editor canvases). Split from live-input.ts: goniometer, L/R/L+R scope,
// level recorder, analog VU pair and digital dBFS meters. Re-exported through
// live-input.ts so import sites are unchanged.
import { ctx2d, fade, applyView, resetView, IDENTITY_VIEW, type View } from './scopes-video.js';
import { PAL, alpha } from '../../domain/palette.js';

// Audio goniometer / Lissajous — plots real L (x) vs R (y) sample pairs rotated
// 45° (mono = vertical), additive with persistence. Zoomable.
export function drawGonio(cv: HTMLCanvasElement, L: Uint8Array | null, R: Uint8Array | null, view: View = IDENTITY_VIEW): void {
  const c = ctx2d(cv); if (!c) return; const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R0 = Math.min(W, H) / 2 - 8;
  if (R0 < 4) return;   // hidden / collapsed card
  resetView(c); fade(c, W, H, 0.20); applyView(c, view);
  c.strokeStyle = PAL.sky13; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(cx, cy - R0); c.lineTo(cx, cy + R0); c.moveTo(cx - R0, cy); c.lineTo(cx + R0, cy); c.stroke();
  c.fillStyle = PAL.sky44s20; c.font = '9px "Courier New",monospace'; c.textAlign = 'center';
  c.fillText('M', cx, cy - R0 + 10); c.fillText('L', cx - R0 * 0.62, cy - R0 * 0.55); c.fillText('R', cx + R0 * 0.62, cy - R0 * 0.55);
  if (L && R) {
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = alpha(PAL.green70s74, .5);
    const n = Math.min(L.length, R.length), k = R0 / Math.SQRT2;
    for (let i = 0; i < n; i++) {
      const l = (L[i] ?? 128) / 128 - 1, r = (R[i] ?? 128) / 128 - 1;
      c.fillRect(cx + (l - r) * k, cy - (l + r) * k, 1, 1);
    }
    c.globalCompositeOperation = 'source-over';
  }
  resetView(c);
}

// Three stacked lanes: Left (top), Right (middle), and their sum L+R (bottom).
export function drawScope3(cv: HTMLCanvasElement, L: Uint8Array | null, R: Uint8Array | null, S: Uint8Array | null): void {
  const c = ctx2d(cv); if (!c) return; const W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
  const lanes: Array<[Uint8Array | null, string, string]> = [[L, 'L', '90,255,122'], [R, 'R', '90,157,255'], [S, 'L+R', '255,212,0']];
  const lh = H / 3;
  c.font = 'bold 9px "Courier New",monospace';
  lanes.forEach(([data, label, rgb], li) => {
    const y0 = li * lh, mid = y0 + lh / 2;
    c.strokeStyle = PAL.sky13; c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke();
    c.fillStyle = PAL.sky44s20; c.fillText(label, 5, y0 + 12);
    if (!data) return;
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = `rgba(${rgb},0.5)`; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x < W; x++) {
      const v = (data[(x / W * data.length) | 0] ?? 128) / 128 - 1;
      const y = mid - v * (lh / 2) * 0.82;
      x ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  });
}

// Slow "chart recorder": L/R level (dBFS) scrolling over a long window (minutes),
// so you read the audio like a strip-chart / audiogram rather than a fast scope.
export function drawRecorder(cv: HTMLCanvasElement, histL: number[], histR: number[], span: number): void {
  const c = ctx2d(cv); if (!c) return; const W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
  const lo = -60, hi = 0, y = (db: number): number => H - ((db - lo) / (hi - lo)) * H;
  c.font = '8px "Courier New",monospace'; c.textAlign = 'left';
  for (const db of [0, -6, -12, -20, -40, -60]) {
    const yy = y(db);
    c.strokeStyle = db === -20 ? alpha(PAL.green53, .35) : alpha(PAL.sky45s30, .16);
    c.beginPath(); c.moveTo(22, yy); c.lineTo(W, yy); c.stroke();
    c.fillStyle = alpha(PAL.sky61s35, .65); c.fillText(String(db), 1, yy + 3);
  }
  const line = (hist: number[], color: string): void => {
    if (!hist.length) return;
    c.strokeStyle = color; c.lineWidth = 1.4; c.beginPath();
    hist.forEach((db, i) => { const x = 22 + (i / span) * (W - 22), yy = y(Math.max(lo, db)); i ? c.lineTo(x, yy) : c.moveTo(x, yy); });
    c.stroke();
  };
  line(histL, PAL.green53); line(histR, PAL.blue68);
  c.fillStyle = PAL.sky44s20; c.textAlign = 'right'; c.fillText('L', W - 12, 11); c.fillStyle = PAL.blue68; c.fillText('R', W - 4, 11);
}

// Analog VU meters (L + R), inspired by OPEN-AIR libControl/metering NeedleMeter:
// a cream face, arced -20…+3 VU scale with a red over-0 zone, and a ballistic
// needle. Caller passes already-ballistic-smoothed dBFS (0 VU ≙ -18 dBFS).
const VU_LO = -20, VU_HI = 3;
const VU_MARKS: Array<[number, string]> = [[-20, '20'], [-10, '10'], [-7, '7'], [-5, '5'], [-3, '3'], [0, '0'], [3, '+3']];
function drawOneVU(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, db: number, label: string): void {
  c.save();
  c.beginPath(); c.roundRect(x + 2, y + 2, w - 4, h - 4, 8); c.fillStyle = PAL.amber88; c.fill();
  c.strokeStyle = alpha(PAL.black, .25); c.lineWidth = 1; c.stroke();
  const cx = x + w / 2, cy = y + h * 0.9, R = Math.min(w, h) * 0.7;
  const A0 = -Math.PI / 2 - 0.92, A1 = -Math.PI / 2 + 0.92;
  const ang = (vu: number): number => A0 + (A1 - A0) * ((vu - VU_LO) / (VU_HI - VU_LO));
  c.strokeStyle = PAL.amber19; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, R, A0, A1); c.stroke();
  c.strokeStyle = PAL.red44; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, ang(0), A1); c.stroke();
  const fs = Math.max(6, h * 0.085);
  c.textAlign = 'center'; c.font = `bold ${fs}px Arial`;
  VU_MARKS.forEach(([vu, txt]) => {
    const a = ang(vu), red = vu >= 0;
    c.strokeStyle = red ? PAL.red44 : PAL.amber13; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R - 7), cy + Math.sin(a) * (R - 7)); c.stroke();
    c.fillStyle = red ? PAL.red44 : PAL.amber13; c.fillText(txt, cx + Math.cos(a) * (R - 15), cy + Math.sin(a) * (R - 15) + 3);
  });
  c.fillStyle = PAL.amber36; c.font = `bold ${Math.max(8, h * 0.1)}px Arial`; c.fillText('VU', cx, cy - R * 0.5);
  c.fillStyle = PAL.amber13; c.font = `bold ${fs}px Arial`; c.fillText(label, cx, cy - 5);
  const a = ang(Math.max(VU_LO, Math.min(VU_HI, db + 18)));
  c.strokeStyle = PAL.grey08s0; c.lineWidth = Math.max(1.5, h * 0.018); c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); c.stroke();
  c.fillStyle = PAL.grey08s0; c.beginPath(); c.arc(cx, cy, Math.max(3, h * 0.035), 0, 7); c.fill();
  c.restore();
}
export function drawVUpair(cv: HTMLCanvasElement, dbL: number, dbR: number): void {
  const c = ctx2d(cv); if (!c) return; const W = cv.width, H = cv.height;
  if (W < 24 || H < 16) return;   // hidden / collapsed card
  c.clearRect(0, 0, W, H);
  drawOneVU(c, 0, 0, W / 2, H, dbL, 'L');
  drawOneVU(c, W / 2, 0, W / 2, H, dbR, 'R');
}

export interface PeakState { l: number; r: number; }
export function drawMetersReal(cv: HTMLCanvasElement, dbL: number, dbR: number, peak: PeakState): void {
  const c = ctx2d(cv); if (!c) return; const W = cv.width, H = cv.height;
  if (W < 8 || H < 8) return;   // hidden / collapsed card
  c.clearRect(0, 0, W, H);
  const norm = (db: number): number => Math.max(0, Math.min(1, (db + 60) / 60));
  peak.l = Math.max(norm(dbL), peak.l - 0.01); peak.r = Math.max(norm(dbR), peak.r - 0.01);
  const bars: Array<[number, number, number, string]> = [[norm(dbL), peak.l, dbL, 'L'], [norm(dbR), peak.r, dbR, 'R']];
  bars.forEach((m, i) => {
    const bw = W / 2 - 14, x = i * (W / 2) + 8;
    c.fillStyle = PAL.blue09; c.fillRect(x, 8, bw, H - 30);
    const g = c.createLinearGradient(0, H - 22, 0, 8);
    g.addColorStop(0, PAL.green44); g.addColorStop(0.7, PAL.yellow56); g.addColorStop(1, PAL.red62);
    c.fillStyle = g; c.fillRect(x, 8 + (H - 30) * (1 - m[0]), bw, (H - 30) * m[0]);
    c.fillStyle = PAL.white; c.fillRect(x, 8 + (H - 30) * (1 - m[1]), bw, 2);
    c.fillStyle = PAL.sky84; c.font = 'bold 10px monospace';
    c.fillText(`${m[3]} ${isFinite(m[2]) ? m[2].toFixed(0) : '-∞'}`, x, H - 6);
  });
}
