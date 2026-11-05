import { describe, it, expect } from 'vitest';
import { reading, push, windowOf, toCsv, stats, type Series } from './series.js';
import { pluginFor } from '../registry.js';

describe('data-logger series', () => {
  it('a reading is the number a meter said; an answer with words is not', () => {
    expect(reading('+1.23456789E-03')).toBeCloseTo(0.00123456789);
    expect(reading(' -4.2 ')).toBe(-4.2);
    expect(reading('Agilent Technologies,33210A,MY48000299,1.04-1.02-22-2')).toBeNull();
    expect(reading('+0,"No error"')).toBeNull();
    expect(reading('')).toBeNull();
  });
  it('a rolling window, its range, stats and the CSV of a run', () => {
    const s: Series = { key: 'usb:A', label: 'Keysight 34401A, bench', topic: 'x/Read', samples: [] };
    push(s, 1, 1000); push(s, 3, 2000); push(s, 2, 9000, 2);
    expect(s.samples.map((p) => p.v)).toEqual([3, 2]);
    // one flat point is padded 5% so the line is not on the frame
    expect(windowOf([s], 10_000, 5000)).toMatchObject({ lo: 1.9, hi: 2.1 });
    expect(stats(s, 0)).toMatchObject({ last: 2, min: 2, max: 3, n: 2 });
    const csv = toCsv([s]).split('\n');
    expect(csv[0]).toBe('time,meter,value');
    expect(csv[1]).toContain('"Keysight 34401A, bench",3');
  });
  it('LOGGER / GRAPH / TREND twists open the data logger', () => {
    expect(pluginFor('LOGGER 1')?.id).toBe('data-logger');
    expect(pluginFor('Trend')?.id).toBe('data-logger');
  });
});
