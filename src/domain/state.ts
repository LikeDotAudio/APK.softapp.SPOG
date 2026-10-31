// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/state — the three state tones and every state word, from the contract.
 *
 *  root contracts/tokens/state.json says what colour a state can be (good / kinda / dead) and
 *  which word means which; SPOG reads it through the vendored browser build, exactly as
 *  brand.ts reads the accent, so no SPOG source spells a state hex. Each tone also carries a
 *  monochrome GLYPH, so a state survives grey, mono and colour-blind seats (Colours and
 *  shapes.md §5): the colour is the tint, the glyph is the message. Pure: no DOM. */
// @ts-expect-error TS7016 — untyped vendored ES module (a .d.ts beside it would fail the vendor check)
import { STATE_TONES as TONES, STATE_WORDS as WORDS, STATE_DEFAULT as DEFAULT } from '../vendor/apk-contracts/apk-contracts.mjs';

export type Tone = 'good' | 'kinda' | 'dead';
export const TONE_NAMES: readonly Tone[] = ['good', 'kinda', 'dead'];

/** Each tone's hex and translucent tint, as the contract states them. */
export const STATE_TONES: Readonly<Record<Tone, { hex: `#${string}`; tint: string }>> = TONES;
/** Every state word the bench uses → its tone (`online` → good, `offline` → dead, …). */
export const STATE_WORDS: Readonly<Record<string, Tone>> = WORDS;

/** The glyph each tone leads with (U+FE0E keeps ⚠ a text glyph, never an emoji). */
export const TONE_GLYPHS: Readonly<Record<Tone, string>> = { good: '✓', kinda: '◐', dead: '⚠︎' };

/** The tone a state word means; an unknown word is the contract's default (kinda). */
export function toneOf(word: string): Tone {
  return STATE_WORDS[word.trim().toLowerCase()] ?? (DEFAULT as Tone);
}
