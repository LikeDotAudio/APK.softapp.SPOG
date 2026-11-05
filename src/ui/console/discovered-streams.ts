// src/ui/console/discovered-streams — one source leaf per SAP / Ravenna / AES67
// stream a discovered device sends (pure). Split from discovered-layer.

import { slugId } from '../sources/format.js';
import { streamChannels, type DeviceIO, type DeviceSetup } from './discovered-types.js';

/** Lay each stream as its own source leaf in `srcDir`, numbered after `srcFiles`. */
export function layStreams(
  out: Map<string, unknown>, d: DeviceSetup, streamOutputs: DeviceIO[],
  srcDir: string, srcFiles: string[], base: string, common: Record<string, unknown>,
): void {
  streamOutputs.forEach((s) => {
    const isRavenna = s.wire === 'ravenna' || (s.wire === 'aes67' && d.wires.includes('ravenna'));
    const isSap = s.wire === 'sap' || (s.wire === 'aes67' && d.wires.includes('sap'));
    const flavors: { tag: string; wire: string }[] = [];

    if (isRavenna && isSap) {
      flavors.push({ tag: 'RAVENNA', wire: 'ravenna' });
      flavors.push({ tag: 'SAP', wire: 'sap' });
    } else if (isSap) {
      flavors.push({ tag: 'SAP', wire: 'sap' });
    } else if (isRavenna) {
      flavors.push({ tag: 'RAVENNA', wire: 'ravenna' });
    } else {
      flavors.push({ tag: (s.wire || 'AES67').toUpperCase(), wire: s.wire || 'aes67' });
    }

    flavors.forEach(({ tag, wire }) => {
      const n = String(srcFiles.length + 1).padStart(3, '0');
      const streamSlug = slugId(`${s.name}-${tag}`);
      const f = `${n}_${base}_${streamSlug}.json`;
      const channels = streamChannels(s.format, s.name);
      const displayName = s.name.toUpperCase().includes(tag) ? s.name : `${s.name} (${tag})`;
      out.set(srcDir + f, {
        id: `disc-${d.key}-${streamSlug}`,
        name: displayName,
        extraClass: 'audio-imported audio-stream',
        items: channels,
        wire: wire,
        format: s.format ?? null,
        address: s.address ?? d.address,
        port: s.port ?? null,
        ...common
      });
      srcFiles.push(f);
    });
  });
}
