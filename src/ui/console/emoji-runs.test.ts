// src/ui/console/emoji-runs.test — where the colour-emoji glyphs are, so each run gets its own
// filtered span and the element's resolved paint is never filtered twice (ROAD-3464).
import { describe, it, expect } from 'vitest';
import { emojiRuns, presentsAsEmoji } from './emoji-runs.js';

const cut = (t: string, isColour?: (c: string) => boolean): string[] => emojiRuns(t, isColour).map(([s, e]) => t.slice(s, e));

describe('emojiRuns', () => {
  it('finds each run of adjacent colour clusters and leaves the words out', () => {
    expect(cut('🎤 MIC 🎥🔴 CAM')).toEqual(['🎤', '🎥🔴']);
  });
  it('keeps a cluster whole: ZWJ joins, skin tones, flags, keycaps, U+FE0F', () => {
    expect(cut('a👩‍💻b')).toEqual(['👩‍💻']);
    expect(cut('✋🏽')).toEqual(['✋🏽']);
    expect(cut('🇨🇦!')).toEqual(['🇨🇦']);
    expect(cut('1️⃣ go')).toEqual(['1️⃣']);
    expect(cut('ℹ️ info')).toEqual(['ℹ️']);
  });
  it('never takes a text glyph: U+FE0E, or a text-default pictograph like ©', () => {
    expect(cut('✋︎ ⚙︎ © ™')).toEqual([]);
    expect(presentsAsEmoji('©')).toBe(false);
    expect(presentsAsEmoji('🎤')).toBe(true);
  });
  it('asks the probe for the rest (a text-default pictograph the colour font draws)', () => {
    expect(cut('⚙ SET', () => true)).toEqual(['⚙']);
    expect(cut('⚙ SET', () => false)).toEqual([]);
    expect(cut('✋︎', () => true)).toEqual([]);
  });
});
