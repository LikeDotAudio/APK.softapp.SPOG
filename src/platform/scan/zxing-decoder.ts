// src/platform/scan/zxing-decoder — the second engine: zxing-cpp compiled to
// WebAssembly, READER build only (ROAD-3476).
//
// Package `zxing-wasm`, pinned EXACT at 3.1.5 (MIT). It reads QR, DataMatrix and
// Code 128 (and more, unasked) from ImageData or straight from a PNG/JPEG Blob.
// The `reader` subpath is imported, never the default `full`, so the writer
// half is not shipped. jsQR is QR-only (serial labels are DataMatrix/Code 128);
// @zxing/library is the slower, unmaintained JS port.
//
// THE WASM IS SERVED BY SPOG, NEVER BY A CDN. Left alone the package fetches its
// .wasm from fastly.jsdelivr.net — the one place a technician in a riser room
// cannot reach, and a third-party fetch this console must not make. Nothing here
// decodes until prepareZxing() says where the bytes are: the same-origin URL
// Vite emits into dist/assets (load-decoder.ts), or the bytes themselves (the
// node tests). An unprepared call THROWS rather than reaching for the CDN.

import { prepareZXingModule, readBarcodes, type ReaderOptions } from 'zxing-wasm/reader';
import { ZXING_FORMATS, cleanReads, type ScanRead } from '../../domain/scan/symbology.js';
import type { FrameDecoder, ScanFrame } from './scan-decode.js';

/** A camera frame is downscaled to this long edge before decoding: a label that
 *  fills the view decodes comfortably at 1280, and the copy into wasm memory is
 *  what costs battery. */
export const MAX_FRAME_EDGE_PX = 1280;

export type ZxingSource =
  | { wasmUrl: string; wasmBinary?: undefined }
  | { wasmBinary: ArrayBuffer | Uint8Array; wasmUrl?: undefined };

let prepared = false;

/** Tell the engine where its WebAssembly lives. Call before the first decode. */
export function prepareZxing(source: ZxingSource): void {
  if (source.wasmBinary !== undefined) {
    const b = source.wasmBinary instanceof Uint8Array ? source.wasmBinary : new Uint8Array(source.wasmBinary);
    const wasmBinary = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
    prepareZXingModule({ overrides: { wasmBinary } });
  } else {
    const url = source.wasmUrl;
    prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? url : prefix + path) } });
  }
  prepared = true;
}

export const zxingPrepared = (): boolean => prepared;

/** Labels on cable tails are never square to the lens: rotation, inversion and
 *  tryHarder stay on. */
const READER_OPTIONS: ReaderOptions = {
  formats: [...ZXING_FORMATS],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  maxNumberOfSymbols: 8,
};

type Pixels = { width: number; height: number; data: Uint8ClampedArray };
const isPixels = (f: unknown): f is Pixels =>
  !!f && typeof f === 'object' && 'width' in f && 'height' in f && 'data' in f;
const isBlob = (f: unknown): f is Blob => typeof Blob !== 'undefined' && f instanceof Blob;

function sizeOf(frame: ScanFrame): { w: number; h: number } {
  const f = frame as Partial<Record<'videoWidth' | 'videoHeight' | 'naturalWidth' | 'naturalHeight' | 'width' | 'height', unknown>>;
  const n = (v: unknown): number => (typeof v === 'number' ? v : 0);
  return { w: n(f.videoWidth) || n(f.naturalWidth) || n(f.width), h: n(f.videoHeight) || n(f.naturalHeight) || n(f.height) };
}

/** A frame as something readBarcodes takes: ImageData and Blobs pass through
 *  (the reader decodes PNG/JPEG itself); anything drawable is drawn once into a
 *  scratch canvas no larger than MAX_FRAME_EDGE_PX. */
async function readable(frame: ScanFrame): Promise<Pixels | Blob | null> {
  if (isPixels(frame) || isBlob(frame)) return frame;
  const { w, h } = sizeOf(frame);
  if (!w || !h) return null;
  const k = Math.min(1, MAX_FRAME_EDGE_PX / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(cw, ch)
    : Object.assign(document.createElement('canvas'), { width: cw, height: ch });
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!ctx) return null;
  ctx.drawImage(frame as CanvasImageSource, 0, 0, cw, ch);
  return ctx.getImageData(0, 0, cw, ch);
}

/** The bundled engine as a FrameDecoder. Throws when unprepared (decodeFrame
 *  turns that into "saw nothing"). */
export const zxingDecoder: FrameDecoder = async (frame: ScanFrame): Promise<readonly ScanRead[]> => {
  if (!prepared) throw new Error('zxingDecoder: prepareZxing() has not been called');
  const input = await readable(frame);
  if (!input) return [];
  const found = await readBarcodes(input as ImageData | Blob, READER_OPTIONS);
  return cleanReads(found.filter((r) => r.isValid).map((r) => ({ text: r.text, format: r.format })));
};
