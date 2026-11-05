// src/editors/data-logger — the DATA LOGGER: monitoring as a graph.
//
// Owner (2026-11-04): "can we use a graph on the monitoring... a logger". Opened on a
// twist named LOGGER / GRAPH / TREND (the Meters group carries a Data Logger with
// LOGGER 1..4). It lists the bench's meters from the BIM library (DATABASE.server.BIM
// /api/bim/instances — online, presenting a panel, so their topics are known), and for
// each one ticked:
//   · listens to the meter's own `…/Read` (every answer it gives, whoever asked);
//   · optionally POLLS — publishes its query (default `:READ?`) on its `…/Write` every
//     N seconds, the same plain-SCPI convention the bench's hour chime uses;
//   · plots it on a strip chart, keeps last / min / max, and exports the run as CSV.
// Nothing is invented: a reply with no number (an *IDN?, an error) is not plotted.

import type { EditorPlugin } from '../types.js';
import { el, addStyles } from '../../ui/dom.js';
import { hint } from '../../ui/tip.js';
import { PAL } from '../../domain/palette.js';
import { push, reading, stats, toCsv, type Series } from './series.js';
import { COLOURS, draw, fmt } from './chart.js';

interface Meter { key: string; name: string; prefix: string }

const STYLE = `
.dlog{display:flex;flex-direction:column;gap:8px;height:100%;color:${PAL.grey90s0};font:13px Inter,system-ui,sans-serif}
.dlog .bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dlog select,.dlog input,.dlog button{background:${PAL.grey08};color:${PAL.grey90s0};border:1px solid ${PAL.grey21};border-radius:6px;padding:4px 8px;font:inherit}
.dlog button{cursor:pointer}
.dlog .body{display:grid;grid-template-columns:300px 1fr;gap:8px;flex:1;min-height:260px}
.dlog .list{overflow:auto;border:1px solid ${PAL.grey21};border-radius:8px;padding:6px}
.dlog .row{display:grid;grid-template-columns:auto 1fr;gap:4px 6px;align-items:center;padding:4px 2px;border-bottom:1px solid ${PAL.grey12}}
.dlog .row input[type=text]{grid-column:2;width:100%;box-sizing:border-box}
.dlog .row .val{grid-column:2;color:${PAL.grey64};font:12px ui-monospace,monospace}
.dlog canvas{width:100%;height:100%;background:${PAL.grey07_131313};border:1px solid ${PAL.grey21};border-radius:8px}
.dlog .hint{color:${PAL.grey64};font-size:12px}`;

const SPANS: [string, number][] = [['1 min', 60_000], ['10 min', 600_000], ['1 h', 3_600_000]];
const POLLS: [string, number][] = [['listen only', 0], ['every 1 s', 1000], ['every 2 s', 2000], ['every 5 s', 5000], ['every 10 s', 10_000]];

async function benchMeters(): Promise<Meter[]> {
  const r = await fetch('/api/bim/instances?state=online', { cache: 'no-store' });
  if (!r.ok) throw new Error(`the BIM library answered ${r.status}`);
  const items = ((await r.json()) as { items: { key: string; name: string; panel?: { prefix?: string }; part?: { category?: string } }[] }).items;
  return items.filter((i) => i.part?.category === 'Test & Measurement' && i.panel?.prefix)
    .map((i) => ({ key: i.key, name: i.name, prefix: i.panel!.prefix! }));
}

