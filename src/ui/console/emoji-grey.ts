// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/console/emoji-grey — colour emoji follow `grey` too (ROAD-3463).
 *
 *  An emoji is a glyph from a colour font (Noto Color Emoji): no `--pal-*` token reaches it.
 *  Measured, headless Chrome 154, 13 of SPOG's emoji on a grey field: plain 3,898 chromatic
 *  px; `font-variant-emoji: text` 2,649 and U+FE0E 1,737 (only glyphs a monochrome font also
 *  carries, like ✋ ⚙, turn); `filter: grayscale(1)` on the element 0. So under grey the
 *  element that holds an emoji is marked `data-emoji`, and lcars.css greys it. Exact, because
 *  grey is idempotent: the element's own paint is grey already. Not for mono / high / low,
 *  where a filter would apply the mode twice to the element's resolved colours.
 *  Never marked: anything inside or holding a signal surface (`data-true-colour`, canvas,
 *  video, iframe), and big containers (a filter is a containing block for fixed children). */

const EMOJI = /\p{Extended_Pictographic}/u;
const SIGNAL = 'canvas,video,iframe,[data-true-colour]';
const MAX_DESCENDANTS = 24;

function markOne(t: Text): void {
  const p = t.parentElement;
  if (!p || p.hasAttribute('data-emoji') || !EMOJI.test(t.data)) return;
  if (p === document.body || p === document.documentElement || p.closest('[data-true-colour]')) return;
  if (p.querySelector(SIGNAL) || p.getElementsByTagName('*').length > MAX_DESCENDANTS) return;
  p.setAttribute('data-emoji', '');
}

function markAll(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) { markOne(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) markOne(n as Text);
}

let observer: MutationObserver | null = null;

/** Turn the emoji marking on (grey) or off; idempotent. Marks stay put when off (lcars.css only greys under grey). */
export function applyEmojiGrey(on: boolean): void {
  if (typeof MutationObserver === 'undefined') return;
  if (!document.body) {   // painted before <body> exists: catch up once it does, in whatever mode is current then
    document.addEventListener('DOMContentLoaded', () => applyEmojiGrey(document.documentElement.getAttribute('data-chroma') === 'grey'), { once: true });
    return;
  }
  if (!on) { observer?.disconnect(); observer = null; return; }
  if (observer) return;
  markAll(document.body);
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') markAll(r.target);
      else r.addedNodes.forEach(markAll);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
