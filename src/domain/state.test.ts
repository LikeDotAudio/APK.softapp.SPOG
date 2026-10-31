import { describe, it, expect } from 'vitest';
import { STATE_TONES, STATE_WORDS, TONE_GLYPHS, TONE_NAMES, toneOf } from './state.js';
// @ts-expect-error TS7016 — untyped vendored ES module (the contract's browser build)
import { STATE_TONES as CONTRACT } from '../vendor/apk-contracts/apk-contracts.mjs';

describe('domain/state — the contract state vocabulary', () => {
  it('carries the contract tones', () => {
    // Read from the vendored contract, never spelled here (check.sh brand counts state hex).
    for (const t of ['good', 'dead', 'kinda'] as const) {
      expect(STATE_TONES[t].hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(STATE_TONES[t].hex).toBe((CONTRACT as Record<string, { hex: string }>)[t]!.hex);
    }
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
