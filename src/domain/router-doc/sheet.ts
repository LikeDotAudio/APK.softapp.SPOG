// src/domain/router-doc/sheet — the flat two-tab model of the 1990s view import /
// export (Sources: Origin·Feed·Type·Color·Status; Destinations: Category·Room·Twist·…)
// and its pure readers: RFC-4180 CSV, the header-keyed column accessor and the
// broadcast name normalizers. Moved down from ui/console/router-io-sheet (ROAD-3474)
// so the import pipeline can run them in a Web Worker; the SpreadsheetML reader stays
// in ui/ because it needs DOMParser. Pure: no DOM, no globals.

export interface Sheet {
  name: string;
  headers: string[];
  rows: string[][];
}

// ---- CSV (RFC‑4180, quote‑aware) -------------------------------------------
const csvField = (v: string): string =>
  /[",\n]/.test(v ?? '') ? `"${(v ?? '').replace(/"/g, '""')}"` : (v ?? '');

/** One sheet as CSV text (header row + data rows). */
export function csv(sheet: Sheet): string {
  return [sheet.headers, ...sheet.rows].map((r) => r.map(csvField).join(',')).join('\r\n');
}

/** Parse CSV text → rows of fields. Handles quoted fields with commas/quotes/newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '', rec: string[] = [], inQ = false;
  const t = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { rec.push(field); field = ''; }
    else if (c === '\n') { rec.push(field); rows.push(rec); rec = []; field = ''; }
    else field += c;
  }
  if (field.length || rec.length) { rec.push(field); rows.push(rec); }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

/** Index a sheet's columns by header name (case/space‑insensitive) → row accessor. */
export function columnMap(sheet: Sheet): (row: string[], header: string) => string {
  const key = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const idx = new Map<string, number>();
  sheet.headers.forEach((h, i) => idx.set(key(h), i));
  return (r, header) => r[idx.get(key(header)) ?? -1] ?? '';
}

// ---- broadcast name normalizers (pure — shared by export display + import match) ----
const stripOrder = (s: string): string => s.replace(/^\d{3,}_/, '');           // filename order prefix
const stripLead = (s: string): string => s.replace(/^[^\p{L}\p{N}]+/u, '');    // leading emoji/glyph
/** Human display name: order prefix + leading emoji removed. */
export const cleanName = (s: string): string => stripLead(stripOrder((s || '').trim())).trim();
/** Match key: cleaned, upper, whitespace‑collapsed — so `📹 CAM 3` == `003_CAM 3` == `cam 3`. */
export const norm = (s: string): string => cleanName(s).toUpperCase().replace(/\s+/g, ' ').trim();
