// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/console/palette-paint — the palette onto the page, seen through the mode (ROAD-3456).
 *
 *  Writes one <style id="pal-tokens">: `:root` carries every `--pal-<name>` resolved through the
 *  chroma / vision mode (src/domain/colour-resolve.ts), and `[data-true-colour]` re-declares
 *  them as spelled, so a signal surface (TSG, video, scopes) marked with that attribute keeps
 *  its true colour while the interface around it follows the mode. Points the canvas setters
 *  (src/ui/canvas-ink.ts) at the same mode, and carries the mode as a CSS filter for emoji. */

import { cssFilter, type Mode } from '../../domain/colour-resolve.js';
import { installCanvasInk, setInkMode, resolvedVars, TRUE_VARS } from '../canvas-ink.js';

const block = (sel: string, vals: Readonly<Record<string, string>>): string =>
  `${sel}{${Object.entries(vals).map(([k, v]) => `--${k}:${v};`).join('')}}`;

/** Paint the palette (and `--brand-accent`) for `mode`; returns the resolved colours (property → colour). */
export function paintPalette(mode: Mode): Readonly<Record<string, string>> {
  installCanvasInk();
  setInkMode(mode);
  const res = resolvedVars();
  let tag = document.getElementById('pal-tokens');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'pal-tokens';
    document.head.appendChild(tag);
  }
  // --emoji-filter: the mode as CSS, for colour-emoji glyphs (ui/console/emoji-ink.ts, ROAD-3464).
  tag.textContent = `${block(':root', { ...res, 'emoji-filter': cssFilter(mode) })}\n${block('[data-true-colour]', { ...TRUE_VARS, 'emoji-filter': 'none' })}`;
  return res;
}
