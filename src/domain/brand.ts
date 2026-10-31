// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/brand — the brand accent, from the contract.
 *
 *  SPOG builds and deploys on its own (spog.like.audio), where no /APK:OS/ is
 *  served, so it carries the contract's browser build in src/vendor/apk-contracts/
 *  (root contracts/tokens/brand.json, held to its source by
 *  `.apk.scripts/vendor_contract_web.py --check`). SPOG never spells the hex itself
 *  (check.sh brand, SDK audit WS-07).
 *  `ACCENT` is `var(--brand-accent)`: the Colour Engine writes that token already seen through
 *  the chroma / vision mode (src/ui/console/palette-paint.ts), so a style string follows grey /
 *  mono / high / low live, and src/ui/canvas-ink.ts resolves the same reference on a canvas
 *  (ROAD-3463). `ACCENT_HEX` is the true colour, for what must stay a hex. Pure: no DOM. */
// @ts-expect-error TS7016 — untyped vendored ES module (a .d.ts beside it would fail the vendor check)
import { ACCENT as CONTRACT_ACCENT } from '../vendor/apk-contracts/apk-contracts.mjs';
import { alpha } from './palette.js';

/** The contract's accent as spelled. */
export const ACCENT_HEX: string = CONTRACT_ACCENT;
/** The accent as the interface paints it: the mode-resolved custom property. */
export const ACCENT = 'var(--brand-accent)';

/** The accent at `a` (0..1) opacity — for style strings and canvas fills; follows the mode. */
export const accentAlpha = (a = 1): string => alpha(ACCENT, a);
