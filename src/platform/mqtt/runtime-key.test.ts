// src/platform/mqtt/runtime-key.test — the bus key and the default broker are
// run-time inputs (2026-10-30 audit): nothing secret or public-broker-shaped is
// compiled into the bundle, and SPOG subscribes only under its own root.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { encodeAndEncrypt, decryptAndDecode, setBusKey, hasBusKey, busKeyString } from './crypto.js';
import { resolveBrokerUrl, getBrokerSetting } from './config.js';

afterEach(() => { setBusKey(undefined); vi.unstubAllGlobals(); });

describe('bus key', () => {
  it('has no key unless one is provided at run time', () => {
    expect(busKeyString()).toBeNull();
    expect(hasBusKey()).toBe(false);
  });
  it('refuses to encrypt without a key', async () => {
    await expect(encodeAndEncrypt({ value: 1, ts: 1, full_id: 'a1b2c3d4:TWIST:1' })).rejects.toThrow(/not configured/);
  });
  it('reads the key from the deployment runtime config', () => {
    vi.stubGlobal('window', { SPOG_CONFIG: { busKey: 'from-spog-config' } });
    expect(busKeyString()).toBe('from-spog-config');
  });
  it('round-trips with a key and cannot be read with another', async () => {
    setBusKey('key-one');
    const bytes = await encodeAndEncrypt({ value: 0.5, ts: 7, full_id: 'a1b2c3d4:TWIST:1' });
    expect((await decryptAndDecode(bytes)).value).toBe(0.5);
    setBusKey('key-two');
    expect(await decryptAndDecode(bytes)).toBeNull();
  });
  it('still reads plaintext JSON with no key (the keyless publish path)', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ value: 3, full_id: 'x' }));
    expect((await decryptAndDecode(bytes)).value).toBe(3);
  });
});

describe('default broker is local-first', () => {
  it('defaults to /mqtt on the page origin', () => {
    vi.stubGlobal('location', { host: 'bench.local:8080', protocol: 'https:', search: '' });
    expect(getBrokerSetting()).toBe('bench.local:8080/mqtt');
    expect(resolveBrokerUrl()).toBe('wss://bench.local:8080/mqtt');
  });
  it('lets the deployment name its broker', () => {
    vi.stubGlobal('location', { host: 'spog.example', protocol: 'https:', search: '' });
    vi.stubGlobal('window', { SPOG_CONFIG: { broker: 'broker.example:8081/ws' } });
    expect(resolveBrokerUrl()).toBe('wss://broker.example:8081/ws');
  });
});

describe('nothing site-specific in the source', () => {
  const files = (d: string): string[] => readdirSync(d, { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? files(join(d, e.name)) : /\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [join(d, e.name)] : []);
  const src = files('src').map((f) => [f, readFileSync(f, 'utf8')] as const);
  it('compiles in no public broker host', () => {
    expect(src.filter(([, s]) => /test\.mosquitto\.org|hivemq\.com|emqx\.io/.test(s.replace(/\/\/.*$/gm, ''))).map(([f]) => f)).toEqual([]);
  });
  it('subscribes only under its own SPOG/ root', () => {
    const client = readFileSync('src/platform/mqtt/client.ts', 'utf8');
    expect(client).toMatch(/subscribe\(`\$\{SPOG_ROOT\}\/#`/);
    expect(client).not.toMatch(/'devices\/#'/);
  });
});
