// src/platform/mqtt/config — broker persistence + URL resolution (audit §4.2).
//
// Extracted from client.ts: the localStorage-backed broker setting/config and the
// `?mqtt=`/localStorage/runtime-default URL resolver. Pure of the bus; the
// connection layer (client.ts) consumes these to open the socket.

import { runtimeConfig } from '../runtime-config.js';

const DEFAULT_PORT = 8081;
// Default host — the same decision WEB.Frontend-Assets' shared bus helper makes
// (SRC/FrontEnd/shared/apk-bus.js, and comMQTT/connectionPool.js before it):
//   1. the deployment's own broker from spog-config.js (`SPOG_CONFIG.broker`;
//      the word `same-origin` means `/mqtt` on this page's host and port);
//   2. `/mqtt` on the page's own origin, ONLY when the host is a bench address
//      (loopback, RFC 1918, `.local`) — the APK.audio gateway proxies it there;
//   3. otherwise NO broker: on a public origin the bus is a no-op, by design.
// No public broker is ever a default: the public sandbox broker was compiled in while
// SPOG was a sandbox (owner flag of 2026-07-08), and anyone on it could read the
// bus. A site that still wants the sandbox broker names it in SPOG_BROKER at deploy.
// Override per-session with `?mqtt=<host[:port]>`, localStorage.twistMqtt, or the
// connection form, as before.
// Kept equal to apk-bus.js BENCH_HOST (runtime-key.test.ts pins the cases): SPOG ships
// standalone to spog.like.audio too, where that helper is not served, so it cannot load it.
const BENCH_HOST = /^(?:localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[?::1\]?)$/;
export const isBenchHost = (hostname: string): boolean => {
  const h = String(hostname || '').toLowerCase();
  return BENCH_HOST.test(h) || /\.local$/.test(h);
};
function defaultHost(): string {
  const host = typeof location !== 'undefined' ? location.host : '';
  const rc = runtimeConfig().broker;
  if (rc) return rc === 'same-origin' ? (host ? `${host}/mqtt` : '') : rc;
  const hostname = typeof location !== 'undefined' ? (location.hostname ?? host.replace(/:\d+$/, '')) : '';
  return host && isBenchHost(hostname) ? `${host}/mqtt` : '';
}

const LS_KEY = 'twistMqtt';
const LS_PORT = 'twistMqttPort', LS_USER = 'twistMqttUser', LS_PASS = 'twistMqttPass';
const LS_ENABLED = 'twistMqttEnabled';
const DEFAULT_USER = '', DEFAULT_PASS = '';

const lsGet = (k: string, d: string): string => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };

/** The persisted broker setting (host[:port] or ws(s):// url). Falls back to the
 *  default host (runtime config, else same-origin /mqtt) only when never set; an explicit Disable stores '' so the
 *  bus stays off across reloads instead of snapping back to the default. */
export function getBrokerSetting(): string {
  try { return localStorage.getItem(LS_KEY) ?? defaultHost(); } catch { return defaultHost(); }
}
/** Persist the broker setting; a trimmed-empty host stores '' → MQTT disabled next
 *  boot (a stored '' beats the default; use it to opt out of the default host). */
export function setBrokerSetting(host: string): void {
  try { localStorage.setItem(LS_KEY, (host || '').trim()); } catch { /* ignore */ }
}

const LS_PLAINTEXT = 'twistMqttPlaintext';

/** The full broker connection config — host, port, and credentials. Port/user/pass
 *  always resolve to a value (the defaults) so the connection form is never blank. */
export interface BrokerConfig { host: string; port: number; username: string; password: string; plaintext: boolean; enabled: boolean; }
export function getBrokerConfig(): BrokerConfig {
  return {
    host: getBrokerSetting(),
    port: Number(lsGet(LS_PORT, String(DEFAULT_PORT))) || DEFAULT_PORT,
    username: lsGet(LS_USER, DEFAULT_USER),
    password: lsGet(LS_PASS, DEFAULT_PASS),
    plaintext: lsGet(LS_PLAINTEXT, 'false') === 'true',
    enabled: lsGet(LS_ENABLED, 'true') !== 'false',
  };
}
/** Persist any subset of the broker config (host '' clears MQTT next boot). */
export function setBrokerConfig(c: Partial<BrokerConfig>): void {
  try {
    if (c.host !== undefined) setBrokerSetting(c.host);
    if (c.port !== undefined) localStorage.setItem(LS_PORT, String(c.port));
    if (c.username !== undefined) localStorage.setItem(LS_USER, c.username);
    if (c.password !== undefined) localStorage.setItem(LS_PASS, c.password);
    if (c.plaintext !== undefined) localStorage.setItem(LS_PLAINTEXT, String(c.plaintext));
    if (c.enabled !== undefined) localStorage.setItem(LS_ENABLED, String(c.enabled));
  } catch { /* ignore */ }
}

/** Resolve the broker WS url from `?mqtt=`, localStorage, or the default host. */
export function resolveBrokerUrl(): string | null {
  if (lsGet(LS_ENABLED, 'true') === 'false') return null;
  let raw = '';
  try {
    raw = new URLSearchParams(location.search).get('mqtt')
      ?? localStorage.getItem('twistMqtt')
      ?? defaultHost();
  } catch { raw = defaultHost(); }
  raw = (raw || '').trim();
  if (!raw || raw === 'off' || raw === '0') return null;
  if (/^wss?:\/\//i.test(raw)) return raw;
  const proto = (typeof location !== 'undefined' && location.protocol === 'https:') ? 'wss' : 'ws';
  const port = Number(lsGet(LS_PORT, String(DEFAULT_PORT))) || DEFAULT_PORT;
  if (raw.includes(':') || raw.includes('/')) {
    // If it already has a port or a path, assume the user provided the full host spec
    return `${proto}://${raw}`;
  }
  return `${proto}://${raw}:${port}`;
}
