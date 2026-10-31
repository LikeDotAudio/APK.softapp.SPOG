// src/editors/multi-viewer/auto-gfx.test — auto-multiviewer wall layout.

import { describe, it, expect } from 'vitest';
import { autoGfxEnabled, gfxWin, wallCells, gfxOverflow, autoGfxCaption, autoGfxReserve, routedCells, reserveCaption } from './auto-gfx.js';

const g = (label: string, ...via: string[]) => ({ label, via });

describe('auto-gfx', () => {
  it('fills spare cells after the routed wins, then leaves the rest empty', () => {
    expect(wallCells(['A', 'B'], [g('SW 19', 'DSK 1')], 4)).toEqual([
      { win: 'A' }, { win: 'B' }, { gfx: g('SW 19', 'DSK 1') }, null,
    ]);
  });

  it('never displaces a routed win; graphics past the raster are not shown', () => {
    expect(wallCells(['A', 'B'], [g('SW 19'), g('SW 20')], 2)).toEqual([{ win: 'A' }, { win: 'B' }]);
  });

  it('counts the graphics a full raster has no cell for (9 sources on 3×3)', () => {
    expect(gfxOverflow(9, 2, 9)).toBe(2);
    expect(gfxOverflow(7, 3, 9)).toBe(1);
    expect(gfxOverflow(2, 1, 4)).toBe(0);
    expect(gfxOverflow(12, 1, 9)).toBe(1);
    expect(autoGfxCaption(2)).toBe('⬡ AUTO GFX · +2 OFF WALL');
    expect(autoGfxCaption(0)).toBe('⬡ AUTO GFX');
  });

  it('a reservation holds the last cells for graphics on a full raster (ROAD-3447)', () => {
    const wins = ['A', 'B', 'C', 'D'];
    expect(wallCells(wins, [g('SW 19', 'DSK 1')], 4, 1)).toEqual([{ win: 'A' }, { win: 'B' }, { win: 'C' }, { gfx: g('SW 19', 'DSK 1') }]);
    expect(gfxOverflow(4, 1, 4, 1)).toBe(0);
    expect(gfxOverflow(4, 1, 4, 0)).toBe(1);
    // A reserved cell with nothing on air stays empty rather than reshuffling the wall.
    expect(wallCells(wins, [], 4, 2)).toEqual([{ win: 'A' }, { win: 'B' }, null, null]);
    // Spare cells still count: 2 routed on 3×3 with RSV 1 leaves 7 for graphics.
    expect(routedCells(2, 9, 1)).toBe(2);
    expect(gfxOverflow(2, 8, 9, 1)).toBe(1);
    expect(routedCells(9, 9, 4)).toBe(5);
    expect(reserveCaption(4, 4)).toBe('RSV 4 · −4 ROUTED');
    expect(reserveCaption(0, 0)).toBe('RSV 0');
    expect(autoGfxReserve()).toBe(0);   // no storage in node → no reservation
  });

  it('renders a graphic as an on-air PGM pane captioned by where it rides', () => {
    expect(gfxWin(g('SW 21', 'DSK 3', 'M/E 1 KEY 1'))).toMatchObject({
      label: 'SW 21', tally: 'pgm', origin: 'DSK 3 · M/E 1 KEY 1',
    });
  });

  it('defaults off when there is no URL or storage (fail-soft)', () => {
    expect(autoGfxEnabled()).toBe(false);
  });
});
