// src/ui/scan/scan-camera — the live camera feed for the SCAN panel (ROAD-3476).
//
// Rear camera, decoded a few times a second (not every animation frame — a
// phone decoding 60 fps drains its battery for no extra reads). One decode in
// flight at a time; the ScanGuard in the panel turns a label held in view into
// one scan.

import { decodeFrame } from '../../platform/scan/scan-decode.js';
import type { ScanRead } from '../../domain/scan/symbology.js';

/** Minimum gap between two decodes of the live feed. */
export const FRAME_GAP_MS = 150;

export interface CameraHandle { stop(): void }

/** Open the rear camera into `video` and feed every read to `onRead`. Rejects
 *  when there is no camera or permission is refused — the caller says so and
 *  points at the photo input. */
export async function startCamera(video: HTMLVideoElement, onRead: (r: ScanRead) => void): Promise<CameraHandle> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera API in this browser (or not a secure context)');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play().catch(() => undefined);

  let running = true, busy = false, last = 0, raf = 0;
  const tick = (t: number): void => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (busy || t - last < FRAME_GAP_MS || video.readyState < 2) return;
    busy = true; last = t;
    void decodeFrame(video).then((reads) => { if (running) reads.forEach(onRead); }).finally(() => { busy = false; });
  };
  raf = requestAnimationFrame(tick);

  return {
    stop(): void {
      running = false;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}
