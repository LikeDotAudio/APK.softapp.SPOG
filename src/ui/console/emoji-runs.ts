// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/console/emoji-runs — where the colour-emoji glyphs are in a run of text (ROAD-3464).
 *
 *  A cluster is a flag (two regional indicators), a keycap, or a pictograph with its
 *  presentation selector, skin-tone modifier and ZWJ joins. One spelled with U+FE0E asks for
 *  the TEXT glyph, which paints in the element's own (already resolved) colour, so it is never
 *  a colour cluster. Whether any other one draws from a colour font is the caller's
 *  `isColour` (a browser probe; without a DOM, the Unicode Emoji_Presentation default).
 *  Pure: strings in, offsets out. */

const CLUSTER = /\p{RI}\p{RI}|[#*0-9]️?⃣|\p{Extended_Pictographic}[︎️]?\p{EMod}?(?:‍\p{Extended_Pictographic}️?\p{EMod}?)*/gu;
const DEFAULT_COLOUR = /^(?:\p{RI}|.*️|\p{Emoji_Presentation})/u;

/** The Unicode default: drawn as a colour emoji unless the text font has it. */
export const presentsAsEmoji = (cluster: string): boolean => !cluster.includes('︎') && DEFAULT_COLOUR.test(cluster);

/** [start, end) of each run of adjacent colour clusters in `text`. */
export function emojiRuns(text: string, isColour: (cluster: string) => boolean = presentsAsEmoji): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of text.matchAll(CLUSTER)) {
    const c = m[0];
    if (c.includes('︎') || !isColour(c)) continue;
    const s = m.index, e = s + c.length, last = out[out.length - 1];
    if (last && last[1] === s) last[1] = e; else out.push([s, e]);
  }
  return out;
}
