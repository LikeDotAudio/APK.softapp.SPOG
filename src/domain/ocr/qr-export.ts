// src/domain/ocr/qr-export — EXPORT FROM PROJECT: the identity the netlist
// records, written back out as QR payloads (ROAD-3475, "every import has its
// export"). Pure: rows and the printable sheet; platform/ocr/qr-writer draws
// the symbols.
//
// A payload is the label text the importers already read: `S/N: <serial>`,
// `ASSET TAG: <tag>`, `MAC: <mac>`. The SCAN panel's Locate strips that prefix
// (netlist cleanValue) and lands on the unit again, so a printed sheet is a set
// of labels for units whose own label is missing or unreadable. A value that
// would not lead back to exactly its own unit (two cards hold it) is not
// written — it is listed in `skipped` with the reason.

import { locate, type IdentityField, type NetEntry } from '../scan/netlist.js';

export interface ExportRow {
  key: string;
  label: string;
  field: IdentityField;
  value: string;
  payload: string;
  /** The value is the discovered device's own report, not an authored record. */
  discovered: boolean;
}

export const PAYLOAD_PREFIX: Record<IdentityField, string> = { serial: 'S/N: ', asset_tag: 'ASSET TAG: ', mac: 'MAC: ' };
const FIELDS: IdentityField[] = ['serial', 'asset_tag', 'mac'];
const labelOf = (e: NetEntry): string => (e.parent ? `${e.parent} · ${e.name}` : e.name);

export function exportRows(entries: readonly NetEntry[]): { rows: ExportRow[]; skipped: string[] } {
  const rows: ExportRow[] = [];
  const skipped: string[] = [];
  for (const e of entries) for (const field of FIELDS) {
    const value = e[field];
    if (!value) continue;
    const payload = PAYLOAD_PREFIX[field] + value;
    const hits = locate(payload, entries);
    if (hits.length !== 1 || hits[0]!.entry.key !== e.key) {
      skipped.push(`${labelOf(e)}: ${field} ${value} — ${hits.length} units answer to it, so a scan could not tell them apart`);
      continue;
    }
    rows.push({ key: e.key, label: labelOf(e), field, value, payload, discovered: e.live });
  }
  return { rows, skipped };
}

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** One self-contained printable HTML page: a card per row (symbol, unit, the
 *  payload in clear). `svgs[i]` is row i's symbol, drawn by the QR writer. */
export function sheetHtml(title: string, rows: readonly ExportRow[], svgs: readonly string[], skipped: readonly string[] = []): string {
  const cards = rows.map((r, i) => `<figure class="card">${svgs[i] ?? ''}<figcaption><b>${esc(r.label)}</b><span>${esc(r.payload)}</span>${r.discovered ? '<i>as the device reports it</i>' : ''}</figcaption></figure>`).join('\n');
  const left = skipped.length ? `<section class="skipped"><h2>Not written (${skipped.length})</h2><ul>${skipped.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font:12px/1.3 system-ui,sans-serif;margin:12mm;color:black;background:white}h1{font-size:16px;margin:0 0 8mm}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(44mm,1fr));gap:6mm}
.card{margin:0;border:1px solid gray;border-radius:2mm;padding:3mm;break-inside:avoid;text-align:center}
.card svg{width:34mm;height:34mm}.card figcaption{display:flex;flex-direction:column;gap:1mm;word-break:break-all}
.card span{font-family:monospace}.card i{color:dimgray}.skipped{margin-top:8mm}@media print{h1{margin-bottom:4mm}}</style></head>
<body><h1>${esc(title)} — ${rows.length} code${rows.length === 1 ? '' : 's'}</h1><div class="grid">
${cards}
</div>${left}</body></html>`;
}
