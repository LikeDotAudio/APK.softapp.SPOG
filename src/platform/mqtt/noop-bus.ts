// src/platform/mqtt/noop-bus — the bus with no broker (split out of client.ts
// for the 200-line rule). Graceful degradation: `ready` still resolves and every
// call is a no-op, so the console boots identically with or without MQTT.

import type { TwistBus } from './types.js';

export /** A bus that does nothing but keeps the app happy when no broker is configured. */
function noopBus(sessionId: string): TwistBus {
  return {
    ready: Promise.resolve(),
    sessionId,
    status: () => ({ enabled: false, connected: false }),
    publishConfig: () => {},
    publishValue: () => {},
    publishRaw: () => {},
    publishExternal: () => {},
    subscribe: () => () => {},
    dispose: () => {},
  };
}
