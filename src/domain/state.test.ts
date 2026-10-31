import { describe, it, expect } from 'vitest';
import { STATE_TONES, STATE_WORDS, TONE_GLYPHS, TONE_NAMES, toneOf } from './state.js';

describe('domain/state — the contract state vocabulary', () => {
  it('carries the contract tones', () => {
    expect(STATE_TONES.good.hex).toBe('#2ea043');
    expect(STATE_TONES.dead.hex).toBe('#f85149');
    expect(STATE_TONES.kinda.hex).toBe('#d29922');
  });
  it('every word maps to a tone that has a glyph', () => {
    for (const w of Object.keys(STATE_WORDS)) expect(TONE_NAMES).toContain(toneOf(w));
    for (const t of TONE_NAMES) expect(TONE_GLYPHS[t]).toBeTruthy();
    expect(new Set(Object.values(TONE_GLYPHS)).size).toBe(3);
  });
  it('reads words case-insensitively and defaults the unknown to kinda', () => {
    expect(toneOf('Online')).toBe('good');
    expect(toneOf('offline')).toBe('dead');
    expect(toneOf('no such word')).toBe('kinda');
  });
});