const plugin: EditorPlugin = {
  id: 'data-logger',
  title: 'Data Logger',
  blurb: 'Graph and log any bench meter over time — listen to its readings or poll it, export CSV.',
  order: 40,
  match: (name) => /\b(LOGGER|GRAPH|TREND)\b/i.test(name),
  render(host, ctx) {
    addStyles('dlog-css', STYLE);
    const series = new Map<string, Series & { query: string; off?: () => void }>();
    let span = SPANS[0]![1];
    let pollMs = 0;
    const canvas = el('canvas');
    const list = el('div', { class: 'list' });
    const note = el('div', { class: 'hint', textContent: 'Loading the bench’s meters from the BIM library…' });
    const spanSel = el('select'); SPANS.forEach(([l, v]) => spanSel.append(el('option', { value: String(v), textContent: l })));
    const pollSel = el('select'); POLLS.forEach(([l, v]) => pollSel.append(el('option', { value: String(v), textContent: l })));
    spanSel.onchange = () => { span = Number(spanSel.value); };
    pollSel.onchange = () => { pollMs = Number(pollSel.value); };
    const csv = el('button', { textContent: '⬇ CSV' });
    csv.onclick = () => {
      const a = el('a', { href: URL.createObjectURL(new Blob([toCsv([...series.values()])], { type: 'text/csv' })) });
      a.download = `${ctx.twist.name.replace(/\W+/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.csv`;
      a.click();
    };
    const clear = el('button', { textContent: 'Clear' });
    clear.onclick = () => series.forEach((s) => { s.samples.length = 0; });
    host.append(el('div', { class: 'dlog' }, [
      el('div', { class: 'bar' }, [el('b', { textContent: `📈 ${ctx.twist.name}` }), spanSel, pollSel, csv, clear, note]),
      el('div', { class: 'body' }, [list, canvas])]));

    const toggle = (m: Meter, on: boolean, query: string): void => {
      const had = series.get(m.key);
      if (!on) { had?.off?.(); series.delete(m.key); return; }
      if (had) return;
      const s = { key: m.key, label: m.name, topic: `${m.prefix}/Read`, samples: [], query };
      const off = ctx.services.watchTopic?.(s.topic, (p) => { const v = reading(p); if (v !== null) push(s, v, Date.now()); });
      series.set(m.key, { ...s, off });
    };

    benchMeters().then((meters) => {
      note.textContent = meters.length ? `${meters.length} meter(s) on the bench — tick one to log it.` : 'No meter on the bench presents a panel yet.';
      if (!ctx.services.watchTopic) note.textContent += ' (No bus on this page: nothing will arrive.)';
      for (const m of meters) {
        const box = el('input', { type: 'checkbox' });
        const q = el('input', { type: 'text', value: ':READ?' });
        hint(q, 'The query a poll sends to this meter on its …/Write (plain SCPI); its answer arrives on …/Read.');
        const val = el('div', { class: 'val', textContent: '—' });
        box.onchange = () => toggle(m, box.checked, q.value);
        q.onchange = () => { const s = series.get(m.key); if (s) s.query = q.value; };
        list.append(el('div', { class: 'row', dataset: { key: m.key } }, [box, el('span', { textContent: m.name }), q, val]));
      }
    }).catch((e: Error) => { note.textContent = `The BIM library could not be read: ${e.message}`; });

    ctx.dispose.interval(() => {
      if (!pollMs || !ctx.services.sendTopic) return;
      const due = Math.floor(Date.now() / pollMs) !== Math.floor((Date.now() - 250) / pollMs);
      if (due) series.forEach((s) => ctx.services.sendTopic!(s.topic.replace(/\/Read$/, '/Write'), s.query));
    }, 250);
    ctx.dispose.raf(() => {
      const now = Date.now();
      const all = [...series.values()];
      draw(canvas, all, now, span);
      all.forEach((s, i) => {
        const row = list.querySelector<HTMLElement>(`[data-key="${CSS.escape(s.key)}"] .val`);
        if (!row) return;
        const st = stats(s, now - span);
        row.style.color = COLOURS[i % COLOURS.length]!;
        row.textContent = st.last === null ? 'waiting…' : `${fmt(st.last)}  (min ${fmt(st.min)} · max ${fmt(st.max)} · ${st.n})`;
      });
    });
    ctx.dispose.add(() => series.forEach((s) => s.off?.()));
  },
};

export default plugin;
