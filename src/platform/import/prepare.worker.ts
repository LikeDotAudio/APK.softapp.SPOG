// src/platform/import/prepare.worker — the import pipeline's Web Worker: parse,
// translate, gate and normalise (domain/pyramid/prepare) off the main thread, and
// post back a finished Topology or a refusal naming the stage.
import { prepare } from '../../domain/pyramid/prepare.js';
import type { ImportFormat } from '../../domain/pyramid/interpret.js';

export interface PrepareRequest { format: ImportFormat; name: string; text: string }

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<PrepareRequest>) => void) | null;
  postMessage(v: unknown): void;
};

scope.onmessage = (e) => {
  const { format, name, text } = e.data;
  scope.postMessage(prepare(format, name, text));
};
