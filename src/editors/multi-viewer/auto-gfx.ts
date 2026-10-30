// src/editors/multi-viewer/auto-gfx — auto-multiviewer graphics tiles.
//
// Roadmap §2: any graphic on a DSK / the switcher automatically lands in a
// multiviewer tile, monitored without a manual route. The vision mixer announces
// its on-air graphics on platform/gfx-monitor (per production); when this seat
// opts in, the wall fills its spare cells with one read-only AUTO tile per graphic
// (always PGM tally — it is on air). Opt-in per seat (the ⬡ AUTO GFX preset-bar
// toggle) or per URL (`?automv=1` forces on, `?automv=0` forces off), so walls
// that never asked for it are unchanged.

import { el } from '../../ui/dom.js';
import type { OnAirGraphic } from '../../platform/gfx-monitor.js';
import type { Win } from './panes.js';

// Under the seat's `twist.vm.` prefix so seat export/import carries it.
const PREF_KEY = 'twist.vm.mvAutoGfx';
const GFX_COLOR = '#ffaa00';

function urlOverride(): boolean | null {
  try {
    const q = new URLSearchParams(location.search);
    const h = location.hash.includes('?') ? new URLSearchParams(location.hash.split('?')[1]) : null;
    const v = q.get('automv') ?? h?.get('automv');
    return v === '1' ? true : v === '0' ? false : null;
  } catch { return null; }
}

/** Is auto-graphics on for this seat? URL override, else the seat pref (default off). */
export function autoGfxEnabled(): boolean {
  const u = urlOverride();
  if (u !== null) return u;
  try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
}

export function setAutoGfxEnabled(on: boolean): void {
  try { localStorage.setItem(PREF_KEY, on ? '1' : '0'); } catch { /* session-only */ }
}

/** The pane a graphic renders as: its label, the graphics accent, PGM tally. */
export function gfxWin(g: OnAirGraphic): Win {
  return { label: g.label, color: GFX_COLOR, tally: 'pgm', origin: g.via.join(' · ') };
}

/** Lay the wall out: routed wins first, then AUTO graphics, then empty cells.
 *  `cells` is the raster size (NxN) — graphics past it are not shown. */
export function wallCells<T>(wins: T[], gfx: OnAirGraphic[], cells: number): Array<{ win: T } | { gfx: OnAirGraphic } | null> {
  return Array.from({ length: cells }, (_, i) => {
    if (i < wins.length) return { win: wins[i]! };
    const g = gfx[i - wins.length];
    return g ? { gfx: g } : null;
  });
}

/** A read-only AUTO tile (no drag / tally cycle / UMD edit: the switcher owns it). */
export function gfxTile(g: OnAirGraphic, compact: boolean, videoScreen: (w: Win) => HTMLElement): HTMLElement {
  const w = gfxWin(g);
  const tile = el('div', { class: 'mv-win pgm mv-auto', title: `On air via ${w.origin}` });
  tile.draggable = false;
  if (compact) {
    tile.append(el('div', { class: 'mv-tile', textContent: `⬡ ${g.label}` }));
    return tile;
  }
  tile.append(
    el('span', { class: 'mv-tally', textContent: 'AUTO · GFX' }),
    videoScreen(w),
    el('div', { class: 'mv-umd', style: `--umd:${GFX_COLOR}`, textContent: `⬡ ${g.label} · ${w.origin}` }),
  );
  return tile;
}
