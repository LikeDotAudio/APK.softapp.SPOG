// src/domain/ocr/qr-export.test — EXPORT FROM PROJECT writes payloads that SCAN's
// Locate reads straight back to the same unit (ROAD-3475).
import { describe, it, expect } from 'vitest';
import { exportRows, sheetHtml } from './qr-export.js';
import { entriesOf, locate } from '../scan/netlist.js';

const entries = [
  ...entriesOf('Routes/Destinations/Rack B.json', { name: 'Rack B', serial: 'KX7R-24918', asset_tag: 'AT-004512', twists: [{ name: 'CAM 2', mac: '00:1D:C1:4A:7F:22' }, 'CAM 3'] }),
  ...entriesOf('Routes/Sources/A.json', { name: 'A', asset_tag: 'DUP-1' }),
  ...entriesOf('Routes/Sources/B.json', { name: 'B', asset_tag: 'dup 1' }),
  ...entriesOf('Routes/Sources/Live.json', { name: 'Live', device: { serial: 'L-9' } }, true),
];

describe('exportRows', () => {
  it('one payload per recorded value; each one locates its own unit', () => {
    const { rows } = exportRows(entries);
    expect(rows.map((r) => [r.label, r.payload])).toEqual([
      ['Rack B', 'S/N: KX7R-24918'], ['Rack B', 'ASSET TAG: AT-004512'], ['Rack B · CAM 2', 'MAC: 00:1D:C1:4A:7F:22'], ['Live', 'S/N: L-9'],
    ]);
    for (const r of rows) expect(locate(r.payload, entries).map((h) => h.entry.key)).toEqual([r.key]);
    expect(rows.find((r) => r.label === 'Live')!.discovered).toBe(true);
  });
  it('a value two units share is not written, and says why', () => {
    const { rows, skipped } = exportRows(entries);
    expect(rows.some((r) => r.value.toUpperCase().includes('DUP'))).toBe(false);
    expect(skipped).toEqual([expect.stringMatching(/^A: asset_tag DUP-1 — 2 units/), expect.stringMatching(/^B: asset_tag dup 1 — 2 units/)]);
  });
  it('an empty netlist exports nothing', () => {
    expect(exportRows([])).toEqual({ rows: [], skipped: [] });
  });
});

describe('sheetHtml', () => {
  it('a self-contained page, one card per symbol, text escaped', () => {
    const [row] = exportRows(entriesOf('Routes/Sources/x.json', { name: '<b>&"x"', serial: 'S1' })).rows;
    const html = sheetHtml('Labels', [row!], ['<svg id="q"></svg>'], ['<script>']);
    expect(html).toContain('<svg id="q"></svg>');
    expect(html).toContain('&#60;b&#62;&#38;&#34;x&#34;');
    expect(html).not.toContain('<script>');
    expect(html).not.toMatch(/https?:\/\//);   // no external reference of any kind
  });
});
