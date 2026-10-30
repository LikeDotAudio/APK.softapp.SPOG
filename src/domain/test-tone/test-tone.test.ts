import { describe, it, expect } from 'vitest';
import { toneFor, toneGateAt, identGaps, dbToGain, LINEUP_HZ, LINEUP_DBFS } from './index.js';
import { identFor } from '../test-card/ident.js';

describe('test-tone', () => {
  it('every source shares the EBU R68 line-up', () => {
    for (const l of ['CAM 1', 'VT A', 'SAT RX 3']) {
      const t = toneFor(l);
      expect(t.freqHz).toBe(LINEUP_HZ);
      expect(t.levelDbfs).toBe(LINEUP_DBFS);
    }
    expect(dbToGain(-18)).toBeCloseTo(0.1259, 3);
  });

  it('ident cadence is deterministic and keyed on the test-card number', () => {
    const t = toneFor('CAM 1');
    expect(toneFor('CAM 1')).toEqual(t);
    expect(t.blips).toBe(((identFor('CAM 1').num - 1) % 4) + 1);
    expect(t.blips).toBeGreaterThanOrEqual(1);
    expect(t.blips).toBeLessThanOrEqual(4);
  });

  it('left drops out in the ident gaps; right runs continuous', () => {
    const t = { ...toneFor('X'), blips: 3, blipMs: 250, cycleMs: 4000 };
    expect(identGaps(t)).toEqual([[0, 250], [500, 750], [1000, 1250]]);
    expect(toneGateAt(t, 100, 'L')).toBe(0);
    expect(toneGateAt(t, 300, 'L')).toBe(1);
    expect(toneGateAt(t, 1100, 'L')).toBe(0);
    expect(toneGateAt(t, 1600, 'L')).toBe(1);
    expect(toneGateAt(t, 4100, 'L')).toBe(0); // next cycle
    expect(toneGateAt(t, 100, 'R')).toBe(1);
  });

  it('a faulted source is silent on both legs', () => {
    const t = toneFor('CAM 1', { faulted: true });
    expect(toneGateAt(t, 2000, 'L')).toBe(0);
    expect(toneGateAt(t, 2000, 'R')).toBe(0);
  });
});
