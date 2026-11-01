// src/domain/scan/scan-guard.test — a label held in view, or the same tag in a
// burst of photos, is exactly one scan event (ROAD-3476).
import { describe, it, expect } from 'vitest';
import { ScanGuard, REPEAT_WINDOW_MS, MAX_REMEMBERED } from './scan-guard.js';

describe('ScanGuard', () => {
  it('a code held in front of the camera for 10 s at 6 fps fires once', () => {
    const g = new ScanGuard();
    let events = 0;
    for (let t = 0; t <= 10_000; t += 166) if (g.admit('SN-1', t)) events++;
    expect(events).toBe(1);
  });

  it('a burst import of the same tag in five photos fires once', () => {
    const g = new ScanGuard();
    const fired = [0, 40, 95, 130, 300].filter((t) => g.admit('ASSET-0042117', t));
    expect(fired).toEqual([0]);
  });

  it('a different label inside the window is always a new scan (walking a rack)', () => {
    const g = new ScanGuard();
    expect(['A', 'B', 'C', 'A'].map((c, i) => g.admit(c, i * 100))).toEqual([true, true, true, false]);
  });

  it('measures the window from the LAST sighting, then lets a deliberate re-scan through', () => {
    const g = new ScanGuard();
    expect(g.admit('X', 0)).toBe(true);
    expect(g.admit('X', REPEAT_WINDOW_MS - 1)).toBe(false);
    expect(g.admit('X', 2 * REPEAT_WINDOW_MS - 2)).toBe(false);   // still in view: window slid
    expect(g.admit('X', 4 * REPEAT_WINDOW_MS)).toBe(true);        // taken away and brought back
  });

  it('trims, ignores empty text, forgets and clears', () => {
    const g = new ScanGuard();
    expect(g.admit('  ', 0)).toBe(false);
    expect(g.admit(' K ', 0)).toBe(true);
    expect(g.admit('K', 10)).toBe(false);
    g.forget('K');
    expect(g.admit('K', 20)).toBe(true);
    g.clear();
    expect(g.admit('K', 30)).toBe(true);
  });

  it('stays bounded — evicting only ever admits', () => {
    const g = new ScanGuard();
    g.admit('first', 0);
    for (let i = 0; i < MAX_REMEMBERED; i++) g.admit(`c${i}`, 1);
    expect(g.admit('first', 2)).toBe(true);
  });
});
