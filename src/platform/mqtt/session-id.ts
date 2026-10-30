// src/platform/mqtt/session-id — this console's per-boot identity "<hex8>:TWIST:<birth-ms>".
// Split out of client.ts (200-line rule). The 8-hex prefix is the ORIGIN every
// consumer reads (self-echo, log grouping); the wire carries only that prefix.

export function makeSessionId(): string {
  let hex = '';
  try {
    const b = new Uint8Array(4);
    crypto.getRandomValues(b);
    hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  } catch { hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0'); }
  return `${hex}:TWIST:${Date.now()}`;
}

/** The 8-hex origin prefix of a full_id ("a1b2c3d4:TWIST:…" → "a1b2c3d4"). */
export const originOf = (fullId: unknown): string => String(fullId ?? '').split(':')[0] ?? '';
