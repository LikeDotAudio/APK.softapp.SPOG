// src/platform/ocr/ocr-engine.test — REAL RECOGNITION (ROAD-3475): the rack-label
// photo (__fixtures__/make-fixtures.mjs) read by the pinned Tesseract engine in
// node — worker thread, core from node_modules, eng data from the pinned
// @tesseract.js-data/eng package, cache off, nothing fetched — then boxes,
// candidates and box navigation on what it really read. ~1 s on a laptop; this is
// the one slow test of the OCR suite and the only one that runs the engine.
import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOcrEngine, browserOptions, engineError, OCR_DIRS, type OcrEngine } from './ocr-engine.js';
import { extractCandidates } from '../../domain/ocr/candidates.js';
import { getAdjacentBoxId } from '../../domain/ocr/box-nav.js';
import { wordText, type OcrPage } from '../../domain/ocr/ocr-page.js';

const FIX = join(__dirname, '__fixtures__');
const LANG = join(__dirname, '../../../node_modules/@tesseract.js-data/eng/4.0.0_best_int');
const EXPECT = JSON.parse(readFileSync(join(FIX, 'FIXTURES.json'), 'utf8'))['rack-label.png'];
const png = readFileSync(join(FIX, 'rack-label.png'));
const W = png.readUInt32BE(16), H = png.readUInt32BE(20);   // IHDR

let engine: OcrEngine | null = null;
afterAll(async () => { await engine?.terminate(); });

describe('Tesseract (self-hosted) on a rack-label photo', () => {
  let page: OcrPage;
  it('reads word boxes off the photo', async () => {
    engine = await createOcrEngine({ langPath: LANG, cacheMethod: 'none', gzip: true });
    page = await engine.recognize(new Uint8Array(png), W, H);
    expect([page.width, page.height]).toEqual([W, H]);
    expect(page.words.length).toBeGreaterThanOrEqual(15);
    for (const w of page.words) {
      expect(w.x1).toBeGreaterThan(w.x0); expect(w.y1).toBeGreaterThan(w.y0);
      expect(w.x0).toBeGreaterThanOrEqual(0); expect(w.y1).toBeLessThanOrEqual(H);
    }
  }, 60_000);

  it('extracts the printed serial, MAC and asset tag — and nothing else', () => {
    const got = Object.fromEntries(extractCandidates(page).map((c) => [c.kind, c.value]));
    expect(got).toEqual(EXPECT.identity);
    expect(extractCandidates(page).every((c) => c.labelled)).toBe(true);
  });

  it('the serial came from the box on the S/N line, and the arrows move around the real label', () => {
    const serial = extractCandidates(page).find((c) => c.kind === 'serial')!;
    const box = page.words.find((w) => w.id === serial.wordIds[0])!;
    expect(wordText(box)).toBe('KX7R-24918');
    const label = page.words.find((w) => w.text === 'S/N:')!;
    expect(getAdjacentBoxId(page.words, label.id, 'right')).toBe(box.id);
    const below = page.words.find((w) => w.id === getAdjacentBoxId(page.words, label.id, 'down'))!;
    expect(below.text).toBe('MAC:');
    expect(page.words.find((w) => w.id === getAdjacentBoxId(page.words, below.id, 'up'))!.text).toBe('S/N:');
  });
});

describe('browser paths', () => {
  it('every engine file is same-origin under ocr/, and the core is one named file', () => {
    const o = browserOptions('https://spog.example/console/index.htm', true);
    expect(o).toEqual({
      workerPath: `https://spog.example/console/${OCR_DIRS.worker}worker.min.js`,
      corePath: `https://spog.example/console/${OCR_DIRS.core}tesseract-core-simd-lstm.wasm.js`,
      langPath: 'https://spog.example/console/ocr/lang/eng-4.0.0_best_int',
      workerBlobURL: false,
    });
    expect(browserOptions('https://spog.example/', false).corePath).toMatch(/tesseract-core-lstm\.wasm\.js$/);
  });
});

describe('an engine that cannot start rejects, promptly and by name', () => {
  // tesseract.js 7 never settled createWorker() when the language data (or the
  // core) failed inside the worker: the error was thrown uncaught and the OCR panel
  // waited forever. It must reject, naming the files, well inside a second or two.
  it('a missing language file is a named rejection, not a hang', async () => {
    const missing = join(__dirname, '__fixtures__', 'no-such-lang');
    const t0 = performance.now();
    const err = await Promise.race([
      createOcrEngine({ langPath: missing, cacheMethod: 'none', gzip: true }).then(
        async (e) => { await e.terminate(); return new Error('engine started without its language data'); },
        (e: unknown) => e,
      ),
      new Promise<Error>((r) => setTimeout(() => r(new Error('HUNG: createOcrEngine never settled')), 10_000)),
    ]) as Error;
    expect(err.message).toMatch(/^OCR engine did not start \(language data .*no-such-lang\): .*eng\.traineddata/);
    expect(performance.now() - t0).toBeLessThan(10_000);
  }, 15_000);

  it('names every engine file it was given, and says when no reason came back', () => {
    const o = browserOptions('https://spog.example/', true);
    const e = engineError(o, undefined);
    expect(e.message).toContain(`worker ${o.workerPath}`);
    expect(e.message).toContain(`core ${o.corePath}`);
    expect(e.message).toContain(`language data ${o.langPath}`);
    expect(e.message).toMatch(/: no reason given$/);
  });
});
