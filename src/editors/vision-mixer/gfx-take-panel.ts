// src/editors/vision-mixer/gfx-take-panel — the GFX SETS module (DSK preview → program).
//
// The DOM over gfx-take.ts: one button per graphic set (click = arm it on PREVIEW),
// a rate field, and CUT GFX / AUTO GFX to take every armed set to PROGRAM through a
// simulated fade. Armed sets ride as dashed chips on the preview monitor; a fade in
// flight rides as a chip on the program monitor whose opacity is the fade. The
// plain DSK buttons keep cutting on/off air directly — this module only adds the
// prepared path. Its RAF frame is fenced: a failing frame is logged once and the
// next frame runs, so a fault here never stops the rest of the switcher.

import { el } from '../../ui/dom.js';
import { tip } from '../../ui/tip.js';
import { gfxSets, armDsk, armedDsks, beginTake, fadeLevel, settle, type GfxFade } from './gfx-take.js';
import type { Surface } from './surface.js';

const ARMED = '2px dashed var(--state-ok,#39d98a)';
const CHIP = 'font-size:10px;font-weight:bold;padding:2px 9px;border-radius:8px;letter-spacing:1px;';

/** Build the GFX SETS row + its monitor overlays and start its frame loop. */
export function buildGfxTake(s: Surface, mons: { pgmMon: HTMLElement; pvwMon: HTMLElement }): { gfxRow: HTMLElement } {
  const { def, state } = s;
  let fades: GfxFade[] = [];
  let warned = false;

  const setRow = el('div', { class: 'vm-keyrow' });
  const setBtns = def.dsks.map((_, i) => {
    const b = el('div', { class: 'vm-key' });
    b.addEventListener('click', () => { armDsk(state, i); refresh(); });
    tip(b, { title: 'GRAPHIC SET', lead: 'Arm this graphic on PREVIEW. CUT GFX / AUTO GFX takes every armed set to PROGRAM.', good: 'Armed again while on air, the take brings it OFF.' });
    return b;
  });
  setRow.append(...setBtns);

  const rate = el('input', { class: 'vm-num', type: 'number', min: '0', max: '300', value: '24' }) as HTMLInputElement;
  tip(rate, { title: 'GFX RATE', lead: 'Graphics fade duration in frames (0 = cut).' });
  const cutBtn = el('div', { class: 'vm-tbtn take', style: 'background: var(--state-alarm,#ff3b3b); color: #fff;' }, ['CUT GFX']);
  const autoBtn = el('div', { class: 'vm-tbtn take', style: 'background: var(--sig-audio,#FF9C63); color: #000;' }, ['AUTO GFX']);
  tip(cutBtn, { title: 'CUT GFX', lead: 'Take every armed graphic to PROGRAM at once.' });
  tip(autoBtn, { title: 'AUTO GFX', lead: 'Fade every armed graphic to PROGRAM over the rate (a front-end simulation).' });
  const take = (ms: number): void => { fades = [...fades, ...beginTake(state, performance.now(), ms)]; frame(); };
  cutBtn.addEventListener('click', () => take(0));
  autoBtn.addEventListener('click', () => take((Math.max(0, +rate.value || 0) / 30) * 1000));

  // Monitor overlays: armed sets on PREVIEW, fades in flight on PROGRAM (above the DSK strip).
  const pvwRow = el('div', { class: 'vm-dskrow' });
  const pgmRow = el('div', { class: 'vm-dskrow', style: 'bottom:34px;' });
  mons.pvwMon.append(pvwRow);
  mons.pgmMon.append(pgmRow);

  const gfxRow = el('div', { style: 'display:flex;flex-direction:column;gap:8px;' }, [
    el('p', { class: 'ed-h', style: 'margin:0 0 2px;opacity:.7;font-size:10px;' }, ['arm a graphic on preview → take it to program']),
    setRow,
    el('div', { class: 'vm-transrow' }, [rate, cutBtn, autoBtn]),
  ]);

  let lastKey = '';
  /** Push arms / on-air / fades onto the buttons and overlays (only when they changed). */
  function refresh(now = performance.now()): void {
    const sets = gfxSets(def, state);
    const armed = new Set(armedDsks(state));
    const key = JSON.stringify([sets.map((x) => x.name), [...armed], state.dsks, fades.map((f) => [f.dsk, Math.round(fadeLevel(f, now) * 20)])]);
    if (key === lastKey) return;
    lastKey = key;
    sets.forEach((set, i) => {
      const b = setBtns[i]!;
      if (b.textContent !== set.name) b.textContent = set.name;
      b.classList.toggle('on', !!state.dsks[i]);
      b.style.outline = armed.has(i) ? ARMED : '';
    });
    pvwRow.replaceChildren(...[...armed].map((i) =>
      el('span', { style: `${CHIP}background:transparent;color:var(--state-ok,#39d98a);outline:${ARMED};` }, [sets[i]!.name])));
    pgmRow.replaceChildren(...fades.map((f) => {
      const t = fadeLevel(f, now);
      return el('span', { style: `${CHIP}background:var(--state-onair,#ffaa00);color:#000;opacity:${(f.to ? t : 1 - t).toFixed(2)};` }, [sets[f.dsk]?.name ?? '']);
    }));
  }

  /** Land finished fades (publish + sync, as a DSK button press would), then repaint. */
  function frame(): void {
    try {
      if (fades.length) {
        const r = settle(state, fades, performance.now());
        fades = r.live;
        for (const f of r.done) {
          s.publish(`dsk.${f.dsk + 1}.on`, f.to);
          if (f.dsk < 2) s.publish(`dsk${f.dsk + 1}`, f.to);   // legacy alias
        }
        if (r.done.length) s.sync();
      }
      refresh();
    } catch (e) {
      if (!warned) { warned = true; console.warn('[vision-mixer] GFX SETS frame failed; continuing', e); }
    }
  }
  s.ctx.dispose.raf(frame);
  refresh();
  return { gfxRow };
}
