// src/domain/timer-core/graphic — the RC1000 dual-timer as a GRAPHICS SOURCE.
//
// The TIMER editor (the RC1000-style keypad transport) publishes both channels to
// `destinations/<dest>/counters_timer` as a snapshot {A,B} of
// {running, valueFrames, fps, unix, direction}, stamped at the moment of the last
// key press. A routed PRODUCTION TIMERS feed paints its read-out on any preview
// surface from that snapshot; this module is the DOM-free half: which channel(s)
// a routed label shows, and the live count derived from a snapshot at `now`.
// Untrusted bus data is validated here, so a malformed snapshot reads as
// "waiting" (dashes) instead of throwing inside a render loop.

import { formatValue, type Direction, type Fps } from './index.js';

export type TimerChan = 'A' | 'B';
/** What one routed feed shows: one channel, both side by side. */
export type TimerView = TimerChan[];

export interface TimerSnap {
  running: boolean;
  valueFrames: number;
  fps: Fps;
  unix: number;          // ms epoch (time-sync clock) the value was stamped at
  direction: Direction;
}

export interface TimerRow { id: TimerChan; text: string; running: boolean; direction: Direction | null; }

/** The channels a routed label shows — "TIMER A ▾ COUNT" → [A], "TIMER B …" → [B],
 *  anything else ("TIMER ▸ A/B PANEL", "SHOW CLOCK ▾ BACKTIME") → both. */
export function viewForLabel(label: string): TimerView {
  const l = label.toUpperCase();
  if (/\bA\/B\b/.test(l)) return ['A', 'B'];
  if (/\bTIMER A\b|\bCHAN(NEL)? A\b/.test(l)) return ['A'];
  if (/\bTIMER B\b|\bCHAN(NEL)? B\b/.test(l)) return ['B'];
  return ['A', 'B'];
}

const FPS: ReadonlySet<number> = new Set([24, 25, 30]);

/** Type-guard one channel of a bus snapshot (anything off the wire is untrusted). */
export function isTimerSnap(v: unknown): v is TimerSnap {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return typeof s.running === 'boolean'
    && typeof s.valueFrames === 'number' && Number.isFinite(s.valueFrames)
    && typeof s.unix === 'number' && Number.isFinite(s.unix)
    && FPS.has(s.fps as number)
    && (s.direction === 'up' || s.direction === 'down');
}

/** The count at `nowMs`: the stamped value advanced by the elapsed run time in the
 *  channel's direction. A down count stops at zero (the graphic never goes negative). */
export function liveFrames(s: TimerSnap, nowMs: number): number {
  const elapsed = s.running ? Math.max(0, nowMs - s.unix) : 0;
  const d = Math.floor((elapsed / 1000) * s.fps);
  return Math.max(0, s.direction === 'down' ? s.valueFrames - d : s.valueFrames + d);
}

/** The rows a routed timer feed paints. `bus` is the raw counters_timer value
 *  (or undefined before the editor has ever published) — never throws. */
export function timerRows(bus: unknown, label: string, nowMs: number): TimerRow[] {
  const all = bus && typeof bus === 'object' ? bus as Record<string, unknown> : {};
  return viewForLabel(label).map((id) => {
    const s = all[id];
    if (!isTimerSnap(s)) return { id, text: '--:--:--', running: false, direction: null };
    return { id, text: formatValue(liveFrames(s, nowMs), 'hms', s.fps), running: s.running, direction: s.direction };
  });
}
