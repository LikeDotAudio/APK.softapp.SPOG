// src/platform/runtime-config — what a DEPLOYMENT tells the console, read at run time.
//
// Nothing secret or site-specific is compiled into the bundle. A deployment may
// serve `spog-config.js` next to the entry HTML (a classic script loaded before
// the app, see index.next.html); it sets
//
//     window.SPOG_CONFIG = { broker?: string, busKey?: string }
//
//   broker  host[:port][/path] or a ws(s):// URL — the bus this site talks to.
//   busKey  the AES-GCM bus key string (crypto.ts derives the key from it).
//
// The repo ships `public/spog-config.js` with neither set. SETUP/deploy.py
// rewrites it in dist/ from the deploy settings SPOG_BROKER / SPOG_BUS_KEY
// (SETUP/.env or CI secrets), so spog.like.audio and the APK.audio image can each
// name their own broker and key without a rebuild.

export interface SpogRuntimeConfig { broker?: string; busKey?: string; }

declare global {
  interface Window { SPOG_CONFIG?: SpogRuntimeConfig; }
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/** The deployment's runtime config (empty when no spog-config.js set one). */
export function runtimeConfig(): SpogRuntimeConfig {
  const c = (typeof window !== 'undefined' && window.SPOG_CONFIG) || {};
  return { broker: str(c.broker), busKey: str(c.busKey) };
}
