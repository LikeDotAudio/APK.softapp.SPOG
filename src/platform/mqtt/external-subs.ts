// src/platform/mqtt/external-subs — subscriptions OUTSIDE SPOG/.
//
// The client subscribes `SPOG/#` on connect and filters everything else locally,
// so an absolute topic (`APK.audio/…` — e.g. the Discovery Engine's device
// setups, ui/console/discovered.ts) would never arrive. A filter whose root is
// dotted is subscribed on the broker as well: at once if connected, and again on
// every (re)connect. SPOG's own filters are relative suffixes and are untouched.

import type { MqttClient } from './mqtt-load.js';

export const isExternal = (filter: string): boolean => (filter.split('/')[0] ?? '').includes('.');

export function externalSubscriptions(): {
  add(filter: string, live: MqttClient | null): void;
  resubscribe(client: MqttClient): void;
} {
  const filters = new Set<string>();
  return {
    add(filter, live) {
      if (!isExternal(filter) || filters.has(filter)) return;
      filters.add(filter);
      live?.subscribe(filter, { qos: 0 });
    },
    resubscribe(client) {
      for (const f of filters) client.subscribe(f, { qos: 0 });
    },
  };
}
