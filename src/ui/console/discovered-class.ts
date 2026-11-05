// src/ui/console/discovered-class — which group a discovered device is laid in:
// a METER when the BIM library says so (discovered-bim), else by its panel
// (discovered-gui) and its inputs/outputs (discovered-groups). Split from discovered.ts.

import { classify, type DeviceClass } from './discovered-groups.js';
import type { DeviceSetup } from './discovered-types.js';
import { panelOf } from './discovered-gui.js';
import { meterMap } from './discovered-bim.js';

/** The BIM library's role wins (a generator is a source, a coax router both);
 *  a running panel still makes a non-meter touch/display (classify). */
export const classOf = (d: DeviceSetup): DeviceClass => {
  const bim = meterMap().get(d.key);
  if (bim?.role === 'meter') return 'meter';
  const panel = panelOf(d);
  if (bim && !panel) return bim.role;
  return classify(d, panel);
};

/** Every device's class in one string — a change means the layer must be re-laid. */
export const classSignature = (devices: Iterable<DeviceSetup>): string =>
  [...devices].map((d) => `${d.key}=${classOf(d)}`).sort().join('|');
