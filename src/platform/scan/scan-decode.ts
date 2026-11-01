// src/platform/scan/scan-decode — one frame or still in, the codes it holds out,
// whichever engine answers (ROAD-3476).
//
// CAPABILITY, NEVER A BROWSER NAME. Android Chrome and macOS Chrome ship the
// platform `BarcodeDetector`; Safari, Firefox and Linux desktop Chrome do not.
// So the question asked is "does THIS runtime build a detector for our three
// formats", not "which browser is this":
//
//   native      the platform detector — hardware-accelerated, already in memory
//   registered  the bundled zxing-wasm engine (zxing-decoder.ts), registered
//               lazily by load-decoder.ts when a SCAN surface opens
//   none        nothing can decode — the surface must SAY so, not show a
//               camera that never beeps
//
// The wasm engine is registered, never imported here, so nothing that merely
// mentions scanning pulls ~1 MB of WebAssembly into the main bundle.
//
// decodeFrame never throws: a blurred frame, a lost focus or a torn-down
// detector all answer "saw nothing" ([]), which is what a camera pointed at a
// wall says too. Nothing is ever invented — no read, no result.

import { NATIVE_FORMATS, cleanReads, type ScanRead } from '../../domain/scan/symbology.js';

/** Anything a decoder can look at: a playing <video>, a canvas, ImageData,
 *  an ImageBitmap, or a still off the photo input (a Blob/File). */
export type ScanFrame = ImageBitmapSource;

export type FrameDecoder = (frame: ScanFrame) => Promise<readonly ScanRead[]>;
export type ScanEngine = 'native' | 'registered' | 'none';

interface NativeDetector { detect(frame: ScanFrame): Promise<ReadonlyArray<{ rawValue?: string; format?: string }>> }
type NativeCtor = new (opts?: { formats?: readonly string[] }) => NativeDetector;

let registered: FrameDecoder | null = null;
let nativeInstance: NativeDetector | null = null;
let nativeFrom: NativeCtor | null = null;

function nativeDetector(): NativeDetector | null {
  const ctor = (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector;
  if (typeof ctor !== 'function') { nativeInstance = null; nativeFrom = null; return null; }
  if (nativeInstance && nativeFrom === ctor) return nativeInstance;
  try {
    nativeInstance = new (ctor as NativeCtor)({ formats: NATIVE_FORMATS });
    nativeFrom = ctor as NativeCtor;
  } catch {
    // The constructor exists but refuses these formats — fall through.
    nativeInstance = null; nativeFrom = null;
  }
  return nativeInstance;
}

/** Declare the bundled engine. Returns the unregister function. */
export function registerFrameDecoder(decoder: FrameDecoder): () => void {
  registered = decoder;
  return () => { if (registered === decoder) registered = null; };
}

/** Which engine would answer a frame right now. */
export function scanEngine(): ScanEngine {
  if (nativeDetector()) return 'native';
  return registered ? 'registered' : 'none';
}

const isBlob = (f: unknown): f is Blob => typeof Blob !== 'undefined' && f instanceof Blob;

async function viaNative(native: NativeDetector, frame: ScanFrame): Promise<ScanRead[]> {
  // detect() is specified over ImageBitmapSource, but a Blob is not accepted
  // everywhere — decode the still to a bitmap first.
  const src = isBlob(frame) && typeof createImageBitmap === 'function' ? await createImageBitmap(frame) : frame;
  const found = await native.detect(src);
  return cleanReads(found.map((h) => ({ text: h.rawValue, format: h.format })));
}

async function viaRegistered(frame: ScanFrame): Promise<ScanRead[]> {
  if (!registered) return [];
  const found = await registered(frame);
  return cleanReads(found.map((r) => ({ text: r.text, format: r.symbology })));
}

/** Every code in one frame. For a STILL (Blob) the native detector going blank
 *  is not the last word: the bundled engine (tryHarder, rotation, inversion)
 *  gets a second look, because a dark-rack flash photo is exactly where the
 *  platform detector gives up. Live video frames get one engine — speed wins. */
export async function decodeFrame(frame: ScanFrame): Promise<ScanRead[]> {
  const native = nativeDetector();
  if (native) {
    let reads: ScanRead[] = [];
    try { reads = await viaNative(native, frame); } catch { reads = []; }
    if (reads.length || !isBlob(frame)) return reads;
  }
  try { return await viaRegistered(frame); } catch { return []; }
}
