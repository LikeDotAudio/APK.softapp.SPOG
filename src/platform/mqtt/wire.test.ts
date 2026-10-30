// src/platform/mqtt/wire.test — the v3 compact wire: crosspoint interning, the
// protobuf LogMsg arm, seat/label on ValueMsg, full_id shrink in json_fallback —
// plus a payload-bytes measurement of v2 (default) vs v3 (?wire=compact).

import { describe, it, expect, afterEach } from 'vitest';
import { encodeAndEncrypt, decryptAndDecode } from './crypto.js';
import { setWireCompact, frontCode, frontDecode } from './wire.js';
import { spog } from './schema.js';

const FID = 'a1b2c3d4:TWIST:1761830000000', TS = 1761830123456;
const XP = ['CAM 1', 'CAM 2', 'CAM 3', 'CAM 4', 'MIC 1', 'MIC 2'];
const LOG = { voyage: 3, entry: 41, ts: TS, dest: 'Vision Mixer', prod: 'PROD 7', added: ['CAM 3'], removed: ['CAM 1'], text: '', role: 'Director', reversed: false, full_id: FID };
const REV = { ...LOG, text: 'Course reversed: Layout · PROD 7 — renamed container', reversed: true, reversedBy: 'Ana', reversedTs: TS + 9000 };
/** Representative traffic: what the bus publishes most (param drags, crosspoints, presence, log). */
const CASES: Record<string, unknown> = {
  'param (seat-ranked)': { value: 0.73, ts: TS, full_id: FID, seat: 100, label: 'A1 · Audio' },
  'crosspoints ×6': { value: XP, ts: TS, full_id: FID },
  'presence': { active: true, full_id: FID, ts: TS },
  'log (routing)': LOG,
  'log (reversal)': REV,
  'chat (json_fallback)': { id: 'x-1', from: 'PROD 7', text: 'stand by', ts: TS, full_id: FID },
};
const round = async (p: unknown): Promise<any> => decryptAndDecode(await encodeAndEncrypt(p));

afterEach(() => setWireCompact(null));

describe('frontCode (crosspoint interning)', () => {
  it('round-trips and keeps only what differs from the previous entry', () => {
    const fc = frontCode(XP);
    expect(fc.xpShared).toEqual([0, 4, 4, 4, 0, 4]);
    expect(fc.xpSuffix).toEqual(['CAM 1', '2', '3', '4', 'MIC 1', '2']);
    expect(frontDecode(fc.xpShared, fc.xpSuffix)).toEqual(XP);
  });
  it('never splits a surrogate pair across the shared prefix', () => {
    const list = ['CAM \u{1F3A5}A', 'CAM \u{1F3A6}B', 'X', ''];
    const fc = frontCode(list);
    fc.xpSuffix.forEach((s) => expect(s).toBe(new TextDecoder().decode(new TextEncoder().encode(s))));
    expect(frontDecode(fc.xpShared, fc.xpSuffix)).toEqual(list);
  });
});

describe('encode/decode', () => {
  for (const compact of [false, true]) {
    it(`round-trips every arm (compact=${compact})`, async () => {
      setWireCompact(compact);
      expect((await round(CASES['crosspoints ×6'])).value).toEqual(XP);
      const pv = await round(CASES['param (seat-ranked)']);
      expect(pv).toMatchObject({ value: 0.73, ts: TS, full_id: 'a1b2c3d4', seat: 100, label: 'A1 · Audio' });
      expect(await round(LOG)).toMatchObject({ ...LOG, full_id: 'a1b2c3d4' });
      expect(await round(REV)).toMatchObject({ ...REV, full_id: 'a1b2c3d4' });
      expect(await round(CASES['chat (json_fallback)'])).toMatchObject({ text: 'stand by', full_id: 'a1b2c3d4' });
    });
  }
  it('still decodes a v2 (pre-interning) crosspoint message', async () => {
    const legacy = spog.PayloadWrapper.encode(spog.PayloadWrapper.create({ valueMsg: { valueList: XP, originId: 0xa1b2c3d4, tsMs: TS } })).finish();
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('SPOG-ENTERPRISE-SECRET-KEY-2026-X'.padEnd(32, '0').substring(0, 32)), { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = new Uint8Array(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, legacy as unknown as BufferSource));
    const bytes = new Uint8Array(12 + ct.length); bytes.set(iv); bytes.set(ct, 12);
    expect(await decryptAndDecode(bytes)).toMatchObject({ value: XP, full_id: 'a1b2c3d4' });
  });
  it('a garbage payload decodes to null instead of throwing', async () => {
    expect(await decryptAndDecode(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]))).toBeNull();
  });
});

describe('payload bytes (AES-GCM framed: 12 B iv + 16 B tag included)', () => {
  it('v3 compact is never larger than v2, and smaller where it applies', async () => {
    const rows: string[] = [];
    let v2Total = 0, v3Total = 0;
    for (const [name, p] of Object.entries(CASES)) {
      setWireCompact(false); const v2 = (await encodeAndEncrypt(p)).length;
      setWireCompact(true); const v3 = (await encodeAndEncrypt(p)).length;
      v2Total += v2; v3Total += v3;
      rows.push(`${name.padEnd(22)} v2 ${String(v2).padStart(4)} B   v3 ${String(v3).padStart(4)} B`);
      expect(v3).toBeLessThanOrEqual(v2);
    }
    rows.push(`${'TOTAL'.padEnd(22)} v2 ${String(v2Total).padStart(4)} B   v3 ${String(v3Total).padStart(4)} B`);
    console.log(`[payload bytes]\n${rows.join('\n')}`);
    expect(v3Total).toBeLessThan(v2Total);
  });
});
