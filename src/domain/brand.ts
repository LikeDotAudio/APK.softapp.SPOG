// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/brand — the brand accent, from the contract.
 *
 *  SPOG builds and deploys on its own (spog.like.audio), where no /APK:OS/ is
 *  served, so it carries the contract's browser build in src/vendor/apk-contracts/
 *  (root contracts/tokens/brand.json, held to its source by
 *  `.apk.scripts/vendor_contract_web.py --check`). The console's injected style
 *  strings and the canvases both take the accent from here, so SPOG never
 *  spells the hex itself (check.sh brand, SDK audit WS-07). Pure: no DOM. */
// @ts-expect-error TS7016 — untyped vendored ES module (a .d.ts beside it would fail the vendor check)
import { ACCENT as CONTRACT_ACCENT } from '../vendor/apk-contracts/apk-contracts.mjs';

export const ACCENT: string = CONTRACT_ACCENT;

/** The accent at `alpha` as `rgba(r, g, b, a)` — for style strings and canvas fills. */
export function accentRgba(alpha = 1): string {
  const hex = ACCENT.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
