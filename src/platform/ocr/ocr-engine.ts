// src/platform/ocr/ocr-engine — Tesseract, self-hosted, loaded on demand
// (ROAD-3475).
//
// tesseract.js is pinned EXACT at 7.0.0, its core (tesseract.js-core) at 7.0.0
// and the English LSTM data (@tesseract.js-data/eng, 4.0.0_best_int) at 1.0.0.
// Left alone the library fetches all three from cdn.jsdelivr.net; here every
// path is SPOG's own:
//
//   workerPath  ocr/tesseract.js-7.0.0/worker.min.js        (started directly —
//               workerBlobURL:false — so no blob: shim a CSP would have to allow)
//   corePath    ocr/tesseract.js-core-7.0.0/<one file>     the SIMD+LSTM build when
//               this browser validates a SIMD module, else the plain LSTM build;
//               naming the file skips the library's own probe and its CDN default
//   langPath    ocr/lang/eng-4.0.0_best_int/                eng.traineddata.gz,
//               kept in IndexedDB by tesseract.js after the first read
//
// SETUP/ocr-assets.mjs copies those files into dist/ocr/ at build time and
// serves them in dev. They sit OUTSIDE dist/assets, so the service worker does
// not precache ~7 MB of OCR into every console that never opens it; the worker
// caches the versioned /ocr/ paths on first use instead.
//
// Recognition runs in tesseract's own Web Worker. ONE engine is kept warm for a
// run of photos and let go after IDLE_MS with nothing to read.

import type { Worker as TessWorker } from 'tesseract.js';
import { pageFromTesseract, type OcrPage, type TesseractPageLike } from '../../domain/ocr/ocr-page.js';

export const TESSERACT_VERSION = '7.0.0';
export const OCR_DIRS = {
  worker: `ocr/tesseract.js-${TESSERACT_VERSION}/`,
  core: `ocr/tesseract.js-core-${TESSERACT_VERSION}/`,
  lang: 'ocr/lang/eng-4.0.0_best_int/',
} as const;
export const CORE_FILES = { simd: 'tesseract-core-simd-lstm.wasm.js', plain: 'tesseract-core-lstm.wasm.js' } as const;
export const IDLE_MS = 60_000;

export interface EngineOptions {
  workerPath?: string;
  corePath?: string;
  langPath: string;
  workerBlobURL?: boolean;
  cacheMethod?: 'write' | 'readOnly' | 'refresh' | 'none';
  gzip?: boolean;
}

/** The smallest module using a v128 op (wasm-feature-detect's `simd` probe). */
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
export function hasWasmSimd(wasm: Pick<typeof WebAssembly, 'validate'> | undefined = globalThis.WebAssembly): boolean {
  try { return !!wasm && wasm.validate(SIMD_PROBE); } catch { return false; }
}

/** Absolute same-origin URLs: the core and the data are fetched from INSIDE the
 *  worker, where a relative path would resolve against the worker script. */
export function browserOptions(base: string, simd = hasWasmSimd()): EngineOptions {
  const at = (p: string): string => new URL(p, base).href;
  return {
    workerPath: at(OCR_DIRS.worker + 'worker.min.js'),
    corePath: at(OCR_DIRS.core + (simd ? CORE_FILES.simd : CORE_FILES.plain)),
    langPath: at(OCR_DIRS.lang).replace(/\/$/, ''),
    workerBlobURL: false,
  };
}

export type OcrImage = Blob | Uint8Array | ArrayBuffer;

export interface OcrEngine {
  /** Read one image. `width`/`height` are the image's own pixel size. */
  recognize(image: OcrImage, width: number, height: number): Promise<OcrPage>;
  terminate(): Promise<void>;
}

/** Start one engine. In the browser pass browserOptions(); in node, a langPath
 *  directory and cacheMethod 'none' (node reads its core from node_modules). */
export async function createOcrEngine(opts: EngineOptions): Promise<OcrEngine> {
  const { createWorker, OEM } = await import('tesseract.js');
  // tesseract.js 7 settles createWorker() only when the worker SCRIPT fails to
  // load (and then with `undefined`). A core or language file that fails inside
  // the worker reaches errorHandler and nothing else: without one it is thrown
  // uncaught and createWorker() never settles, so the OCR panel would wait
  // forever. The handler turns it into a rejection naming the engine files, which
  // the panel shows. (The half-started worker is unreachable then and stays idle;
  // recognizeShared drops the failed start and the next run starts a fresh one.)
  let failed!: (reason: unknown) => void;
  const failure = new Promise<never>((_, reject) => { failed = reject; });
  let worker: TessWorker;
  try {
    worker = await Promise.race([
      createWorker('eng', OEM.LSTM_ONLY, { ...opts, errorHandler: (e: unknown) => failed(e) }),
      failure,
    ]);
  } catch (err) {
    throw engineError(opts, err);
  }
  return {
    async recognize(image, width, height) {
      const input = image instanceof ArrayBuffer ? new Uint8Array(image) : image;
      const r = await worker.recognize(input as Parameters<TessWorker['recognize']>[0], {}, { blocks: true, text: false });
      return pageFromTesseract(r.data as unknown as TesseractPageLike, width, height);
    },
    terminate: async () => { await worker.terminate(); },
  };
}

/** The error a failed engine start becomes: which files, and why. */
export function engineError(opts: EngineOptions, err: unknown): Error {
  const why = err instanceof Error ? err.message : err === undefined ? 'no reason given' : String(err);
  const files = [opts.workerPath && `worker ${opts.workerPath}`, opts.corePath && `core ${opts.corePath}`, `language data ${opts.langPath}`]
    .filter(Boolean).join(', ');
  return new Error(`OCR engine did not start (${files}): ${why}`, { cause: err });
}

// ---- the page's one shared engine -------------------------------------------
let shared: Promise<OcrEngine> | null = null;
let idle: ReturnType<typeof setTimeout> | null = null;
let busy = 0;

/** Read with the shared browser engine, starting it on first use. A failed start
 *  is thrown to the caller (and retried next time), never turned into "no text". */
export async function recognizeShared(image: OcrImage, width: number, height: number, base: string): Promise<OcrPage> {
  if (idle) { clearTimeout(idle); idle = null; }
  busy++;
  try {
    shared ??= createOcrEngine(browserOptions(base)).catch((e: unknown) => { shared = null; throw e; });
    return await (await shared).recognize(image, width, height);
  } finally {
    if (--busy === 0) idle = setTimeout(() => { void releaseShared(); }, IDLE_MS);
  }
}

export async function releaseShared(): Promise<void> {
  if (idle) { clearTimeout(idle); idle = null; }
  const cur = shared;
  shared = null;
  if (cur) await cur.then((e) => e.terminate(), () => undefined);
}

/** True once an engine has started in this page (for the panel's status line). */
export const engineWarm = (): boolean => shared !== null;
