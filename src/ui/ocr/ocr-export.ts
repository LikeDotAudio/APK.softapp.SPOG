// src/ui/ocr/ocr-export — EXPORT FROM PROJECT (ROAD-3475): every serial, asset
// tag and MAC the netlist records, as a printable sheet of QR labels the SCAN
// panel reads back. The sheet is a self-contained .html download — nothing is
// sent anywhere.

import { exportRows, sheetHtml } from '../../domain/ocr/qr-export.js';
import { loadNetlist } from '../../platform/scan/netlist-load.js';
import { loadQrWriter, writeQr } from '../../platform/ocr/qr-writer.js';
import type { Tone } from '../scan/scan-act.js';

function download(name: string, html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function exportQrSheet(): Promise<{ line: string; tone: Tone }> {
  const { rows, skipped } = exportRows(await loadNetlist());
  if (!rows.length) {
    return { line: `EXPORT — the netlist records no serial, asset tag or MAC${skipped.length ? ` it could write (${skipped.length} ambiguous)` : ''}; nothing written`, tone: 'warn' };
  }
  await loadQrWriter();
  const svgs: string[] = [];
  for (const r of rows) svgs.push((await writeQr(r.payload)).svg);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  download(`SPOG identity QR sheet ${stamp}.html`, sheetHtml('SPOG identity labels', rows, svgs, skipped));
  return { line: `EXPORT → ${rows.length} QR label${rows.length === 1 ? '' : 's'} written to a printable sheet${skipped.length ? ` · ${skipped.length} left (ambiguous — listed on the sheet)` : ''}`, tone: skipped.length ? 'warn' : 'ok' };
}
