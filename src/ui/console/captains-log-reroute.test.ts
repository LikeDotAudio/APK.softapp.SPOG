// src/ui/console/captains-log-reroute.test — Reverse Course after reload: a routing
// entry with no live DOM refs is re-derived from its persisted labels, and a batch
// reversal keeps going past entries that can't be reversed now.

import { describe, it, expect, beforeAll } from 'vitest';
import { reversalPlan } from './captains-log-reroute.js';
import { reverseSelected } from './captains-log-narrate.js';
import { narratives, selected, entKey, reversible, type Entry } from './captains-log-state.js';
import { logAction } from './captains-log.js';

// render()/findTwist touch `document`; a console with no twists on it.
beforeAll(() => {
  (globalThis as unknown as { document: unknown }).document = { querySelector: () => null, querySelectorAll: () => [] };
});

describe('reversalPlan', () => {
  it('takes the added sources out and puts the removed ones back', () => {
    expect(reversalPlan(['CAM 1', 'CAM 2'], ['CAM 2'], ['CAM 3'], ['CAM 1', 'CAM 2', 'CAM 3'])).toEqual({ drop: [1], add: ['CAM 3'] });
  });
  it('drops one node per added label, even when the label repeats', () => {
    expect(reversalPlan(['A', 'A', 'B'], ['A', 'A'], [], ['A', 'B'])?.drop).toEqual([0, 1]);
  });
  it('treats an added source already gone as done, and a still-routed one as no-op', () => {
    expect(reversalPlan(['B'], ['A'], ['B'], ['A', 'B'])).toEqual({ drop: [], add: [] });
  });
  it('refuses when a source to put back is not on the console', () => {
    expect(reversalPlan(['A'], ['A'], ['GONE'], ['A'])).toBeNull();
  });
});

describe('reverseSelected', () => {
  const restored = (id: number, labels?: Entry['labels']): Entry => ({ id, ts: id, twist: null, dest: 'PGM', prod: 'P1', added: [], removed: [], text: `e${id}`, reversed: false, restored: true, origin: 'feed', labels });

  it('keeps going past an entry whose destination is gone, and leaves it selected', () => {
    let undone = false;
    const lost = restored(901, { added: ['CAM 1'], removed: [] });
    narratives.push({ id: 900, origin: 'feed', title: 'old', entries: [lost] });
    logAction('layout edit', () => { undone = true; });
    const layout = narratives.flatMap((n) => n.entries).find((e) => e.text.startsWith('layout edit'))!;
    selected.add(entKey(lost)); selected.add(entKey(layout));

    const skipped = reverseSelected();
    expect(undone).toBe(true);
    expect(layout.reversed).toBe(true);
    expect(skipped).toEqual([lost]);
    expect(lost.reversed).toBe(false);
    expect(selected.has(entKey(lost))).toBe(true);
    selected.clear();
  });

  it('keeps label-less restored rows and transient notes read-only', () => {
    expect(reversible(restored(902))).toBe(false);
    expect(reversible(restored(903, { added: ['A'], removed: [] }))).toBe(true);
    logAction('⚖ merge', undefined, { transient: true });
    const note = narratives.flatMap((n) => n.entries).find((e) => e.text.startsWith('⚖ merge'))!;
    expect(note.transient).toBe(true);
    expect(reversible(note)).toBe(false);
  });
});
