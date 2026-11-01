// src/platform/scan/scan-decode.test — real label photos decoded through the
// bundled zxing-wasm engine, the engine choice, and decode → Locate / Fill
// routing end to end (ROAD-3476). The PNGs are made by __fixtures__/make-fixtures.mjs.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeFrame, registerFrameDecoder, scanEngine } from './scan-decode.js';
import { prepareZxing, zxingDecoder, zxingPrepared } from './zxing-decoder.js';
import { entriesOf } from '../../domain/scan/netlist.js';
import { routeRead } from '../../domain/scan/scan-route.js';

const FIX = join(__dirname, '__fixtures__');
const WASM = join(__dirname, '../../../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm');
const photo = (name: string): Blob => new Blob([readFileSync(join(FIX, name))], { type: 'image/png' });
const host = globalThis as { BarcodeDetector?: unknown };

afterEach(() => { delete host.BarcodeDetector; });

describe('zxing-wasm engine (self-hosted, no CDN)', () => {
  it('refuses to decode before it is told where its wasm is', async () => {
    expect(zxingPrepared()).toBe(false);
    await expect(zxingDecoder(photo('qr-device.png'))).rejects.toThrow(/prepareZxing/);
    const off = registerFrameDecoder(zxingDecoder);
    expect(await decodeFrame(photo('qr-device.png'))).toEqual([]);   // "saw nothing", never a guess
    off();
  });

  it('decodes QR, DataMatrix and Code 128 label photos', async () => {
    prepareZxing({ wasmBinary: readFileSync(WASM) });
    const off = registerFrameDecoder(zxingDecoder);
    expect(scanEngine()).toBe('registered');
    expect(await decodeFrame(photo('qr-device.png'))).toEqual([{ text: 'SN: AXR-4471-0093', symbology: 'qr' }]);
    expect(await decodeFrame(photo('datamatrix-serial.png'))).toEqual([{ text: 'S/N 7C1-552-0918', symbology: 'datamatrix' }]);
    expect(await decodeFrame(photo('code128-asset.png'))).toEqual([{ text: 'ASSET-0042117', symbology: 'code128' }]);
    off();
  });

  it('finds a small QR off centre in a cluttered rack scene', async () => {
    const off = registerFrameDecoder(zxingDecoder);
    expect(await decodeFrame(photo('qr-in-scene.png'))).toEqual([{ text: 'https://assets.example/tag?asset=RK-07-U12', symbology: 'qr' }]);
    off();
  });

  it('answers [] for a photo with no symbol in it', async () => {
    const off = registerFrameDecoder(zxingDecoder);
    expect(await decodeFrame(photo('blank-label.png'))).toEqual([]);
    off();
  });

  it('says "none" when nothing can decode, and decodes nothing', async () => {
    expect(scanEngine()).toBe('none');
    expect(await decodeFrame(photo('qr-device.png'))).toEqual([]);
  });
});

describe('engine choice — capability, never a browser name', () => {
  const fakeNative = (reads: Array<{ rawValue?: string; format?: string }>) => class {
    async detect(): Promise<typeof reads> { return reads; }
  };
  const pixels = { width: 2, height: 2, data: new Uint8ClampedArray(16) } as unknown as ImageData;

  it('prefers the platform detector and normalises its output', async () => {
    host.BarcodeDetector = fakeNative([{ rawValue: '  ABC-1 ', format: 'data_matrix' }, { rawValue: '', format: 'qr_code' }]);
    const off = registerFrameDecoder(zxingDecoder);
    expect(scanEngine()).toBe('native');
    expect(await decodeFrame(pixels)).toEqual([{ text: 'ABC-1', symbology: 'datamatrix' }]);
    off();
  });

  it('gives a STILL a second look with zxing when the platform detector sees nothing', async () => {
    host.BarcodeDetector = fakeNative([]);
    const off = registerFrameDecoder(zxingDecoder);
    expect(await decodeFrame(photo('code128-asset.png'))).toEqual([{ text: 'ASSET-0042117', symbology: 'code128' }]);
    expect(await decodeFrame(pixels)).toEqual([]);   // a live frame gets one engine
    off();
  });

  it('falls through to zxing when the platform refuses our formats', async () => {
    host.BarcodeDetector = class { constructor() { throw new TypeError('unsupported format'); } };
    const off = registerFrameDecoder(zxingDecoder);
    expect(scanEngine()).toBe('registered');
    off();
  });
});

describe('decoded photo → netlist (Locate / Fill)', () => {
  const entries = [
    ...entriesOf('Routes/Destinations/001_Studio/001_studio-a.json', {
      id: 'studio-a', name: 'STUDIO A', twists: ['CAM 1', { name: 'CAM 2', serial: 'AXR-4471-0093' }],
    }),
    ...entriesOf('Routes/Sources/001_Studio/003_rack7.json', { id: 'rack7', name: 'RACK 7 STAGEBOX', asset_tag: 'RK-07-U12' }),
  ];

  it('Locate: a scanned serial label jumps to the twist that records it', async () => {
    const off = registerFrameDecoder(zxingDecoder);
    const [read] = await decodeFrame(photo('qr-device.png'));
    const o = routeRead('locate', read!.text, { entries, active: null, fillField: 'serial' });
    expect(o.kind).toBe('located');
    if (o.kind === 'located') expect(o.hits.map((h) => [h.entry.name, h.field])).toEqual([['CAM 2', 'serial']]);
    off();
  });

  it('Locate: an asset URL in a QR finds the source device by its asset tag', async () => {
    const off = registerFrameDecoder(zxingDecoder);
    const [read] = await decodeFrame(photo('qr-in-scene.png'));
    const o = routeRead('locate', read!.text, { entries, active: null, fillField: 'serial' });
    expect(o.kind === 'located' && o.hits[0]!.entry.name).toBe('RACK 7 STAGEBOX');
    off();
  });

  it('Fill: a DataMatrix serial lands on the active card without its S/N prefix', async () => {
    const off = registerFrameDecoder(zxingDecoder);
    const [read] = await decodeFrame(photo('datamatrix-serial.png'));
    const cam1 = entries.find((e) => e.name === 'CAM 1')!;
    const o = routeRead('fill', read!.text, { entries, active: cam1, fillField: 'serial' });
    expect(o).toMatchObject({ kind: 'fill', field: 'serial', value: '7C1-552-0918', entry: { key: cam1.key } });
    off();
  });
});
