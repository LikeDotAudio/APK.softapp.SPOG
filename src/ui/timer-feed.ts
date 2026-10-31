// src/ui/timer-feed — a routed PRODUCTION TIMERS feed, painted on any preview surface.
//
// The RC1000 read-out (timer-graphic.ts) of a destination's counters_timer
// snapshot, for whichever surface carries the feed: the room MONITOR, a
// multiviewer pane (via the test-card wall) or the switcher's PGM/PVW
// (ROAD-3448). drawFauxSignal calls this first for a timer feed and falls back to
// the person-in-a-room picture when it returns false.
//
// `?timergfx=off` (or 0) keeps every routed timer on the faux signal — the
// rollback switch. A paint that throws logs once and returns false.

import { timerRows } from '../domain/timer-core/graphic.js';
import { drawTimerGraphic } from './timer-graphic.js';
import { timeSync } from '../platform/time-sync.js';

// The counters store lives in ui/console/dest-fixtures-counters, which needs a DOM
// at import; it registers its reader here instead of every surface importing it.
let snapshotOf: (destId: string) => unknown = () => undefined;
/** Where a destination's raw counters_timer snapshot is read from (set once at load). */
export function setTimerSnapshotSource(fn: (destId: string) => unknown): void { snapshotOf = fn; }

/** Is the timer graphic on? (`?timergfx=off|0|false` turns it off.) */
export const timerGfxOn = (): boolean => {
  try { return !/^(off|0|false)$/i.test(new URLSearchParams(location.search).get('timergfx') ?? ''); } catch { return true; }
};

let warned = false;

/** Paint destination `destId`'s timers for the routed `label`. False = not painted. */
export function paintTimerFeed(cvs: HTMLCanvasElement, destId: string, label: string): boolean {
  if (!timerGfxOn()) return false;
  try {
    drawTimerGraphic(cvs, timerRows(snapshotOf(destId), label, timeSync.now()));
    return true;
  } catch (e) {
    if (!warned) { warned = true; console.warn('[timer-feed] timer graphic failed; showing the faux signal', e); }
    return false;
  }
}
