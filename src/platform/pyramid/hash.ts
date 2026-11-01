// src/platform/pyramid/hash — the content address of a layout chunk: SHA-256 of the
// group's canonical JSON, hex. `crypto.subtle` when the page has it (a secure
// context: https or localhost); the pure fallback (domain/pyramid/sha256) on a bench
// LAN over http, where `crypto.subtle` is undefined. Both give the same digest.
import { sha256HexBytes } from '../../domain/pyramid/sha256.js';

const encoder = new TextEncoder();

export async function sha256Hex(text: string): Promise<string> {
  const bytes = encoder.encode(text);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    try {
      const digest = new Uint8Array(await subtle.digest('SHA-256', bytes));
      return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
    } catch { /* fall through to the pure hasher */ }
  }
  return sha256HexBytes(bytes);
}
