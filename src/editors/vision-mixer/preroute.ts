// src/editors/vision-mixer/preroute — the graphics PRE-ROUTE panel.
//
// The control room's graphics are HARD-WIRED into the switcher (each DSK ships with
// a fixed `def.dsks[i].source`) and are always present. This panel is the operator's
// way to *shift* which graphic feeds each downstream keyer AFTER it's presented —
// the M/E has no native way to re-route these, so it sits as its own module beside
// the M/E. Choosing a source stamps `state.dskSrc[i]` and relabels the DSK button.
//
// A source is flagged ⬡ GFX when it is one of the switcher's hard-wired graphics
// inputs (the pool positions the DSKs default to).
//
// Two views, toggled in the panel (remembered per device; `?preroute=matrix|list`
// overrides): LIST — the shipped per-DSK selects over any source — and MATRIX —
// the GFX × bus pre-router (gfx-route.ts): one row per DSK (DOWNSTREAM) and per
// keyer of the delegated M/E (UPSTREAM), one column per hard-wired graphic.

import { el } from '../../ui/dom.js';
import { srcLabel } from './me.js';
import { gfxBuses, gfxFeeds, prerouteView, routeGfx } from './gfx-route.js';
import type { Surface } from './surface.js';

const VIEW_KEY = 'twist.vm.preroute.view';

const srcOf = (d: { source?: number }): number => d.source ?? 0;

/** The set of input indices that are the switcher's hard-wired graphics feeds. */
export function graphicsInputs(s: Surface): Set<number> {
  return new Set(s.def.dsks.map(srcOf));
}

/** Effective source feeding DSK i (operator override, else the hard-wired default). */
export function dskSource(s: Surface, i: number): number {
  return s.state.dskSrc?.[i] ?? srcOf(s.def.dsks[i]!);
}

/** Label for a DSK button: its name, plus the re-routed feed when shifted off default. */
export function dskLabel(s: Surface, i: number): string {
  const d = s.def.dsks[i]!;
  const eff = dskSource(s, i);
  const head = d.name.split('·')[0]!.trim();
  return eff === srcOf(d) ? d.name : `${head} ⟵ ${srcLabel(eff, s.def)}`;
}

/** Build the PRE-ROUTE panel (LIST + MATRIX views). `refresh` repaints it from state
 *  (delegate change, a keyer re-sourced elsewhere) — call it after every sync. */
export function buildPreRoute(
  s: Surface,
  dskBtns: HTMLElement[],
): { preRow: HTMLElement; preSelects: HTMLSelectElement[]; refresh: () => void } {
  const def = s.def;
  const gfx = graphicsInputs(s);
  if (!s.state.dskSrc) s.state.dskSrc = def.dsks.map(srcOf);

  const preRow = el('div', { class: 'vm-transrow', style: 'flex-direction:column;align-items:stretch;gap:8px;' });
  const listView = el('div', { style: 'display:flex;flex-direction:column;gap:8px;' });
  const matrixView = el('div', { class: 'vm-gfxmatrix' });
  const viewBtn = el('button', { class: 'vm-tbtn vm-ab', type: 'button' }, ['']);
  let stored: string | null = null;
  try { stored = localStorage.getItem(VIEW_KEY); } catch { /* private mode */ }
  let view = prerouteView(stored, typeof location === 'undefined' ? '' : location.href);
  const showView = (): void => {
    listView.style.display = view === 'list' ? 'flex' : 'none';
    matrixView.style.display = view === 'matrix' ? 'grid' : 'none';
    viewBtn.textContent = view === 'list' ? '▦ MATRIX' : '☰ LIST';
  };
  viewBtn.addEventListener('click', () => {
    view = view === 'list' ? 'matrix' : 'list';
    try { localStorage.setItem(VIEW_KEY, view); } catch { /* ignore */ }
    showView(); refresh();
  });
  preRow.append(el('div', { style: 'display:flex;gap:8px;align-items:center;' }, [
    el('p', { class: 'ed-h', style: 'margin:0;opacity:.7;font-size:10px;flex:1;' },
      ['⬡ control-room graphics are hard-wired — shift which one feeds each keyer bus']),
    viewBtn,
  ]), listView, matrixView);
  const preSelects: HTMLSelectElement[] = [];

  def.dsks.forEach((d, i) => {
    const row = el('div', { style: 'display:flex;gap:8px;align-items:center;' });
    row.append(el('span', { class: 'ed-h', style: 'margin:0;min-width:52px;' }, [`DSK ${i + 1}`]));

    const sel = el('select', { class: 'vm-sel', style: 'flex:1;' }) as HTMLSelectElement;
    s.allLabels.forEach((l, idx) => sel.append(el('option', { value: String(idx) }, [`${gfx.has(idx) ? '⬡ ' : ''}${l}`])));
    sel.value = String(dskSource(s, i));
    sel.addEventListener('change', () => {
      (s.state.dskSrc ??= def.dsks.map(srcOf))[i] = +sel.value;
      dskBtns[i]!.textContent = dskLabel(s, i);
      s.publish(`dsk.${i + 1}.source`, srcLabel(+sel.value, def));
      s.sync();
    });
    preSelects.push(sel);
    row.append(sel);
    listView.append(row);
  });

  /** MATRIX: header of GFX columns, then one row per bus; a lit cell = that graphic feeds it. */
  function paintMatrix(): void {
    const feeds = gfxFeeds(def);
    matrixView.style.gridTemplateColumns = `auto repeat(${feeds.length}, minmax(34px, 1fr))`;
    const cells: HTMLElement[] = [el('span', {}, ['']),
      ...feeds.map((src, c) => el('span', { class: 'vm-gfxhead', title: srcLabel(src, def) }, [`GFX ${c + 1}`]))];
    gfxBuses(def, s.state, s.delegate).forEach((bus, r) => {
      cells.push(el('span', { class: `vm-gfxbus ${bus.stream}` }, [`${bus.stream === 'down' ? 'DSK' : 'USK'} · ${bus.label}`]));
      for (const src of feeds) {
        const cell = el('button', { class: `vm-gfxcell${bus.source === src ? ' on' : ''}`, type: 'button', title: `${srcLabel(src, def)} → ${bus.label}` }, [bus.source === src ? '●' : '']);
        cell.addEventListener('click', () => {
          const hit = routeGfx(def, s.state, s.delegate, r, src);
          if (!hit) return;
          s.publish(hit.topic, srcLabel(src, def));
          if (hit.stream === 'down') dskBtns[r]!.textContent = dskLabel(s, r); else s.rebuildKeyers();
          s.sync();
        });
        cells.push(cell);
      }
    });
    matrixView.replaceChildren(...cells);
  }

  function refresh(): void {
    preSelects.forEach((sel, i) => { sel.value = String(dskSource(s, i)); dskBtns[i]!.textContent = dskLabel(s, i); });
    if (view === 'matrix') paintMatrix();
  }

  showView();
  refresh();
  return { preRow, preSelects, refresh };
}
