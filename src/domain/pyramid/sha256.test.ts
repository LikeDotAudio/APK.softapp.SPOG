// The pure SHA-256 fallback must give crypto.subtle's digest, or a chunk hashed on
// an http bench LAN would get a different address than the same chunk on https.
import { describe, it, expect } from 'vitest';
import { sha256HexBytes } from './sha256.js';

const enc = new TextEncoder();
const subtleHex = async (s: string): Promise<string> =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))), (b) => b.toString(16).padStart(2, '0')).join('');

describe('sha256 fallback', () => {
  it('matches the known empty-string digest', () => {
    expect(sha256HexBytes(new Uint8Array())).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  it('matches crypto.subtle across block boundaries and non-ASCII', async () => {
    for (const s of ['abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'STUDIO 01 — WALL 03 📹', 'x'.repeat(10000)]) {
      expect(sha256HexBytes(enc.encode(s))).toBe(await subtleHex(s));
    }
  });
});
