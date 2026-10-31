// src/domain/colour-resolve.test — the modes' maths against what Chrome painted (ROAD-3456).
// The vectors below were read off headless Chrome 154 screenshots of swatches under lcars.css's
// old root filter; across all 612 palette colours × these six modes the function matched every
// pixel exactly (0 of 3,672 off by even one level), so the filter could retire.
import { describe, it, expect } from 'vitest';
import { resolveColour, parseColour, hslColour, type Mode } from './colour-resolve.js';

const MODES: Record<string, Mode> = {
  grey: { chroma: 'grey', vision: 'normal' },
  mono: { chroma: 'mono', vision: 'normal', monoHue: -8 },
  high: { chroma: 'full', vision: 'high' },
  low: { chroma: 'full', vision: 'low' },
  monolow: { chroma: 'mono', vision: 'low', monoHue: -8 },
  greyhigh: { chroma: 'grey', vision: 'high' },
};
const CHROME: Record<string, Record<string, string>> = {
  '#ff0000': { grey: '#363636', mono: '#664117', high: '#ff0000', low: '#a70909', monolow: '#493218', greyhigh: '#303030' },
  '#00ffff': { grey: '#c9c9c9', mono: '#fffb52', high: '#00ffff', low: '#13b2b2', monolow: '#b4b249', greyhigh: '#e8e8e8' },
  '#4d94ff': { grey: '#8d8d8d', mono: '#ffa93b', high: '#4da6ff', low: '#3f6bad', monolow: '#b07b36', greyhigh: '#9d9d9d' },
  '#ffffff': { grey: '#ffffff', mono: '#ffffdb', high: '#ffffff', low: '#b5b5b5', monolow: '#b5b59f', greyhigh: '#ffffff' },
  '#12100a': { grey: '#101010', mono: '#1e1307', low: '#11100c' },
};

describe('resolveColour (ROAD-3456)', () => {
  for (const [hex, want] of Object.entries(CHROME)) {
    for (const [mode, out] of Object.entries(want)) {
      it(`${hex} under ${mode} paints ${out}, as Chrome's filter did`, () => expect(resolveColour(hex, MODES[mode]!)).toBe(out));
    }
  }
  it('full colour at normal vision is the identity, whatever the spelling', () => {
    for (const c of ['#abc', 'rgba(1,2,3,.5)', 'red', 'var(--x)']) expect(resolveColour(c, { chroma: 'full', vision: 'normal' })).toBe(c);
  });
  it('keeps alpha and reads rgb()/rgba() in either syntax', () => {
    expect(resolveColour('rgba(255, 0, 0, 0.5)', MODES.grey!)).toBe('rgba(54, 54, 54, 0.5)');
    expect(resolveColour('rgb(255 0 0 / 50%)', MODES.grey!)).toBe('rgba(54, 54, 54, 0.5)');
    expect(resolveColour('#f00', MODES.grey!)).toBe('#363636');
    expect(parseColour('#ff000080')).toEqual([255, 0, 0, 128 / 255]);
  });
  it('hslColour spells a computed hue as a literal the modes read (ROAD-3463)', () => {
    expect(hslColour(0, 100, 50)).toBe('#ff0000');
    expect(hslColour(120, 100, 25)).toBe('#008000');
    expect(hslColour(-150, 100, 50)).toBe(hslColour(210, 100, 50));
    expect(hslColour(200, 0, 40, 0.5)).toBe('rgba(102, 102, 102, 0.5)');
  });
  it('leaves what it cannot read alone (names, gradients, var())', () => {
    for (const c of ['red', 'var(--pal-x)', 'linear-gradient(red, blue)']) expect(resolveColour(c, MODES.grey!)).toBe(c);
  });
});
