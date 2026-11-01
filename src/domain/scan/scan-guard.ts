// src/domain/scan/scan-guard — one label held in front of a camera is ONE scan,
// not one per frame (ROAD-3476).
//
// A camera decodes the same code several times a second for as long as it is
// pointed at a label, and a batch photo import can carry the same tag in many
// stills. Without this every frame would Locate, Fill or log a Verify again.
//
// The window is PER CODE TEXT, not one timer for the surface: walking down a
// rack, the next label often arrives inside the window the last one opened, and
// suppressing it would silently miss a device. A repeat of the same text is
// dropped; a different text is always a new scan.
//
// The window runs from the LAST sighting, not the first: measured from the
// first, a label the camera never left would re-fire every window.
//
// It holds no clock — `now` is passed in, so it is pure and testable without
// fake timers.

/** How long the same code stays a repeat after it was last seen. */
export const REPEAT_WINDOW_MS = 2000;

/** Beyond this many distinct codes the least recently seen is forgotten.
 *  Forgetting only ever ADMITS a scan that would have been suppressed — a
 *  visible, recoverable duplicate rather than a silent miss. */
export const MAX_REMEMBERED = 256;

export class ScanGuard {
  private readonly seen = new Map<string, number>();
  private readonly windowMs: number;

  constructor(windowMs = REPEAT_WINDOW_MS) {
    this.windowMs = windowMs;
  }

  /** Should this read be acted on? Admitting (or suppressing) restarts the
   *  code's window. Empty text is never admitted. */
  admit(text: string, now: number): boolean {
    const key = String(text ?? '').trim();
    if (!key) return false;
    const last = this.seen.get(key);
    const repeat = last !== undefined && now - last < this.windowMs;
    // Re-insert so Map order is least-recently-seen first (eviction order).
    this.seen.delete(key);
    this.seen.set(key, now);
    while (this.seen.size > MAX_REMEMBERED) {
      const oldest = this.seen.keys().next();
      if (oldest.done) break;
      this.seen.delete(oldest.value);
    }
    return !repeat;
  }

  /** Let the next read of `text` through — the scan it caused was undone. */
  forget(text: string): void {
    this.seen.delete(String(text ?? '').trim());
  }

  /** Forget everything — the camera closed or the netlist changed. */
  clear(): void {
    this.seen.clear();
  }
}
