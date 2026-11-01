// src/platform/scan/netlist-load — read the netlist the SCAN panel matches
// against: every Routes/Sources and Routes/Destinations document, through the
// same discovery path the console draws from (ROAD-3476).
//
// listDirectory/fetchJSON consult the live (discovered) layer and the drafts
// first, so a device discovered a second ago and a serial Filled a second ago
// are both in the netlist without a reload.

import { listDirectory, fetchJSON } from '../discovery.js';
import { isLive } from '../routes-store.js';
import { entriesOf, type NetEntry } from '../../domain/scan/netlist.js';

export const NETLIST_ROOTS = ['Routes/Sources/', 'Routes/Destinations/'] as const;

/** Never descend into the destination ICON-face tiles (not devices). */
const SKIP_DIR = /^\.?icons?\/?$/i;

async function walk(base: string, urls: string[]): Promise<void> {
  const { dirs, files } = await listDirectory(base);
  for (const f of files) urls.push(base + f.href);
  await Promise.all(dirs.filter((d) => !SKIP_DIR.test(d.name)).map((d) => walk(base + d.href, urls)));
}

/** Every netlist entry under the Routes roots. Unreadable files are skipped. */
export async function loadNetlist(roots: readonly string[] = NETLIST_ROOTS): Promise<NetEntry[]> {
  const urls: string[] = [];
  await Promise.all(roots.map((r) => walk(r, urls).catch(() => undefined)));
  const docs = await Promise.all(urls.map(async (u) => [u, await fetchJSON(u)] as const));
  return docs.flatMap(([u, doc]) => entriesOf(u, doc, isLive(u)));
}
