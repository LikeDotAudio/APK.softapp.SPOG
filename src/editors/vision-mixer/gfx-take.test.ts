// src/editors/vision-mixer/gfx-take.test — DSK preview arms + the faux-take set.
//
// Locks the pure contract under gfx-take-panel.ts: sets follow the PRE-ROUTE,
// arming toggles, a take flips each armed DSK only when its simulated fade lands,
// and a CUT (ms = 0) lands at once.

import { describe, it, expect } from 'vitest';
import { DEFAULT_SWITCHER } from './schema.js';
import { gfxSets, armDsk, armedDsks, beginTake, fadeLevel, settle, takeMsg, fadesFromTake, TAKE_STALE_MS } from './gfx-take.js';
import type { SwitcherState } from './scenes.js';

const def = DEFAULT_SWITCHER;
const fresh = (): SwitcherState => ({ mes: [], dsks: def.dsks.map(() => false), auxes: [] });

describe('graphics sets', () => {
  it('one named set per DSK, naming the graphic that feeds it', () => {
    const sets = gfxSets(def, fresh());
    expect(sets).toHaveLength(def.dsks.length);
    expect(sets[0]).toMatchObject({ id: 'gfx-1', dsk: 0, source: 18, name: 'DSK 1 · SW 19' });
  });
  it('follows a PRE-ROUTE override', () => {
    const st = { ...fresh(), dskSrc: [2, 19, 20, 21, 22, 23] };
    expect(gfxSets(def, st)[0]).toMatchObject({ source: 2, name: 'DSK 1 · SW 3' });
  });
});

describe('DSK preview + take', () => {
  it('arming toggles and lists in order', () => {
    const st = fresh();
    expect(armDsk(st, 2)).toBe(true);
    armDsk(st, 0);
    expect(armedDsks(st)).toEqual([0, 2]);
    expect(armDsk(st, 2)).toBe(false);
    expect(armedDsks(st)).toEqual([0]);
  });

  it('a take fades armed DSKs on air only when the fade lands, and clears the arms', () => {
    const st = fresh();
    st.dsks[1] = true;
    armDsk(st, 0); armDsk(st, 1);
    const fades = beginTake(st, 1000, 500);
    expect(armedDsks(st)).toEqual([]);
    expect(fades.map((f) => f.to)).toEqual([true, false]);   // 1 was up → takes off
    expect(fadeLevel(fades[0]!, 1250)).toBe(0.5);
    let r = settle(st, fades, 1250);
    expect(r.live).toHaveLength(2);
    expect(st.dsks[0]).toBe(false);
    r = settle(st, r.live, 1500);
    expect(r.done).toHaveLength(2);
    expect(st.dsks[0]).toBe(true);
    expect(st.dsks[1]).toBe(false);
  });

  it('a CUT (ms = 0) lands at once; nothing armed takes nothing', () => {
    const st = fresh();
    expect(beginTake(st, 0, 300)).toEqual([]);
    armDsk(st, 3);
    const { done } = settle(st, beginTake(st, 0, 0), 0);
    expect(done).toHaveLength(1);
    expect(st.dsks[3]).toBe(true);
  });

  it('ignores arms past the DSK count', () => {
    const st = fresh();
    armDsk(st, 99);
    expect(armedDsks(st)).toEqual([]);
  });
});

describe('a take on the bus (ROAD-3447)', () => {
  it('the taking seat writes which DSKs fade to what, and another seat runs the same fade', () => {
    const mine = fresh();
    armDsk(mine, 0); armDsk(mine, 3);
    mine.dsks[3] = true;
    const begun = beginTake(mine, 100, 800);
    const msg = takeMsg(begun, 1_000_000);
    expect(msg).toEqual({ sets: [{ dsk: 0, to: true }, { dsk: 3, to: false }], ms: 800, at: 1_000_000 });

    const theirs = fresh();
    theirs.dsks[3] = true;
    const fades = fadesFromTake(JSON.parse(JSON.stringify(msg)), def.dsks.length, 1_000_050, 5000);
    expect(fades).toEqual([{ dsk: 0, to: true, t0: 5000, ms: 800, remote: true }, { dsk: 3, to: false, t0: 5000, ms: 800, remote: true }]);
    const { done } = settle(theirs, fades, 5800);
    expect(done.every((f) => f.remote)).toBe(true);
    expect(theirs.dsks[0]).toBe(true);
    expect(theirs.dsks[3]).toBe(false);
  });
  it('ignores a stale retained take, an unknown DSK and garbage', () => {
    const msg = { sets: [{ dsk: 0, to: true }], ms: 0, at: 0 };
    expect(fadesFromTake(msg, def.dsks.length, TAKE_STALE_MS + 1, 0)).toEqual([]);
    expect(fadesFromTake({ ...msg, sets: [{ dsk: 99, to: true }] }, def.dsks.length, 0, 0)).toEqual([]);
    expect(fadesFromTake('nope', def.dsks.length, 0, 0)).toEqual([]);
    expect(fadesFromTake(null, def.dsks.length, 0, 0)).toEqual([]);
  });
});
