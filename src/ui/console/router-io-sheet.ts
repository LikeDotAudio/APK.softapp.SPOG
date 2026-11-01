// src/ui/console/router-io-sheet — the workbook serializer/parser for the 1990s
// view import/export (audit: Documentation/Audit/1990s-View-Import-Export-Audit.md §5).
//
// Format = SpreadsheetML 2003 (.xml): a single file with multiple <Worksheet>s that
// Excel/LibreOffice open as real tabs — dependency‑free to WRITE (a template string)
// and to READ (the built‑in DOMParser). CSV is the universal per‑tab convenience.
// Pure + unit‑testable: no DOM scraping, no app state.

import { parseCsv, type Sheet } from '../../domain/router-doc/sheet.js';

// The pure model + CSV/naming readers live in domain/router-doc/sheet (the import
// pipeline runs them off the main thread); re-exported so callers keep one door.
export {
  csv, parseCsv, columnMap, cleanName, norm, type Sheet,
} from '../../domain/router-doc/sheet.js';

const xmlEsc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function cell(v: string): string {
  return `<Cell><Data ss:Type="String">${xmlEsc(v ?? '')}</Data></Cell>`;
}
function row(cells: string[]): string {
  return `<Row>${cells.map(cell).join('')}</Row>`;
}

/** Serialize sheets to a SpreadsheetML 2003 workbook (opens as multi‑tab in Excel). */
export function workbookXml(sheets: Sheet[]): string {
  const ws = sheets.map((s) => {
    const body = [row(s.headers), ...s.rows.map(row)].join('');
    return `<Worksheet ss:Name="${xmlEsc(s.name)}"><Table>${body}</Table></Worksheet>`;
  }).join('');
  return `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n`
    + `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"`
    + ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${ws}</Workbook>`;
}

/** Parse a workbook file's text (SpreadsheetML .xml OR CSV) into sheets. A CSV yields
 *  ONE sheet named from its content, so the caller routes it by its headers. */
export function parseWorkbook(text: string): Sheet[] {
  const t = text.trimStart();
  if (!/^<\?xml|^<\?mso|^<Workbook/i.test(t)) {
    const rows = parseCsv(text);
    const headers = rows.shift() ?? [];
    return [{ name: 'CSV', headers, rows }];
  }
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const sheets: Sheet[] = [];
  for (const wsEl of Array.from(doc.getElementsByTagName('Worksheet'))) {
    const name = wsEl.getAttribute('ss:Name') || wsEl.getAttribute('Name') || 'Sheet';
    const grid: string[][] = [];
    for (const rowEl of Array.from(wsEl.getElementsByTagName('Row'))) {
      const cells: string[] = [];
      let col = 0;
      for (const cEl of Array.from(rowEl.getElementsByTagName('Cell'))) {
        const idx = cEl.getAttribute('ss:Index');
        if (idx) { const n = Number(idx) - 1; while (col < n) { cells.push(''); col++; } }
        const data = cEl.getElementsByTagName('Data')[0];
        cells.push(data?.textContent ?? ''); col++;
      }
      grid.push(cells);
    }
    const headers = grid.shift() ?? [];
    sheets.push({ name, headers, rows: grid });
  }
  return sheets;
}

