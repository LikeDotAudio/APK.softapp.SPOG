// src/ui/console/router-io — the 1990s VIEW spreadsheet IMPORT / EXPORT (two tabs:
// Sources + Destinations). Builds the workbook model from the SAME DOM scrapers the
// crosspoint grid uses, serializes via router-io-sheet, and replays imports via
// router-io-apply. Imports enter through platform/import/pipeline. See Documentation/Audit/1990s-View-Import-Export-Audit.md.

import { el } from '../dom.js';
import {
  firstLine, splitParent, gatherSenderNodes, gatherReceivers, loadAllSources, loadAllDest,
} from './router-view-gather.js';
import { parseConfig } from './matrix-groups.js';
import { csv, parseWorkbook, columnMap, cleanName, type Sheet } from './router-io-sheet.js';
import type { Sheets } from '../../domain/pyramid/interpret.js';
import { runImport } from '../../platform/import/pipeline.js';
import { memoryProjects } from '../../platform/import/projects.js';
import { toJson } from '../../domain/router-doc/json.js';
import { applyRoutes, type Route, type ImportMode, type ApplySummary } from './router-io-apply.js';
import { authorDevices } from './router-io-devices.js';
import { trueInkVar } from '../ink-var.js';

export type ImportSummary = ApplySummary & { created: number };

const SRC_HEADERS = ['Origin', 'Feed', 'Type', 'Color', 'Status'];
const DST_HEADERS = ['Category', 'Room', 'Twist', 'Accepts', 'Row', 'Routed Origin', 'Routed Feed', 'Type'];

/** Coarse signal category from the node class, falling back to the label wording. */
function typeOf(node: HTMLElement | null | undefined, label: string): string {
  if (node?.classList) {
    if (node.classList.contains('video')) return 'video';
    if (node.classList.contains('control') || node.classList.contains('camera-control')) return 'control';
    if (node.classList.contains('audio')) return 'audio';
  }
  return /tally|on.?air|\bpgm\b|\bpvw\b|signal|control|gpi/i.test(label) ? 'control'
    : /\bcam\b|v\d|video|-v\b/i.test(label) ? 'video' : 'audio';
}

function buildSourcesSheet(): Sheet {
  const rows: string[][] = [];
  gatherSenderNodes().forEach((labels, origin) => labels.forEach((node, label) => {
    // The feed's data colour, never its paint (style.color is var(--sig-node), resolved per mode).
    const color = (node && (trueInkVar(node, '--sig-node') ?? trueInkVar(node, 'border-color'))) || '';
    rows.push([origin, label, typeOf(node, label), color, node?.dataset.status || '']);
  }));
  rows.sort((a, b) => (a[0]!).localeCompare(b[0]!) || (a[1]!).localeCompare(b[1]!));
  return { name: 'Sources', headers: SRC_HEADERS, rows };
}

/** The routed feeds physically sitting in a twist's drop‑zone (groups expanded). */
function routedFeedsOf(el: HTMLElement): Array<{ origin: string; feed: string; type: string }> {
  const dz = el.querySelector<HTMLElement>('.drop-zone'); if (!dz) return [];
  const out: Array<{ origin: string; feed: string; type: string }> = [];
  dz.querySelectorAll<HTMLElement>(':scope > .signal-node').forEach((node) => {
    const feeds = node.classList.contains('dropped-group')
      ? [...node.querySelectorAll<HTMLElement>('.dropped-group-children .signal-node')] : [node];
    feeds.forEach((f) => {
      const label = firstLine(f); if (!label) return;
      out.push({ origin: f.dataset.origin || node.dataset.origin || label, feed: label, type: typeOf(f, label) });
    });
  });
  return out;
}

