// src/domain/scan/scan-route.test — the netlist reading and the Locate / Fill /
// Verify decisions (ROAD-3476).
import { describe, it, expect } from 'vitest';
import { entriesOf, locate, candidates, cleanValue, applyIdentity, destTabId, type NetEntry } from './netlist.js';
import { routeRead } from './scan-route.js';

const ROOM = 'Routes/Destinations/001_Studio/001_studio-a.json';
const room = () => ({ id: 'studio-a', name: 'STUDIO A', twists: ['CAM 1', { name: 'CAM 2', serial: 'AXR-4471-0093' }, 'MONITOR 1'] });
const entries: NetEntry[] = [
  ...entriesOf(ROOM, room()),
  ...entriesOf('Routes/Sources/001_Studio/003_rack7.json', { id: 'rack7', name: 'RACK 7 STAGEBOX', asset_tag: 'RK-07-U12' }),
  ...entriesOf('Routes/Sources/090_Discovered/001_metro16-a.json',
    { id: 'disc-m16', name: 'Metro16-DANTE2AVB', device: { serial: '00:0a:92:02:77:5b', mac: '00:0A:92:02:77:5B' } }, true),
];
const by = (name: string): NetEntry => entries.find((e) => e.name === name)!;

describe('netlist', () => {
  it('reads a room, its twists, a source leaf and a discovered device', () => {
    expect(entries.map((e) => [e.kind, e.name])).toEqual([
      ['destination', 'STUDIO A'], ['twist', 'CAM 1'], ['twist', 'CAM 2'], ['twist', 'MONITOR 1'],
      ['source', 'RACK 7 STAGEBOX'], ['source', 'Metro16-DANTE2AVB'],
    ]);
    expect(by('CAM 2')).toMatchObject({ parent: 'STUDIO A', twistIndex: 1, serial: 'AXR-4471-0093', key: `${ROOM}#1` });
    expect(by('Metro16-DANTE2AVB')).toMatchObject({ live: true, serial: '00:0a:92:02:77:5b', mac: '00:0A:92:02:77:5B' });
    expect(entriesOf('x.json', ['not', 'a', 'device'])).toEqual([]);
  });

  it('reads a label without its printed prefix, and a URL QR by its query and path', () => {
    expect(cleanValue('S/N: 7C1-552-0918')).toBe('7C1-552-0918');
    expect(cleanValue('Asset Tag #RK-07')).toBe('RK-07');
    expect(cleanValue('CAM 1')).toBe('CAM 1');
    expect(candidates('https://a.example/d/STAGEBOX-9?asset=RK-07-U12')).toEqual(
      expect.arrayContaining(['RK07U12', 'STAGEBOX9']));
  });

  it('locates exactly — identity before id before name, never a substring', () => {
    expect(locate('000A9202775B', entries).map((h) => [h.entry.name, h.field])).toEqual([['Metro16-DANTE2AVB', 'serial']]);
    expect(locate('cam 1', entries).map((h) => h.entry.name)).toEqual(['CAM 1']);
    expect(locate('CAM', entries)).toEqual([]);
    expect(locate('studio-a', entries).map((h) => [h.entry.name, h.field])).toEqual([['STUDIO A', 'id']]);
  });

  it('computes the footer tab id destinations.ts gives a file', () => {
    expect(destTabId('Routes/Destinations/001_Studio/001_studio%20a.json'))
      .toBe('Routes-Destinations-001-Studio---001-studio-a');
  });

  it('writes identity into the document — a string twist becomes an object', () => {
    const doc = room() as Record<string, unknown>;
    expect(applyIdentity(doc, by('CAM 1'), 'serial', 'Z-1')).toBeUndefined();
    expect((doc.twists as unknown[])[0]).toEqual({ name: 'CAM 1', serial: 'Z-1' });
    expect(applyIdentity(doc, by('CAM 2'), 'serial', 'Z-2')).toBe('AXR-4471-0093');
    expect(applyIdentity(doc, by('STUDIO A'), 'asset_tag', 'A-9')).toBeUndefined();
    expect(doc.asset_tag).toBe('A-9');
  });
});

describe('routeRead', () => {
  const ctx = (active: NetEntry | null, fillField: 'serial' | 'asset_tag' = 'serial') => ({ entries, active, fillField });

  it('LOCATE routes to the hit, or says nothing carries the code', () => {
    const o = routeRead('locate', 'RK-07-U12', ctx(null));
    expect(o.kind === 'located' && o.hits.map((h) => h.entry.name)).toEqual(['RACK 7 STAGEBOX']);
    expect(routeRead('locate', 'NOPE-1', ctx(null))).toEqual({ kind: 'not-found', code: 'NOPE-1' });
  });

  it('FILL targets the active card and its chosen field', () => {
    expect(routeRead('fill', 'ASSET: CAM-0007', ctx(by('CAM 1'), 'asset_tag')))
      .toMatchObject({ kind: 'fill', field: 'asset_tag', value: 'CAM-0007', entry: { name: 'CAM 1' } });
    expect(routeRead('fill', 'X-2', ctx(by('CAM 2')))).toMatchObject({ kind: 'fill', previous: 'AXR-4471-0093' });
  });

  it('FILL refuses with no card, on a discovered device, a repeat, or a serial another unit owns', () => {
    expect(routeRead('fill', 'X', ctx(null)).kind).toBe('refused');
    expect(routeRead('fill', 'X', ctx(by('Metro16-DANTE2AVB')))).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/discovered/) });
    expect(routeRead('fill', 'SN AXR-4471-0093', ctx(by('CAM 2')))).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/already has/) });
    expect(routeRead('fill', 'AXR-4471-0093', ctx(by('CAM 1')))).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/STUDIO A · CAM 2/) });
  });

  it('VERIFY matches, mismatches, or says the card records nothing', () => {
    expect(routeRead('verify', 'S/N AXR-4471-0093', ctx(by('CAM 2')))).toMatchObject({ kind: 'verified', field: 'serial' });
    expect(routeRead('verify', '00-0A-92-02-77-5B', ctx(by('Metro16-DANTE2AVB')))).toMatchObject({ kind: 'verified', field: 'serial' });
    expect(routeRead('verify', 'AXR-9999', ctx(by('CAM 2')))).toMatchObject({ kind: 'mismatch', recorded: { serial: 'AXR-4471-0093' } });
    expect(routeRead('verify', 'AXR-9999', ctx(by('CAM 1')))).toMatchObject({ kind: 'unrecorded' });
    expect(routeRead('verify', 'AXR-9999', ctx(null)).kind).toBe('refused');
  });
});
