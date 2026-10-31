// src/editors/multi-viewer/auto-gfx — auto-multiviewer graphics tiles.
//
// Roadmap §2: any graphic on a DSK / the switcher automatically lands in a
// multiviewer tile, monitored without a manual route. The vision mixer announces
// its on-air graphics on platform/gfx-monitor (per production); when this seat
// opts in, the wall fills its spare cells with one read-only AUTO tile per graphic
// (always PGM tally — it is on air). Opt-in per seat (the ⬡ AUTO GFX preset-bar
// toggle) or per URL (`?automv=1` forces on, `?automv=0` forces off), so walls
// that never asked for it are unchanged. A seat can also RESERVE cells for them
// (the RSV button, ROAD-3447): the last N cells of the raster belong to AUTO tiles
// even when routed panes would fill the wall, so a full raster still shows the
// graphic instead of `+N OFF WALL`. The set itself arrives over the bus from any
// seat's switcher (platform/gfx-monitor).

import { el } from '../../ui/dom.js';
import { hint } from '../../ui/tip.js';
import type { OnAirGraphic } from '../../platform/gfx-monitor.js';
import type { Win } from './panes.js';
import { PAL } from '../../domain/palette.js';

// Under the seat's `twist.vm.` prefix so seat export/import carries it.
const PREF_KEY = 'twist.vm.mvAutoGfx';
const RESERVE_KEY = 'twist.vm.mvAutoGfxReserve';
/** The RSV button's cycle: how many cells this seat holds for AUTO tiles. */
export const RESERVE_STEPS = [0, 1, 2, 4] as const;
const GFX_COLOR = PAL.amber50s100;

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

/** Cells this seat reserves for AUTO tiles (seat pref, default 0 = only spare cells). */
export function autoGfxReserve(): number {
  try { const n = Number(localStorage.getItem(RESERVE_KEY)); return (RESERVE_STEPS as readonly number[]).includes(n) ? n : 0; }
  catch { return 0; }
}

/** Step the reservation to the next RSV value, store it, and return it. */
export function cycleAutoGfxReserve(current: number): number {
  const i = (RESERVE_STEPS as readonly number[]).indexOf(current);
  const next = RESERVE_STEPS[(i + 1) % RESERVE_STEPS.length]!;
  try { localStorage.setItem(RESERVE_KEY, String(next)); } catch { /* session-only */ }
  return next;
}

/** How many routed panes the raster shows once `reserve` cells are held for graphics. */
export const routedCells = (wins: number, cells: number, reserve = 0): number =>
  Math.min(wins, Math.max(0, cells - Math.min(reserve, cells)));

/** The pane a graphic renders as: its label, the graphics accent, PGM tally. */
export function gfxWin(g: OnAirGraphic): Win {
  return { label: g.label, color: GFX_COLOR, tally: 'pgm', origin: g.via.join(' · ') };
}

/** Lay the wall out: routed wins first, then AUTO graphics, then empty cells.
 *  `cells` is the raster size (NxN) — graphics past it are not shown. Routed wins
 *  keep their cells, except the last `reserve` cells, which are held for graphics. */
export function wallCells<T>(wins: T[], gfx: OnAirGraphic[], cells: number, reserve = 0): Array<{ win: T } | { gfx: OnAirGraphic } | null> {
  const shown = routedCells(wins.length, cells, reserve);
  return Array.from({ length: cells }, (_, i) => {
    if (i < shown) return { win: wins[i]! };
    const g = gfx[i - shown];
    return g ? { gfx: g } : null;
  });
}

/** How many on-air graphics the raster has no cell for. The wall shows this
 *  count rather than dropping them silently. */
export function gfxOverflow(wins: number, gfx: number, cells: number, reserve = 0): number {
  return Math.max(0, gfx - (cells - routedCells(wins, cells, reserve)));
}

/** The ⬡ AUTO GFX button caption: names the graphics that did not fit. */
export function autoGfxCaption(hidden: number): string {
  return hidden > 0 ? `⬡ AUTO GFX · +${hidden} OFF WALL` : '⬡ AUTO GFX';
}

/** The RSV button caption: the reservation, and the routed panes it pushed off the wall. */
export function reserveCaption(reserve: number, routedHidden: number): string {
  return `RSV ${reserve}${routedHidden > 0 ? ` · −${routedHidden} ROUTED` : ''}`;
}

/** The RSV preset-bar button (caption set by the wall's draw). */
export function reserveButton(): HTMLElement {
  const b = el('div', { class: 'mv-pbtn mv-autobtn mv-rsvbtn' });
  hint(b, `Reserve the last cells of the wall for on-air graphics (click to step ${RESERVE_STEPS.join(' · ')})`);
  return b;
}

/** A read-only AUTO tile (no drag / tally cycle / UMD edit: the switcher owns it). */
export function gfxTile(g: OnAirGraphic, compact: boolean, videoScreen: (w: Win) => HTMLElement): HTMLElement {
  const w = gfxWin(g);
  const tile = el('div', { class: 'mv-win pgm mv-auto' });
  hint(tile, `On air via ${w.origin}`);
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
