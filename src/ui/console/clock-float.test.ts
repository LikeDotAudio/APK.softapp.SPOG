import { describe, it, expect } from 'vitest';
import { clamp, defaultState } from './clock-float.js';
import { ALL_FACES } from '../clock-faces/src/index.js';

describe('the floating clock window', () => {
  it('opens with three real faces', () => {
    const s = defaultState();
    expect(s.tiles).toHaveLength(3);
    for (const t of s.tiles) expect(ALL_FACES.some((f) => f.id === t.face)).toBe(true);
  });
  it('stays on screen whatever the viewport did', () => {
    const s = clamp({ ...defaultState(), x: 5000, y: -40, w: 9000, h: 10 }, 1280, 720);
    expect(s.w).toBe(1280);
    expect(s.h).toBe(150);
    expect(s.y).toBe(0);
    expect(s.x).toBeLessThanOrEqual(1280 - 120);
  });
});
