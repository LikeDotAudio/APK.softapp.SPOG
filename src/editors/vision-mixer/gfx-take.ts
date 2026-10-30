// src/editors/vision-mixer/gfx-take — DSK preview + the faux-take graphics "set" (pure, no DOM).
//
// A real switcher lets the operator ARM a downstream key on preview, look at it, and
// take it to program with the next transition. Here every graphic feeding a DSK is a
// takeable named SET: arming puts it on the preview monitor, TAKE GFX runs a
// simulated (front-end only) fade, and the DSK goes on air — or off, if it was
// already up — when the fade lands. Arms are transient: they are not part of a
// scene and are never sent to the bus. gfx-take-panel.ts is the DOM over this.

import type { SwitcherDef } from '../../model/index.js';
import { srcLabel } from './me.js';
import type { SwitcherState } from './scenes.js';

/** One graphic as a takeable named scene: the graphic feeding DSK `dsk`. */
export interface GfxSet { id: string; name: string; dsk: number; source: number; }

/** An in-flight simulated take on one DSK: fading to `to` over `ms` from `t0`. */
export interface GfxFade { dsk: number; to: boolean; t0: number; ms: number; }

/** Every graphic on the DSKs as a named set, following the PRE-ROUTE overrides. */
export function gfxSets(def: SwitcherDef, state: SwitcherState): GfxSet[] {
  return def.dsks.map((d, i) => {
    const source = state.dskSrc?.[i] ?? d.source ?? 0;
    const head = d.name.split('·')[0]!.trim();
    return { id: `gfx-${i + 1}`, name: `${head} · ${srcLabel(source, def)}`, dsk: i, source };
  });
}

/** Toggle DSK i's preview arm. Returns the new arm state. */
export function armDsk(state: SwitcherState, i: number): boolean {
  const pvw = (state.dskPvw ??= []);
  pvw[i] = !pvw[i];
  return pvw[i]!;
}

/** The DSK indices armed on preview, in order. */
export function armedDsks(state: SwitcherState): number[] {
  return (state.dskPvw ?? []).flatMap((on, i) => (on && i < state.dsks.length ? [i] : []));
}

/** Start a take of every armed DSK: each fades to the opposite of its on-air state.
 *  Clears the arms; `state.dsks` changes only when the fade settles. */
export function beginTake(state: SwitcherState, now: number, ms: number): GfxFade[] {
  const fades = armedDsks(state).map((dsk) => ({ dsk, to: !state.dsks[dsk], t0: now, ms: Math.max(0, ms) }));
  state.dskPvw = [];
  return fades;
}

/** Fade progress 0..1 (a CUT, ms = 0, is already complete). */
export function fadeLevel(f: GfxFade, now: number): number {
  return f.ms <= 0 ? 1 : Math.max(0, Math.min(1, (now - f.t0) / f.ms));
}

/** Land every finished fade onto `state.dsks`; returns the finished and the still-running. */
export function settle(state: SwitcherState, fades: GfxFade[], now: number): { done: GfxFade[]; live: GfxFade[] } {
  const done: GfxFade[] = [];
  const live: GfxFade[] = [];
  for (const f of fades) {
    if (fadeLevel(f, now) >= 1) { if (f.dsk < state.dsks.length) state.dsks[f.dsk] = f.to; done.push(f); }
    else live.push(f);
  }
  return { done, live };
}
