// ROAD-3479 — the identity line a device card shows (serial / asset tag / MAC).
// Pure part only; the painting is checked in the browser.
import { describe, it, expect } from 'vitest';
import { identityText } from './identity-line.js';

describe('identityText', () => {
  it('names what the card records, in label order', () => {
    expect(identityText({ serial: ' 12345 ', asset_tag: 'A-7', mac: '00:1D:C1:12:34:56' }))
      .toBe('S/N 12345 · TAG A-7 · MAC 00:1D:C1:12:34:56');
    expect(identityText({ asset_tag: 'A-7' })).toBe('TAG A-7');
  });

  it("falls back to a discovered device's own serial and MAC", () => {
    expect(identityText({ device: { serial: 'D9', mac: 'aa:bb' } })).toBe('S/N D9 · MAC aa:bb');
    expect(identityText({ serial: 'CARD', device: { serial: 'D9' } })).toBe('S/N CARD');
  });

  it('is empty when nothing is known', () => {
    for (const v of [null, 'x', [], {}, { serial: '  ' }, { serial: 7 }]) expect(identityText(v)).toBe('');
  });
});
