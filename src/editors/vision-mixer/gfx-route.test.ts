// src/editors/vision-mixer/gfx-route.test — the graphics→bus pre-router model.
//
// Locks the PRE-ROUTE matrix contract without a DOM: the hard-wired GFX feeds,
// the DSK (downstream) then delegated-M/E keyer (upstream) bus order, routing a
// graphic onto either kind of bus, and the list/matrix view choice.

import { describe, it, expect } from 'vitest';
import { DEFAULT_SWITCHER } from './schema.js';
import { newME } from './me.js';
import { gfxBuses, gfxFeeds, gfxName, prerouteView, routeGfx } from './gfx-route.js';
import type { SwitcherState } from './scenes.js';

const def = DEFAULT_SWITCHER;
const fresh = (): SwitcherState => ({ mes: [newME(def), newME(def), newME(def)], dsks: def.dsks.map(() => false), auxes: [] });

describe('graphics feeds', () => {
  it('GFX n is DSK n\'s hard-wired source (sources 19-24)', () => {
    expect(gfxFeeds(def)).toEqual([18, 19, 20, 21, 22, 23]);
    expect(gfxName(def, 20)).toBe('GFX 3');
    expect(gfxName(def, 0)).toBeNull();
  });
});

describe('pre-router buses', () => {
  it('lists the DSKs (downstream) then the delegated M/E\'s keyers (upstream)', () => {
    const buses = gfxBuses(def, fresh(), 1);
    expect(buses).toHaveLength(def.dsks.length + def.keyersPerMe);
    expect(buses[0]).toMatchObject({ stream: 'down', label: 'DSK 1', topic: 'dsk.1.source', source: 18 });
    expect(buses[def.dsks.length]).toMatchObject({ stream: 'up', label: 'M/E 2 KEY 1', topic: 'me.2.key.1.source' });
  });

  it('routes a graphic onto a DSK (dskSrc) without touching the defaults', () => {
    const st = fresh();
    const hit = routeGfx(def, st, 0, 0, 21);
    expect(hit).toMatchObject({ stream: 'down', source: 21 });
    expect(st.dskSrc?.[0]).toBe(21);
    expect(st.dskSrc?.[1]).toBe(19);
    expect(def.dsks[0]!.source).toBe(18);
  });

  it('routes a graphic onto an upstream M/E keyer of the delegated bank only', () => {
    const st = fresh();
    const hit = routeGfx(def, st, 2, def.dsks.length + 1, 22);
    expect(hit).toMatchObject({ stream: 'up', label: 'M/E 3 KEY 2', source: 22 });
    expect(st.mes[2]!.keyers[1]!.source).toBe(22);
    expect(st.mes[0]!.keyers[1]!.source).toBe(0);
  });

  it('ignores a row off the end instead of throwing', () => {
    expect(routeGfx(def, fresh(), 0, 99, 20)).toBeNull();
    expect(routeGfx(def, fresh(), 0, -1, 20)).toBeNull();
  });
});

describe('pre-route view', () => {
  it('defaults to the shipped LIST; stored or ?preroute= picks MATRIX, URL wins', () => {
    expect(prerouteView(null, 'http://x/')).toBe('list');
    expect(prerouteView('matrix', 'http://x/')).toBe('matrix');
    expect(prerouteView('matrix', 'http://x/#/vm?preroute=list')).toBe('list');
    expect(prerouteView(null, 'http://x/?preroute=matrix')).toBe('matrix');
  });
});
