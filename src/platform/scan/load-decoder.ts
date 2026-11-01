// src/platform/scan/load-decoder — pull the zxing-wasm engine in only when a
// SCAN surface is about to look at a frame (ROAD-3476).
//
// Both imports are DYNAMIC, so neither the glue nor the ~0.95 MB .wasm lands in
// the console's main bundle. The .wasm arrives through Vite's `?url`: the build
// copies it into dist/assets/ under a content hash and hands back its relative,
// same-origin URL. vite.config.ts precaches every dist/assets file in the
// service worker, and SETUP/deploy.py uploads dist/assets/** — so the decoder
// works offline once loaded and never consults the package's jsDelivr default.
//
// Loaded even where the platform BarcodeDetector exists: scan-decode still
// prefers native, and the bundled engine is the second look for stills and the
// fallback for a detector that refuses our formats.

import { registerFrameDecoder } from './scan-decode.js';

let loading: Promise<() => void> | null = null;

/** Prepare and register the bundled decoder. Idempotent; a failed load is
 *  retried on the next call. Resolves to the unregister function. */
export function loadBundledDecoder(): Promise<() => void> {
  if (!loading) {
    loading = (async () => {
      const [engine, wasm] = await Promise.all([
        import('./zxing-decoder.js'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ]);
      engine.prepareZxing({ wasmUrl: wasm.default });
      return registerFrameDecoder(engine.zxingDecoder);
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}
