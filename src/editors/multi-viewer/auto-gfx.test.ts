// src/editors/multi-viewer/auto-gfx.test — auto-multiviewer wall layout.

import { describe, it, expect } from 'vitest';
import { autoGfxEnabled, gfxWin, wallCells } from './auto-gfx.js';

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

  it('renders a graphic as an on-air PGM pane captioned by where it rides', () => {
    expect(gfxWin(g('SW 21', 'DSK 3', 'M/E 1 KEY 1'))).toMatchObject({
      label: 'SW 21', tally: 'pgm', origin: 'DSK 3 · M/E 1 KEY 1',
    });
  });

  it('defaults off when there is no URL or storage (fail-soft)', () => {
    expect(autoGfxEnabled()).toBe(false);
  });
});
