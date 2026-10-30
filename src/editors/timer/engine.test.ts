// TimerEngine.adopt — a validated remote snapshot lands on the channel silently
// (no onChange → no re-publish, so two seats cannot ping-pong the snapshot).
import { describe, it, expect } from 'vitest';
import { TimerEngine } from './engine.js';

describe('TimerEngine.adopt', () => {
  it('adopts run/value/direction/overtime without firing onChange', () => {
    let changes = 0;
    const e = new TimerEngine({ onChange: () => { changes++; }, onLog: () => {}, onGpi: () => {} });
    e.adopt('B', { running: true, valueFrames: 900, fps: 30, unix: 0, direction: 'down', overtime: true });
    const b = e.state.channels.B;
    expect([b.running, b.value, b.direction, b.overtime]).toEqual([true, 900, 'down', true]);
    expect(e.state.channels.A.value).toBe(0);
    expect(changes).toBe(0);
  });
});
