// src/platform/import/off-thread — run the pipeline's byte-only stages (parse →
// translate → gate → normalise) in a Web Worker when the page can start one, and
// inline otherwise (node/vitest, or a worker that failed to load). The caller is
// told which, so a measurement never mistakes the fallback for the worker.
import { prepare, type Prepared } from '../../domain/pyramid/prepare.js';
import type { ImportFormat } from '../../domain/pyramid/interpret.js';
import type { PrepareRequest } from './prepare.worker.js';

export type Where = 'worker' | 'inline';

function inline(req: PrepareRequest): Promise<{ prepared: Prepared; where: Where }> {
  return Promise.resolve().then(() => ({ prepared: prepare(req.format, req.name, req.text), where: 'inline' as const }));
}

export function prepareOffThread(format: ImportFormat, name: string, text: string): Promise<{ prepared: Prepared; where: Where }> {
  const req: PrepareRequest = { format, name, text };
  if (typeof Worker === 'undefined') return inline(req);
  let worker: Worker;
  try {
    worker = new Worker(new URL('./prepare.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return inline(req);
  }
  return new Promise((resolve) => {
    worker.onmessage = (e: MessageEvent<Prepared>) => { worker.terminate(); resolve({ prepared: e.data, where: 'worker' }); };
    worker.onerror = (e) => {
      e.preventDefault();
      worker.terminate();
      console.warn('import worker failed — parsing on the main thread:', e.message);
      void inline(req).then(resolve);
    };
    worker.postMessage(req);
  });
}
