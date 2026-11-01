// src/ui/sources/pools-fold — fold/accordion behaviour + origin tagging shared
// by every pool renderer (extracted from pools.ts). No behaviour change.
import type { SourceLeaf } from '../../model/index.js';

// ---- fold behaviour (port of js/globals.js togglePool) ----------------------
export function togglePool(header: HTMLElement): void {
  const content = header.nextElementSibling as HTMLElement | null;
  if (!content) return;
  const icon = header.querySelector<HTMLElement>('.fold-icon');
  const isOpening = content.style.display === 'none';
  const parent = header.closest('.super-pool-content');
  if (parent && isOpening) {
    parent.querySelectorAll<HTMLElement>('.pool-content').forEach((c) => {
      c.style.display = 'none';
      const prevIcon = c.previousElementSibling?.querySelector<HTMLElement>('.fold-icon');
      if (prevIcon) prevIcon.style.transform = 'rotate(-90deg)';
    });
  }
  content.style.display = isOpening ? '' : 'none';
  if (icon) icon.style.transform = isOpening ? 'rotate(0deg)' : 'rotate(-90deg)';
}

/** Wire a pool group's own foldable header to the accordion toggle. */
export function wireFold(group: HTMLElement): void {
  const header = group.querySelector<HTMLElement>(':scope > .foldable-header');
  if (header) header.addEventListener('click', () => togglePool(header));
}

export const tagOrigin = (root: ParentNode, origin: string): void => {
  root.querySelectorAll<HTMLElement>('.signal-node').forEach((n) => { n.dataset.origin = origin; });
};

/** Carry what a feed rides on onto its node (`data-wire` / `data-format`), from the
 *  discovered device's matching output or the leaf's own `wire`/`format`. Clones keep the
 *  attributes, so a routed crosspoint tells the Discipline Lens (ROAD-3473) its carrier. */
export function tagWire(node: HTMLElement, data: SourceLeaf, label: string): void {
  const out = data.device?.outputs?.find((o) => o.name === label);
  const wire = out?.wire || data.wire;
  const format = out?.format || data.format;
  if (wire) node.dataset.wire = wire;
  if (format) node.dataset.format = format;
}
