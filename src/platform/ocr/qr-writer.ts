// src/platform/ocr/qr-writer — QR symbols for EXPORT FROM PROJECT (ROAD-3475).
//
// The writer half of the zxing-wasm package SPOG already pins EXACT at 3.1.5
// for the SCAN reader — one engine family, no second QR library. Loaded only
// when an export is asked for: the glue by dynamic import, the .wasm
// (zxing_writer, ~0.65 MB) through Vite `?url` into dist/assets/, same origin.
// Like the reader, an unprepared writer THROWS rather than reach for the
// package's jsDelivr default.

import type { WriterOptions } from 'zxing-wasm/writer';

type WriterModule = typeof import('zxing-wasm/writer');
let mod: WriterModule | null = null;

export type WriterSource = { wasmUrl: string } | { wasmBinary: ArrayBuffer };

export async function prepareQrWriter(source: WriterSource): Promise<void> {
  const m = await import('zxing-wasm/writer');
  m.prepareZXingModule('wasmUrl' in source
    ? { overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? source.wasmUrl : prefix + path) } }
    : { overrides: { wasmBinary: source.wasmBinary } });
  mod = m;
}

/** In the browser: the same-origin .wasm the build emitted. */
export async function loadQrWriter(): Promise<void> {
  if (mod) return;
  const wasm = await import('zxing-wasm/writer/zxing_writer.wasm?url');
  await prepareQrWriter({ wasmUrl: wasm.default });
}

const OPTIONS: WriterOptions = { format: 'QRCode', ecLevel: 'M', scale: 4 };

export interface QrSymbol { svg: string; png: Blob | null }

/** One QR symbol for `text`. Throws when the writer is unprepared or refuses. */
export async function writeQr(text: string): Promise<QrSymbol> {
  if (!mod) throw new Error('writeQr: the QR writer is not prepared');
  const r = await mod.writeBarcode(text, OPTIONS);
  if (r.error) throw new Error(`QR writer refused "${text}": ${r.error}`);
  // Inline-ready: the writer prefixes an XML prolog and DOCTYPE an HTML page must not carry.
  return { svg: r.svg.slice(Math.max(0, r.svg.indexOf('<svg'))), png: r.image };
}
