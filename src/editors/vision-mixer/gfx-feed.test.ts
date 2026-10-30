// src/editors/vision-mixer/gfx-feed.test — auto-multiviewer: on-air graphics.

import { describe, it, expect } from 'vitest';
import { DEFAULT_SWITCHER } from './schema.js';
import { newME } from './me.js';
import { onAirGraphicsOf } from './gfx-feed.js';
import type { SwitcherState } from './scenes.js';

const def = DEFAULT_SWITCHER;
const fresh = (): SwitcherState => ({
  mes: Array.from({ length: def.mes }, (_, i) => newME(def, i + 1)),
  dsks: def.dsks.map(() => false),
  auxes: [],
  dskSrc: def.dsks.map((d) => d.source ?? 0),
});

describe('onAirGraphicsOf', () => {
  it('is empty with every DSK off and no graphics keyed', () => {
    expect(onAirGraphicsOf(def, fresh())).toEqual([]);
  });

  it('lists a DSK that is ON by its hard-wired graphic', () => {
    const st = fresh();
    st.dsks[0] = true;
    expect(onAirGraphicsOf(def, st)).toEqual([{ label: 'SW 19', via: ['DSK 1'] }]);
  });

  it('follows the PRE-ROUTE — even onto a non-graphics input', () => {
    const st = fresh();
    st.dsks[1] = true;
    st.dskSrc![1] = 4;
    expect(onAirGraphicsOf(def, st)).toEqual([{ label: 'SW 5', via: ['DSK 2'] }]);
  });

  it('adds upstream keyers and PGM buses only when they carry a graphic, merging vias', () => {
    const st = fresh();
    st.dsks[2] = true;                                      // DSK 3 → SW 21 (index 20)
    st.mes[0]!.keyers[0] = { on: true, type: 'linear', source: 20 };
    st.mes[0]!.keyers[1] = { on: true, type: 'linear', source: 3 };  // a camera: ignored
    st.mes[1]!.keyers[2] = { on: false, type: 'linear', source: 21 }; // off: ignored
    st.mes[2]!.pgm = 21;                                    // FULLSCREEN GFX
    expect(onAirGraphicsOf(def, st)).toEqual([
      { label: 'SW 21', via: ['DSK 3', 'M/E 1 KEY 1'] },
      { label: 'SW 22', via: ['M/E 3 PGM'] },
    ]);
  });
});
