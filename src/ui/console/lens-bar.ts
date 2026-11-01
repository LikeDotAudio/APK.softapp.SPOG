// src/ui/console/lens-bar — the Discipline Lens toolbar in a room canvas's header
// (ROAD-3473): ALL · SIGNALS chips · BUNDLES chips · a DIM ↔ HIDE strength slider.
// Click a chip = ONLY that discipline (click it again for ALL); shift / ctrl / ⌘-click
// adds or removes it from what is showing. The bar only reports gestures; lens.ts owns
// the state and paints every bar the same, since the lens is one per seat.
import { el, addStyles } from '../dom.js';
import { DISCIPLINES, type DisciplineId } from '../../domain/lens/disciplines.js';
import type { LensState } from '../../domain/lens/mask.js';
import { PAL, alpha } from '../../domain/palette.js';

export type LensAction =
  | { type: 'all' }
  | { type: 'only'; id: DisciplineId }
  | { type: 'toggle'; id: DisciplineId }
  | { type: 'strength'; value: number; commit: boolean };

const CSS = `
.lens-bar{display:flex;flex-wrap:wrap;align-items:center;gap:3px 4px;margin:-10px 0 6px;padding:2px 8px;
  font-size:10px;letter-spacing:1px;color:var(--prod-color);background:${alpha(PAL.black, .25)};border-radius:8px;}
.lens-bar .lens-label{font-weight:bold;margin-right:2px;}
.lens-bar .lens-group{opacity:.6;margin:0 2px 0 8px;}
.lens-bar button{font:inherit;letter-spacing:inherit;cursor:pointer;padding:1px 7px;border-radius:9px;
  border:1px solid var(--prod-color);background:transparent;color:var(--prod-color);}
.lens-bar button[aria-pressed="true"]{background:var(--prod-color);color:${PAL.black};}
.lens-bar button.lens-empty{opacity:.4;}
.lens-bar button b{font-weight:normal;opacity:.7;margin-left:3px;}
.lens-bar .lens-strength{display:inline-flex;align-items:center;gap:4px;margin-left:auto;}
.lens-bar .lens-strength input{width:90px;accent-color:var(--prod-color);}
.lens-masked{opacity:var(--lens-opacity,.3) !important;transition:opacity .15s;}
.lens-hidden{visibility:hidden !important;pointer-events:none !important;}
`;

export function ensureLensStyles(): void { addStyles('discipline-lens', CSS); }

/** Build one toolbar; every gesture goes to `act`. */
export function buildLensBar(act: (a: LensAction) => void): HTMLElement {
  ensureLensStyles();
  const bar = el('div', { class: 'lens-bar', role: 'toolbar', title: 'Discipline lens — a view of this canvas, never an edit' });
  bar.setAttribute('aria-label', 'Discipline lens');
  const all = el('button', { class: 'lens-all', title: 'Show every discipline' }, ['ALL']);
  all.dataset.lens = 'all';
  bar.append(el('span', { class: 'lens-label' }, ['LENS']), all);
  for (const kind of ['signal', 'bundle'] as const) {
    bar.append(el('span', { class: 'lens-group' }, [kind === 'signal' ? 'SIGNALS' : 'BUNDLES']));
    for (const d of DISCIPLINES.filter((x) => x.kind === kind)) {
      const chip = el('button', { class: 'lens-chip', title: `ONLY ${d.label} — shift-click to add / remove` }, [d.label, el('b')]);
      chip.dataset.lens = d.id;
      bar.append(chip);
    }
  }
  const range = el('input', { type: 'range', min: '0', max: '100', step: '5', title: 'What the lens is not showing: dim … hide' });
  bar.append(el('label', { class: 'lens-strength' }, ['DIM', range, 'HIDE']));

  bar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-lens]');
    if (!b) return;
    e.stopPropagation();
    const id = b.dataset.lens as DisciplineId | 'all';
    if (id === 'all') act({ type: 'all' });
    else act({ type: e.shiftKey || e.ctrlKey || e.metaKey ? 'toggle' : 'only', id });
  });
  range.addEventListener('input', () => act({ type: 'strength', value: Number(range.value) / 100, commit: false }));
  range.addEventListener('change', () => act({ type: 'strength', value: Number(range.value) / 100, commit: true }));
  // Panning the room canvas must not start from the toolbar.
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());
  return bar;
}

/** Paint every toolbar from the one lens state + the edge count per discipline
 *  (one map for every bar, or a map per bar — a room's own crosspoints). */
export function paintLensBars(
  s: LensState, countsFor: Map<DisciplineId, number> | ((bar: HTMLElement) => Map<DisciplineId, number>), root: ParentNode = document,
): void {
  root.querySelectorAll<HTMLElement>('.lens-bar').forEach((bar) => {
    const counts = typeof countsFor === 'function' ? countsFor(bar) : countsFor;
    bar.querySelectorAll<HTMLElement>('button[data-lens]').forEach((b) => {
      const id = b.dataset.lens as DisciplineId | 'all';
      if (id === 'all') { b.setAttribute('aria-pressed', String(s.showing === null)); return; }
      const n = counts.get(id) ?? 0;
      b.setAttribute('aria-pressed', String(s.showing !== null && s.showing.includes(id)));
      b.classList.toggle('lens-empty', n === 0);
      const badge = b.querySelector('b');
      if (badge) badge.textContent = n ? String(n) : '';
    });
    const range = bar.querySelector<HTMLInputElement>('input[type=range]');
    if (range && document.activeElement !== range) range.value = String(Math.round(s.strength * 100));
  });
}
