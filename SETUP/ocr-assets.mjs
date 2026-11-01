// SETUP/ocr-assets.mjs — the self-hosted OCR engine files (ROAD-3475), put
// where src/platform/ocr/ocr-engine.ts looks for them:
//
//   ocr/tesseract.js-7.0.0/worker.min.js
//   ocr/tesseract.js-core-7.0.0/tesseract-core-simd-lstm.wasm.js
//   ocr/tesseract.js-core-7.0.0/tesseract-core-lstm.wasm.js
//   ocr/lang/eng-4.0.0_best_int/eng.traineddata.gz
//
// `vite build` emits them into dist/ocr/ through the bundle (so they land in
// whatever outDir the build uses, and SETUP/deploy.py uploads them with the
// rest of dist/); `vite` (dev) serves them from node_modules. The versions are
// read off the installed packages and must equal the pins, or the build stops —
// a path that says 7.0.0 must hold 7.0.0.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const NM = join(ROOT, 'node_modules');
const PINS = { 'tesseract.js': '7.0.0', 'tesseract.js-core': '7.0.0', '@tesseract.js-data/eng': '1.0.0' };

/** published path → source file */
export function ocrAssetMap() {
  const v = PINS['tesseract.js'], cv = PINS['tesseract.js-core'];
  return {
    [`ocr/tesseract.js-${v}/worker.min.js`]: join(NM, 'tesseract.js/dist/worker.min.js'),
    [`ocr/tesseract.js-core-${cv}/tesseract-core-simd-lstm.wasm.js`]: join(NM, 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js'),
    [`ocr/tesseract.js-core-${cv}/tesseract-core-lstm.wasm.js`]: join(NM, 'tesseract.js-core/tesseract-core-lstm.wasm.js'),
    'ocr/lang/eng-4.0.0_best_int/eng.traineddata.gz': join(NM, '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),
  };
}

export function checkPins() {
  for (const [pkg, want] of Object.entries(PINS)) {
    const pj = join(NM, pkg, 'package.json');
    const have = existsSync(pj) ? JSON.parse(readFileSync(pj, 'utf8')).version : 'missing';
    if (have !== want) throw new Error(`ocr-assets: ${pkg} is ${have}, pinned ${want} — run npm ci`);
  }
}

const TYPES = { '.js': 'text/javascript', '.gz': 'application/octet-stream' };

export function ocrAssetsPlugin() {
  return {
    name: 'ocr-assets',
    buildStart() { checkPins(); },
    generateBundle() {
      for (const [fileName, src] of Object.entries(ocrAssetMap())) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(src) });
      }
    },
    configureServer(server) {
      const map = ocrAssetMap();
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
        const src = map[path];
        if (!src) return next();
        res.setHeader('Content-Type', TYPES[path.slice(path.lastIndexOf('.'))] ?? 'application/octet-stream');
        res.end(readFileSync(src));
      });
    },
  };
}
