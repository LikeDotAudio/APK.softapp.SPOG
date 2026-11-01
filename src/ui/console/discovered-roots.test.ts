// The live layer follows the root manifest drafts (ROAD-3483): a workbook import
// registers Routes/Sources/009_Imported/ in the root Sources draft AFTER the layer
// was built, and the console must read the folder at once, not the frozen root.
import { describe, it, expect, beforeAll, vi } from 'vitest';

// node has no DOM: the redraw side (panels, footer) is not what this test is about.
vi.mock('../sources/panel.js', () => ({ renderSourcesPanel: async () => {} }));
vi.mock('../sources/interact.js', () => ({ wireSourceNodes: () => {} }));
vi.mock('./footer.js', () => ({ Footer: {}, footerGroups: () => [] }));
vi.mock('./destinations.js', () => ({ addDestinationTree: async () => {} }));
vi.mock('./matrix.js', () => ({}));
vi.mock('../palette.js', () => ({ DEST_GROUP_COLORS: [], rgbAt: () => '0,0,0' }));

const store = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  });
  const disk: Record<string, unknown> = { 'Routes/Sources/index.json': ['001_Studio/'], 'Routes/Destinations/index.json': ['001_Control Room/'] };
  vi.stubGlobal('fetch', async (url: string) => {
    if (url in disk) return new Response(JSON.stringify(disk[url]), { status: 200 });
    return new Response('', { status: 404 });   // no Discovery Engine behind this host
  });
});

describe('discovered — the layer follows the root drafts', () => {
  it('an import registering 009_Imported/ after boot is read back at once', async () => {
    const { loadDiscovered } = await import('./discovered.js');
    const { getDraft, putDraft, putDrafts } = await import('../../platform/routes-store.js');
    const { listDirectory } = await import('../../platform/discovery.js');
    await loadDiscovered(undefined, 50);
    expect(getDraft('Routes/Sources/index.json')).toEqual(['001_Studio/']);

    // what authorDevices writes: the leaves + folder manifest, then the root
    putDrafts([['Routes/Sources/009_Imported/001_box.json', { name: 'BOX', items: ['1'] }], ['Routes/Sources/009_Imported/index.json', ['001_box.json']]]);
    const root = getDraft<string[]>('Routes/Sources/index.json')!;
    putDraft('Routes/Sources/index.json', [...root, '009_Imported/']);

    expect(getDraft('Routes/Sources/index.json')).toEqual(['001_Studio/', '009_Imported/']);
    expect((await listDirectory('Routes/Sources/')).dirs.map((d) => d.name)).toEqual(['001_Studio', '009_Imported']);
    expect(getDraft('Routes/Destinations/index.json')).toEqual(['001_Control Room/']);
  });
});
