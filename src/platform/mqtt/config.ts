// src/platform/mqtt/config — broker persistence + URL resolution (audit §4.2).
//
// Extracted from client.ts: the localStorage-backed broker setting/config and the
// `?mqtt=`/localStorage/runtime-default URL resolver. Pure of the bus; the
// connection layer (client.ts) consumes these to open the socket.

import { runtimeConfig } from '../runtime-config.js';

const DEFAULT_PORT = 8081;
// Default host, LOCAL FIRST (the same policy as WEB.Frontend-Assets'
// comMQTT/connectionPool.js): the deployment's own broker from spog-config.js
// (`SPOG_CONFIG.broker`), else the broker behind the origin that served this page,
// `/mqtt` on the page's own host and port (the APK.audio gateway proxies it).
// No public broker is compiled in any more: `test.mosquitto.org` was the default
// while SPOG was a sandbox, and anyone on it could read the bus. A site that still
// wants the sandbox broker names it in its runtime config (SPOG_BROKER at deploy).
// Override per-session with `?mqtt=<host[:port]>`, localStorage.twistMqtt, or the
// connection form, as before.
function defaultHost(): string {
  const rc = runtimeConfig().broker;
  if (rc) return rc;
  const host = typeof location !== 'undefined' ? location.host : '';
  return host ? `${host}/mqtt` : '';
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
