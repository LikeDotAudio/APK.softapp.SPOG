// src/editors/multi-viewer/auto-gfx.test — auto-multiviewer wall layout.

import { describe, it, expect } from 'vitest';
import { autoGfxEnabled, gfxWin, wallCells, gfxOverflow, autoGfxCaption } from './auto-gfx.js';

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

  it('renders a graphic as an on-air PGM pane captioned by where it rides', () => {
    expect(gfxWin(g('SW 21', 'DSK 3', 'M/E 1 KEY 1'))).toMatchObject({
      label: 'SW 21', tally: 'pgm', origin: 'DSK 3 · M/E 1 KEY 1',
    });
  });

  it('defaults off when there is no URL or storage (fail-soft)', () => {
    expect(autoGfxEnabled()).toBe(false);
  });
});
