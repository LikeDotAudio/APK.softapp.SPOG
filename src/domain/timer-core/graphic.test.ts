import { describe, it, expect } from 'vitest';
import { viewForLabel, isTimerSnap, liveFrames, timerRows, toggleRun, resetSnap, type TimerSnap } from './graphic.js';

const snap = (o: Partial<TimerSnap> = {}): TimerSnap =>
  ({ running: false, valueFrames: 0, fps: 30, unix: 1_000_000, direction: 'up', ...o });

describe('timer graphic source', () => {
  it('maps the routed PRODUCTION TIMERS labels to channels', () => {
    expect(viewForLabel('TIMER ▸ A/B PANEL')).toEqual(['A', 'B']);
    expect(viewForLabel('TIMER A ▾ COUNT')).toEqual(['A']);
    expect(viewForLabel('TIMER B ▾ COUNT')).toEqual(['B']);
    expect(viewForLabel('SHOW CLOCK ▾ BACKTIME')).toEqual(['A', 'B']);
  });

  it('rejects malformed bus snapshots', () => {
    expect(isTimerSnap(snap())).toBe(true);
    expect(isTimerSnap(null)).toBe(false);
    expect(isTimerSnap({ ...snap(), fps: 29 })).toBe(false);
    expect(isTimerSnap({ ...snap(), valueFrames: NaN })).toBe(false);
    expect(isTimerSnap({ ...snap(), direction: 'sideways' })).toBe(false);
  });

  it('derives the live count from the stamp, in the channel direction', () => {
    expect(liveFrames(snap({ valueFrames: 30 }), 1_002_000)).toBe(30);                    // stopped: frozen
    expect(liveFrames(snap({ running: true }), 1_002_000)).toBe(60);                      // up 2s @30
    expect(liveFrames(snap({ running: true, direction: 'down', valueFrames: 90 }), 1_002_000)).toBe(30);
    expect(liveFrames(snap({ running: true, direction: 'down', valueFrames: 30 }), 1_009_000)).toBe(0);   // floors at 0
    expect(liveFrames(snap({ running: true }), 999_000)).toBe(0);                         // clock skew never runs backwards
  });

  it('paints dashes for a channel the editor has not published, never throws', () => {
    expect(timerRows(undefined, 'TIMER A ▾ COUNT', 0)).toEqual([{ id: 'A', text: '--:--:--', running: false, direction: null }]);
    expect(timerRows('garbage', 'TIMER ▸ A/B PANEL', 0).map((r) => r.text)).toEqual(['--:--:--', '--:--:--']);
    const rows = timerRows({ A: snap({ valueFrames: 30 * 65 }), B: { junk: 1 } }, 'TIMER ▸ A/B PANEL', 1_000_000);
    expect(rows.map((r) => r.text)).toEqual(['00:01:05', '--:--:--']);
  });

  it('counts OVERTIME up past zero instead of reading 00:00:00', () => {
    const over = snap({ running: true, direction: 'down', overtime: true, valueFrames: 30 });
    expect(liveFrames(over, 1_002_000)).toBe(90);
    expect(timerRows({ A: over }, 'TIMER A ▾ COUNT', 1_002_000)[0]).toMatchObject({ text: '00:00:03', overtime: true });
    expect(isTimerSnap({ ...over, overtime: 'yes' })).toBe(false);
  });

  it('stopping folds the elapsed run into valueFrames, so the count holds', () => {
    const running = snap({ running: true, valueFrames: 30 });
    const stopped = toggleRun(running, 1_002_000);
    expect(stopped).toMatchObject({ running: false, valueFrames: 90, unix: 1_002_000 });
    expect(liveFrames(stopped, 1_009_000)).toBe(90);
    expect(toggleRun(stopped, 1_009_000)).toMatchObject({ running: true, valueFrames: 90 });
    expect(resetSnap(snap({ valueFrames: 99, overtime: true }), 5)).toMatchObject({ valueFrames: 0, overtime: false, unix: 5 });
  });
});
