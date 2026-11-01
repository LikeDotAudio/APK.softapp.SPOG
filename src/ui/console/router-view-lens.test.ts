// ROAD-3479 — the 1990s grid follows the Discipline Lens: a folded group shows at its
// strongest member, a dimmed leaf carries the lens opacity, a hidden one is hidden.
import { describe, it, expect } from 'vitest';
import { itemOpacity, lensAttr } from './router-view-lens.js';

const SEP = '|';

describe('router-view lens', () => {
  it('a folded group is as visible as its most visible member', () => {
    const of = new Map([['a|1', 0.325], ['a|2', 1], ['b|1', 0.325]]);
    expect(itemOpacity([['a', '1'], ['a', '2']], of, SEP)).toBe(1);
    expect(itemOpacity([['a', '1'], ['b', '1']], of, SEP)).toBe(0.325);
    expect(itemOpacity([['unrendered', 'x']], of, SEP)).toBe(1);   // routed-but-unrendered: not masked
  });

  it('turns an opacity into the cell attributes', () => {
    expect(lensAttr(1)).toEqual({ cls: '', style: '' });
    expect(lensAttr(0.325)).toEqual({ cls: '', style: ' style="opacity:0.325"' });
    expect(lensAttr(0)).toEqual({ cls: ' lens-hidden', style: '' });
  });
});
