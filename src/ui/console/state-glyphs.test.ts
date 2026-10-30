// Unit tests for the STATE glyph resolver (pure — node env): the URL override, the
// seat mode, and `auto` following chroma/vision. applyStateGlyphs must never throw.
import { describe, it, expect } from 'vitest';
import { resolveStateGlyphs, urlGlyphOverride, isGlyphMode, applyStateGlyphs } from './state-glyphs.js';

const full = { vision: 'normal', chroma: 'full' } as const;

describe('urlGlyphOverride', () => {
  it('reads on/off spellings and ignores anything else', () => {
    expect(urlGlyphOverride('?glyphs=on')).toBe(true);
    expect(urlGlyphOverride('?x=1&glyphs=1')).toBe(true);
    expect(urlGlyphOverride('?glyphs=OFF')).toBe(false);
    expect(urlGlyphOverride('?glyphs=0')).toBe(false);
    expect(urlGlyphOverride('?glyphs=maybe')).toBeNull();
    expect(urlGlyphOverride('')).toBeNull();
  });
});

describe('resolveStateGlyphs', () => {
  it('auto leaves the default full-colour console unchanged', () => {
    expect(resolveStateGlyphs('auto', full)).toBe(false);
  });
  it('auto turns on wherever hue cannot carry state', () => {
    expect(resolveStateGlyphs('auto', { vision: 'normal', chroma: 'grey' })).toBe(true);
    expect(resolveStateGlyphs('auto', { vision: 'low', chroma: 'mono' })).toBe(true);
    expect(resolveStateGlyphs('auto', { vision: 'high', chroma: 'full' })).toBe(true);
    expect(resolveStateGlyphs('auto', { vision: 'low', chroma: 'full' })).toBe(false);
  });
  it('on/off pin the seat regardless of scheme', () => {
    expect(resolveStateGlyphs('on', full)).toBe(true);
    expect(resolveStateGlyphs('off', { vision: 'high', chroma: 'mono' })).toBe(false);
  });
  it('a junk stored mode falls back to auto', () => {
    expect(isGlyphMode('sometimes')).toBe(false);
    expect(resolveStateGlyphs('sometimes', full)).toBe(false);
    expect(resolveStateGlyphs(undefined, { vision: 'normal', chroma: 'grey' })).toBe(true);
  });
  it('the URL override beats the seat mode', () => {
    expect(resolveStateGlyphs('off', full, '?glyphs=on')).toBe(true);
    expect(resolveStateGlyphs('on', full, '?glyphs=off')).toBe(false);
  });
});

describe('applyStateGlyphs', () => {
  it('is fail-soft without a DOM (keeps going, never throws)', () => {
    expect(() => applyStateGlyphs({ vision: 'high', chroma: 'grey' })).not.toThrow();
  });
});
