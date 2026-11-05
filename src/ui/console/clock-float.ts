// src/ui/console/clock-float — ONE FLOATING CLOCK WINDOW (owner, 2026-11-04: "I love
// the clock faces … I want those to float … in one thing").
//
// A 🕐 CLOCKS button beside CHAT and VOICE opens one window that floats above the
// whole console: dragged by its title bar, resized from its corner, holding as many
// faces as you like side by side — each tile its own FACE and ZONE, drawn by the same
// face library the CLOCK editor uses (TIME.clockFaces' ALL_FACES). Where it sits, its
// size and its tiles are this viewer's (localStorage, guarded); nothing is published.
// `?clocks=1` opens it at load — the OS desktop's floating clock frame uses that.

import { addStyles } from '../dom.js';
import { ALL_FACES } from '../clock-faces/src/index.js';
import { ZONES, detectZoneIdx, zoneOf, type FaceDef } from '../clock-faces/src/shared.js';
import { CLOCK_FLOAT_CSS } from './clock-float-styles.js';

interface Tile { face: string; zone: number }
interface FloatState { open: boolean; x: number; y: number; w: number; h: number; tiles: Tile[] }

const KEY = 'spog.clockFloat.v1';
const FACES: readonly FaceDef[] = ALL_FACES;
const faceOf = (id: string): FaceDef => FACES.find((f) => f.id === id) ?? FACES[0]!;
const utcIdx = (): number => Math.max(0, ZONES.findIndex((z) => z.off === 0));

export function defaultState(): FloatState {
  const pick = (id: string, i: number): string => (FACES.some((f) => f.id === id) ? id : FACES[i % FACES.length]!.id);
  return {
    open: false, x: 60, y: 60, w: 560, h: 260,
    tiles: [{ face: pick('ledring', 0), zone: detectZoneIdx() }, { face: pick('digital', 1), zone: utcIdx() }, { face: pick('analog', 2), zone: detectZoneIdx() }],
  };
}

function load(): FloatState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as FloatState | null;
    if (s && Array.isArray(s.tiles)) return { ...defaultState(), ...s };
  } catch { /* private window / blocked storage: the default */ }
  return defaultState();
}
const save = (s: FloatState): void => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* fine */ } };

/** Keep the window on screen whatever the viewport did since it was saved. */
export function clamp(s: FloatState, vw: number, vh: number): FloatState {
  const w = Math.min(Math.max(220, s.w), vw), h = Math.min(Math.max(150, s.h), vh);
  return { ...s, w, h, x: Math.min(Math.max(0, s.x), vw - Math.min(w, 120)), y: Math.min(Math.max(0, s.y), vh - 40) };
}