function buildDestSheet(): Sheet {
  const rows: string[][] = [];
  gatherReceivers().forEach((twists, prod) => twists.forEach((el, tname) => {
    const cfg = parseConfig(el);
    const cat = el.dataset.prodFloor || splitParent(prod)[0] || '';
    const room = cleanName(prod), twist = cleanName(tname);
    const accepts = cfg?.accepts || '', band = cfg?.row || '';
    const feeds = routedFeedsOf(el);
    if (!feeds.length) rows.push([cat, room, twist, accepts, band, '', '', '']);
    else feeds.forEach((f) => rows.push([cat, room, twist, accepts, band, f.origin, f.feed, f.type]));
  }));
  return { name: 'Destinations', headers: DST_HEADERS, rows };
}

async function buildSheets(): Promise<Sheet[]> {
  await loadAllSources(); await loadAllDest();   // render everything so the inventory is complete
  return [buildSourcesSheet(), buildDestSheet()];
}

function download(filename: string, text: string, mime: string): void {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: mime })), download: filename });
  document.body.append(a); a.click(); a.remove();
}

/** Local export timestamp `YYYYMMDD.HHMM` — sorts chronologically in a file list. */
function stamp(): string {
  const d = new Date(), p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Export as one hierarchical JSON document (parents nested: Studio→Wall→Box /
 *  Facility→Room→twist; crosspoints on each twist's `routed[]`). */
export async function exportWorkbook(): Promise<void> {
  const [src, dst] = await buildSheets();
  download(`1990s-view.${stamp()}.json`, toJson(src!, dst!, stamp()), 'application/json');
}
/** Export each tab as a CSV (universal — Google Sheets, awk, diffs). */
export async function exportCsv(): Promise<void> {
  const [src, dst] = await buildSheets();
  const ts = stamp();
  download(`1990s-sources.${ts}.csv`, csv(src!), 'text/csv');
  download(`1990s-destinations.${ts}.csv`, csv(dst!), 'text/csv');
}

// The console's one routing state is one project in the pipeline's store, so a
// re-import is a delta against the last one (and the next version of its series).
const projects = memoryProjects();

/** The 1990s view's commit: author any new Source devices, then replay the
 *  Destinations routes into the live DOM. */
async function replay(sheets: Sheets, mode: ImportMode): Promise<ImportSummary> {
  await loadAllSources();                                   // render the existing catalog first
  const dev = sheets.sources ? await authorDevices(sheets.sources) : { created: 0 };
  await loadAllSources(); await loadAllDest();              // (re)render everything for matching
  const dst = sheets.destinations;
  if (!dst) {
    if (dev.created) return { created: dev.created, added: 0, removed: 0, rejected: [], unmatched: [] };
    throw new Error('No Destinations tab found (needs columns Room, Twist, Routed Feed).');
  }
  const col = columnMap(dst);
  const imported: Route[] = [];
  for (const r of dst.rows) {
    const feed = col(r, 'Routed Feed').trim(); if (!feed) continue;
    imported.push({ room: col(r, 'Room').trim(), twist: col(r, 'Twist').trim(), origin: col(r, 'Routed Origin').trim(), feed });
  }
  return { created: dev.created, ...applyRoutes(imported, mode) };
}

/** Import a workbook (spog.router/1 JSON, CSV, or legacy SpreadsheetML) through the
 *  one import pipeline (platform/import/pipeline, ROAD-3474): sniff → parse in a Web
 *  Worker → gate → normalise → diff → commit (= the DOM replay above). Stages 7–8
 *  (layout chunks) are skipped: no SPOG view reads the pyramid yet, and publishing
 *  would only grow IndexedDB. */
export async function importWorkbook(text: string, mode: ImportMode, file = '1990s-view'): Promise<ImportSummary> {
  const r = await runImport<ImportSummary>(text, {
    file, name: '1990s view', parseXml: parseWorkbook, projects, cache: null,
    commit: (value) => replay(value.sheets, mode),
  });
  if (r.notes.length) console.info('[import]', file, r.notes.join(' · '));
  return r.committed!;
}
