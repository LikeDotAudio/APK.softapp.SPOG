// src/ui/console/captains-log-persist.test — a malformed IndexedDB row is skipped,
// never the end of the Captain's Log restore.

import { describe, it, expect, vi } from 'vitest';

const rows: unknown[] = [];
vi.mock('../../platform/store-idb.js', () => ({ idbPut: async () => undefined, idbGetAll: async () => rows }));
vi.mock('./captains-log-view.js', () => ({ render: () => undefined }));

const { hydrateLog } = await import('./captains-log-persist.js');
const { narratives } = await import('./captains-log-state.js');

const row = (entry: number, extra: Record<string, unknown> = {}) => ({
  k: `feed:1:${entry}`, origin: 'feedfeed', voyage: 1, voyTitle: 'V', entry, ts: entry,
  dest: 'PGM', prod: 'P1', text: `e${entry}`, reversed: false, ...extra,
});

describe('hydrateLog', () => {
  it('restores the good rows around a malformed one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    rows.push(row(1), null, row(2, { origin: 42 }), { ts: 'x' }, row(3, { added: ['CAM 1'] }));
    expect(await hydrateLog()).toBe(2);
    const texts = narratives.flatMap((n) => n.entries).map((e) => e.text);
    expect(texts).toEqual(expect.arrayContaining(['e1', 'e3']));
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
