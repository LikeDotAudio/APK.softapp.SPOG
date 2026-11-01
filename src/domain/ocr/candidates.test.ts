// src/domain/ocr/candidates.test — identity values found by SHAPE in OCR text, and
// only what the text says (ROAD-3475).
import { describe, it, expect } from 'vitest';
import { extractCandidates, canonicalMac } from './candidates.js';
import { correctWord, pageLines, type OcrPage } from './ocr-page.js';

/** A page from lines of text: one word box per token, laid out left to right. */
function page(...lines: string[]): OcrPage {
  let n = 0;
  const words = lines.flatMap((l, line) => l.split(/\s+/).filter(Boolean).map((text, k) =>
    ({ id: `w${++n}`, text, confidence: 90, line, x0: k * 100, y0: line * 40, x1: k * 100 + 90, y1: line * 40 + 30 })));
  return { width: 1000, height: 400, words };
}
const simple = (p: OcrPage) => extractCandidates(p).map(({ kind, value, labelled }) => ({ kind, value, labelled }));

describe('extractCandidates', () => {
  it('reads a labelled serial, MAC and asset tag, and leaves the model number and ratings alone', () => {
    const p = page('RACK B U12 DSP-8800', 'S/N: KX7R-24918', 'MAC: 00:1d:c1:4a:7f:22', 'ASSET TAG: AT-004512', 'Made in Canada 48V 2.5A');
    expect(simple(p)).toEqual([
      { kind: 'serial', value: 'KX7R-24918', labelled: true },
      { kind: 'mac', value: '00:1D:C1:4A:7F:22', labelled: true },
      { kind: 'asset_tag', value: 'AT-004512', labelled: true },
    ]);
  });
  it('keeps the word boxes each value came from', () => {
    const p = page('S/N: KX7R-24918');
    expect(extractCandidates(p)[0]!.wordIds).toEqual(['w2']);
  });
  it('a bare MAC and a bare asset-tag shape are offered, as shape only', () => {
    expect(simple(page('eth0 0001.C14A.7F22', 'PROPERTY OF ACME', 'IT-0098812'))).toEqual([
      { kind: 'mac', value: '00:01:C1:4A:7F:22', labelled: false },
      { kind: 'asset_tag', value: 'IT-0098812', labelled: false },
    ]);
  });
  it('a label needs a separator: SERVICE is not "SER" + "VICE"', () => {
    expect(simple(page('SERVICE MANUAL INSIDE'))).toEqual([]);
  });
  it('a page with no identity offers nothing (never a guess)', () => {
    expect(extractCandidates(page('48V 2.5A', 'Made in Canada'))).toEqual([]);
    expect(extractCandidates({ width: 10, height: 10, words: [] })).toEqual([]);
  });
  it('an inline correction changes what is offered; the engine reading is kept beside it', () => {
    const misread = page('S/N: KX7R-2491B');
    expect(simple(misread)[0]!.value).toBe('KX7R-2491B');
    const fixed = correctWord(misread, 'w2', 'KX7R-24918');
    expect(simple(fixed)[0]!.value).toBe('KX7R-24918');
    expect(fixed.words[1]).toMatchObject({ text: 'KX7R-2491B', corrected: 'KX7R-24918' });
    expect(correctWord(fixed, 'w2', 'KX7R-2491B').words[1]!.corrected).toBeUndefined();
    expect(pageLines(fixed)[0]!.text).toBe('S/N: KX7R-24918');
  });
  it('canonicalMac wants exactly twelve hex digits', () => {
    expect(canonicalMac('001d.c14a.7f22')).toBe('00:1D:C1:4A:7F:22');
    expect(canonicalMac('00:1D:C1:4A:7F')).toBeNull();
  });
});
