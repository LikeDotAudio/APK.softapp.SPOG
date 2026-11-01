#!/usr/bin/env node
// src/platform/scan/__fixtures__/make-fixtures.mjs — writes the label photos the
// decoder tests read (ROAD-3476). Run once from the WEB.SPOG root:
//
//   node src/platform/scan/__fixtures__/make-fixtures.mjs
//
// The symbols are ENCODED by zxing-wasm's writer (same pinned package, writer
// build — never shipped to the browser), then rasterised here into grey "label
// photos": a quiet zone, a paper tone that is not pure white, ink that is not
// pure black, and deterministic sensor noise. One fixture puts a small QR off
// centre in a large, cluttered scene, and one holds no symbol at all — the
// decoder must answer [] for it, never a guess.

import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');
const writer = await import(join(ROOT, 'node_modules/zxing-wasm/dist/es/writer/index.js'));
writer.prepareZXingModule({
  overrides: { wasmBinary: readFileSync(join(ROOT, 'node_modules/zxing-wasm/dist/writer/zxing_writer.wasm')).buffer },
});

/** The fixtures: file → what is printed on the label. tests read FIXTURES.json. */
export const FIXTURES = {
  'qr-device.png': { format: 'QRCode', text: 'SN: AXR-4471-0093', scale: 8, quiet: 4 },
  'datamatrix-serial.png': { format: 'DataMatrix', text: 'S/N 7C1-552-0918', scale: 10, quiet: 3 },
  'code128-asset.png': { format: 'Code128', text: 'ASSET-0042117', scale: 3, quiet: 12 },
};

// Deterministic noise — the same bytes on every run.
let seed = 0x3476;
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 0x100000000);

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** 8-bit greyscale PNG. */
function png(w, h, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0;
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w + 1)] = 0; px.copy(raw, y * (w + 1) + 1, y * w, (y + 1) * w); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** A paper-toned canvas with noise; `stamp` draws modules onto it. */
function canvas(w, h, paper = 222) {
  const px = Buffer.alloc(w * h);
  for (let i = 0; i < px.length; i++) px[i] = Math.max(0, Math.min(255, paper + Math.round((rnd() - 0.5) * 18)));
  return px;
}
function stamp(px, w, sym, x0, y0, scale, ink = 34) {
  for (let y = 0; y < sym.height; y++) for (let x = 0; x < sym.width; x++) {
    if (sym.data[y * sym.width + x] !== 0) continue;   // writer symbol: 0 = dark module
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const i = (y0 + y * scale + dy) * w + x0 + x * scale + dx;
      px[i] = Math.max(0, Math.min(255, ink + Math.round((rnd() - 0.5) * 20)));
    }
  }
}
async function symbol(format, text) {
  const r = await writer.writeBarcode(text, { format });
  if (r.error) throw new Error(`${format}: ${r.error}`);
  return r.symbol;
}

const out = {};
for (const [file, f] of Object.entries(FIXTURES)) {
  const sym = await symbol(f.format, f.text);
  const pad = f.quiet * f.scale;
  const w = sym.width * f.scale + 2 * pad, h = sym.height * f.scale + 2 * pad;
  const px = canvas(w, h);
  stamp(px, w, sym, pad, pad, f.scale);
  writeFileSync(join(HERE, file), png(w, h, px));
  out[file] = { format: f.format, text: f.text };
}

// A small asset QR off centre in a darker, cluttered 960×720 "rack" scene.
{
  const text = 'https://assets.example/tag?asset=RK-07-U12';
  const sym = await symbol('QRCode', text);
  const W = 960, H = 720, s = 4;
  const px = canvas(W, H, 70);
  for (let k = 0; k < 40; k++) {   // clutter: dark and light bars (rack ears, cables)
    const x = Math.floor(rnd() * (W - 60)), y = Math.floor(rnd() * (H - 20)), v = rnd() < 0.5 ? 20 : 150;
    for (let dy = 0; dy < 8 + rnd() * 30; dy++) for (let dx = 0; dx < 20 + rnd() * 120; dx++) { const i = (y + dy) * W + x + dx; if (i < px.length) px[i] = v; }
  }
  const x0 = 610, y0 = 380, q = 4 * s;
  for (let y = y0 - q; y < y0 + sym.height * s + q; y++) for (let x = x0 - q; x < x0 + sym.width * s + q; x++) px[y * W + x] = 215;
  stamp(px, W, sym, x0, y0, s, 40);
  writeFileSync(join(HERE, 'qr-in-scene.png'), png(W, H, px));
  out['qr-in-scene.png'] = { format: 'QRCode', text };
}

// No symbol at all.
writeFileSync(join(HERE, 'blank-label.png'), png(320, 200, canvas(320, 200)));
out['blank-label.png'] = null;

writeFileSync(join(HERE, 'FIXTURES.json'), JSON.stringify(out, null, 2) + '\n');
console.log('wrote', Object.keys(out).join(', '));
