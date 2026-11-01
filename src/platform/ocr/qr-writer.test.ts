// src/platform/ocr/qr-writer.test — a QR label EXPORT writes is read back by the
// SCAN panel's own decoder and lands on the same unit (ROAD-3475).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareQrWriter, writeQr } from './qr-writer.js';
import { prepareZxing, zxingDecoder } from '../scan/zxing-decoder.js';
import { exportRows } from '../../domain/ocr/qr-export.js';
import { entriesOf } from '../../domain/scan/netlist.js';
import { routeRead } from '../../domain/scan/scan-route.js';

const NM = join(__dirname, '../../../node_modules/zxing-wasm/dist');
const buf = (p: string): ArrayBuffer => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; };

describe('QR writer (zxing-wasm 3.1.5, self-hosted)', () => {
  it('refuses before it is prepared', async () => {
    await expect(writeQr('S/N: 1')).rejects.toThrow(/not prepared/);
  });
  it('export → QR → SCAN decode → Locate finds the unit', async () => {
    await prepareQrWriter({ wasmBinary: buf(join(NM, 'writer/zxing_writer.wasm')) });
    prepareZxing({ wasmBinary: readFileSync(join(NM, 'reader/zxing_reader.wasm')) });
    const entries = entriesOf('Routes/Destinations/Rack B.json', { name: 'Rack B', serial: 'KX7R-24918', asset_tag: 'AT-004512' });
    for (const row of exportRows(entries).rows) {
      const sym = await writeQr(row.payload);
      expect(sym.svg).toMatch(/^<svg/);
      const reads = await zxingDecoder(sym.png!);
      expect(reads.map((r) => r.text)).toEqual([row.payload]);
      expect(routeRead('locate', reads[0]!.text, { entries, active: null, fillField: 'serial' })).toMatchObject({ kind: 'located', hits: [{ entry: { key: row.key }, field: row.field }] });
    }
  });
});