export function initClockFloat(): void {
  addStyles('clock-float-styles', CLOCK_FLOAT_CSS);
  let st = clamp(load(), window.innerWidth, window.innerHeight);
  if (new URLSearchParams(location.search).get('clocks') === '1') st.open = true;

  const launch = document.createElement('button');
  launch.className = 'clock-float-launch';
  launch.textContent = '🕐 CLOCKS';
  const win = document.createElement('div');
  win.className = 'clock-float';
  win.innerHTML = `<div class="cf-head"><b>🕐 CLOCKS</b><span class="cf-sp"></span>
    <button class="cf-add" aria-label="Add a clock">＋</button><button class="cf-x" aria-label="Close">×</button></div>
    <div class="cf-tiles"></div>`;
  document.body.append(launch, win);
  const tilesEl = win.querySelector<HTMLElement>('.cf-tiles')!;
  const canvases: HTMLCanvasElement[] = [];

  const place = (): void => {
    win.style.cssText = `left:${st.x}px;top:${st.y}px;width:${st.w}px;height:${st.h}px;display:${st.open ? 'flex' : 'none'}`;
    launch.classList.toggle('on', st.open);
  };
  const option = (value: string, label: string, sel: boolean): string => `<option value="${value}"${sel ? ' selected' : ''}>${label}</option>`;
  const build = (): void => {
    tilesEl.replaceChildren();
    canvases.length = 0;
    st.tiles.forEach((t, i) => {
      const tile = document.createElement('div');
      tile.className = 'cf-tile';
      tile.innerHTML = `<canvas></canvas><div class="cf-ctl">
        <select class="cf-face">${FACES.map((f) => option(f.id, f.short || f.label, f.id === t.face)).join('')}</select>
        <select class="cf-zone">${ZONES.map((z, k) => option(String(k), z.code, k === t.zone)).join('')}</select>
        <button class="cf-del" aria-label="Remove this clock">×</button></div>`;
      tile.querySelector<HTMLSelectElement>('.cf-face')!.onchange = (e) => { t.face = (e.target as HTMLSelectElement).value; save(st); };
      tile.querySelector<HTMLSelectElement>('.cf-zone')!.onchange = (e) => { t.zone = Number((e.target as HTMLSelectElement).value); save(st); };
      tile.querySelector<HTMLButtonElement>('.cf-del')!.onclick = () => { st.tiles.splice(i, 1); save(st); build(); };
      canvases.push(tile.querySelector('canvas')!);
      tilesEl.append(tile);
    });
  };

  launch.onclick = () => { st.open = !st.open; save(st); place(); };
  win.querySelector<HTMLButtonElement>('.cf-x')!.onclick = () => { st.open = false; save(st); place(); };
  win.querySelector<HTMLButtonElement>('.cf-add')!.onclick = () => {
    st.tiles.push({ face: FACES[st.tiles.length % FACES.length]!.id, zone: detectZoneIdx() });
    save(st); build();
  };

  // Drag by the title bar; the corner resize is CSS, read back on release.
  const head = win.querySelector<HTMLElement>('.cf-head')!;
  head.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    head.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent): void => { st = clamp({ ...st, x: m.clientX - dx, y: m.clientY - dy }, window.innerWidth, window.innerHeight); place(); };
    const up = (): void => { head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', up); save(st); };
    head.addEventListener('pointermove', move);
    head.addEventListener('pointerup', up);
  });
  new ResizeObserver(() => {
    if (!st.open) return;
    const r = win.getBoundingClientRect();
    if (Math.round(r.width) !== st.w || Math.round(r.height) !== st.h) { st.w = Math.round(r.width); st.h = Math.round(r.height); save(st); }
  }).observe(win);

  const states = new WeakMap<HTMLCanvasElement, Record<string, unknown>>();
  const frame = (): void => {
    if (st.open) {
      const now = Date.now(), dpr = window.devicePixelRatio || 1;
      canvases.forEach((cvs, i) => {
        const t = st.tiles[i];
        const g = cvs.getContext('2d');
        if (!t || !g || !cvs.clientWidth || !cvs.clientHeight) return;
        const bw = Math.round(cvs.clientWidth * dpr), bh = Math.round(cvs.clientHeight * dpr);
        if (cvs.width !== bw) cvs.width = bw;
        if (cvs.height !== bh) cvs.height = bh;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, bw, bh);
        const def = faceOf(t.face);
        const [fw, fh] = def.fit;
        const S = Math.max(30, Math.min(cvs.clientWidth / fw, cvs.clientHeight / fh));
        g.setTransform(dpr, 0, 0, dpr, ((cvs.clientWidth - S) / 2) * dpr, ((cvs.clientHeight - S) / 2) * dpr);   // as editors/clock/paint.ts
        if (!states.has(cvs)) states.set(cvs, {});
        try { def.draw(g, S, { z: zoneOf(ZONES[t.zone] ?? ZONES[0]!), now, res: 'hms', state: states.get(cvs)! }); } catch { /* one bad face never stops the others */ }
      });
    }
    requestAnimationFrame(frame);
  };
  build();
  place();
  requestAnimationFrame(frame);
}
