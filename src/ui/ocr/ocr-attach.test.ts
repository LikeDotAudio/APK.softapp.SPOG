// src/ui/ocr/ocr-attach.test — "+ ATTACH" / "ADD ALL" write through the SCAN
// panel's act() (the authoring commit) with a FILL outcome — no writer of their
// own — and re-read the netlist before every write (ROAD-3475).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entriesOf, type NetEntry } from '../../domain/scan/netlist.js';
import type { Outcome } from '../../domain/scan/scan-route.js';
import type { Candidate } from '../../domain/ocr/candidates.js';

let netlist: NetEntry[] = [];
const acted: Array<[Outcome, string]> = [];
vi.mock('../../platform/scan/netlist-load.js', () => ({ loadNetlist: vi.fn(async () => netlist) }));
vi.mock('../scan/scan-act.js', () => ({
  act: vi.fn(async (o: Outcome, via: string) => {
    acted.push([o, via]);
    // What the real act() does on a fill: the draft now holds the value.
    if (o.kind === 'fill') netlist = netlist.map((e) => (e.key === o.entry.key ? { ...e, [o.field]: o.value } : e));
    return { line: o.kind, tone: o.kind === 'fill' ? 'ok' : 'warn' };
  }),
}));
const { attachOne, attachAll, VIA } = await import('./ocr-attach.js');

const DSP = 'Routes/Sources/Audio/DSP 1.json';
const c = (kind: Candidate['kind'], value: string, labelled = true): Candidate => ({ kind, value, labelled, wordIds: ['w1'] });

beforeEach(() => {
  acted.length = 0;
  netlist = [...entriesOf(DSP, { name: 'DSP 1' }), ...entriesOf('Routes/Sources/Audio/DSP 2.json', { name: 'DSP 2', asset_tag: 'AT-1' })];
});

describe('attachOne / attachAll', () => {
  it('+ ATTACH is a FILL through act(), logged as read by OCR', async () => {
    const r = await attachOne(c('serial', 'KX7R-24918'), DSP);
    expect(r.acted).toEqual({ line: 'fill', tone: 'ok' });
    expect(acted).toEqual([[expect.objectContaining({ kind: 'fill', field: 'serial', value: 'KX7R-24918', entry: expect.objectContaining({ key: DSP }) }), VIA]]);
    expect(VIA).toBe('read by OCR');
  });
  it('refusals come from the same Fill decision and still go through act()', async () => {
    expect((await attachOne(c('asset_tag', 'AT-1'), DSP)).acted.line).toBe('refused');   // DSP 2 holds it
    expect((await attachOne(c('serial', 'X'), null)).acted.line).toBe('refused');        // no card
    expect(acted.map(([o]) => o.kind)).toEqual(['refused', 'refused']);
  });
  it('ADD ALL writes each labelled field in turn on a freshly read netlist, and reports what it left', async () => {
    const out = await attachAll([c('serial', 'S-1'), c('mac', '00:1D:C1:4A:7F:22'), c('asset_tag', 'IT-0098812', false)], DSP);
    expect(out.map((r) => [r.candidate.kind, r.acted.line])).toEqual([['serial', 'fill'], ['mac', 'fill'], ['asset_tag', expect.stringMatching(/^LEFT — no printed label/)]]);
    expect(netlist.find((e) => e.key === DSP)).toMatchObject({ serial: 'S-1', mac: '00:1D:C1:4A:7F:22' });
    // A second ADD ALL of the same photo changes nothing: the card already has them.
    const again = await attachAll([c('serial', 'S-1')], DSP);
    expect(again[0]!.acted.line).toBe('refused');
  });
});
