// src/editors/instrument — a bench instrument opened as what its family IS.
//
// ROAD-3516. Each INSTRUMENT.<Family> repo's thing.json names its roles; the
// Discovered layer lays a box whose family takes INPUTS and measures them as a
// destination (its twists = its BIM part's input jacks), and stamps each twist
// with `instrument` {label, family, model, roles, prefix}. editor-dispatch opens
// this editor on such a twist, whatever the jack is called:
//
//   metering    → every reading the box gives, live off <prefix>/Reading/#
//                 (the nab / get answers KOMAND publishes, whoever asked)
//   monitoring  → its trace, drawn by the shared scope lanes (the Meter Input
//                 drawScope3's painter, ui/audio-scope drawLanes) from the retained
//                 Captures/Rig/<device>
//
// Listen-only: nothing is sent to the box from here (the Data Logger polls; the
// touch panel drives). A box that presents no panel has no known prefix, and the
// editor says so rather than guess one.

import type { EditorPlugin } from '../types.js';
import { el, addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';
import { drawLanes, type Lane } from '../../ui/audio-scope.js';
import { panesFor, readingOf, readingsFilter, rigTopic, tracesOf, type Reading, type Trace } from './data.js';

const STYLE = `
.inst{display:flex;flex-direction:column;gap:8px;height:100%;color:${PAL.grey90s0};font:13px Inter,system-ui,sans-serif}
.inst .bar{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.inst .hint{color:${PAL.grey64};font-size:12px}
.inst .trace{flex:1;min-height:220px;display:flex;flex-direction:column;gap:4px}
.inst canvas{width:100%;flex:1;min-height:200px;background:${PAL.grey07_131313};border:1px solid ${PAL.grey21};border-radius:8px}
.inst .rows{overflow:auto;border:1px solid ${PAL.grey21};border-radius:8px;max-height:45%}
.inst table{width:100%;border-collapse:collapse;font:12px ui-monospace,monospace}
.inst td{padding:3px 8px;border-bottom:1px solid ${PAL.grey12}}
.inst td.v{text-align:right;color:${PAL.grey90s0}}
.inst td.n,.inst td.t{color:${PAL.grey64}}`;

const LANE_RGB = ['90,255,122', '255,212,0', '90,157,255', '255,110,180'];

const plugin: EditorPlugin = {
  id: 'instrument',
  title: 'Instrument',
  blurb: 'A bench instrument as its family says it is: its readings live, and its trace when it is a monitoring box.',
  order: 45,
  // Dispatched by the twist's `instrument` (editor-dispatch), not by a jack's name.
  match: (name) => /^INSTRUMENT$/i.test(name),
  render(host, ctx) {
    addStyles('inst-css', STYLE);
    const inst = ctx.twist.config?.instrument;
    const note = el('span', { class: 'hint' });
    const bar = el('div', { class: 'bar' }, [
      el('b', { textContent: `🔬 ${inst?.label ?? ctx.twist.name}` }),
      el('span', { class: 'hint', textContent: inst ? `${inst.family || 'instrument'} · ${inst.roles.join(' · ') || 'no roles'} · jack ${ctx.twist.name}` : '' }),
      note]);
    const root = el('div', { class: 'inst' }, [bar]);
    host.append(root);
    if (!inst) { note.textContent = 'This twist names no instrument.'; return; }
    const panes = panesFor(inst.roles);
    if (!inst.prefix) { note.textContent = 'This box presents no panel yet, so where it speaks on the bus is unknown.'; return; }
    if (!ctx.services.watchTopic) note.textContent = 'No bus on this page: nothing will arrive.';

    if (panes.trace) {
      const canvas = el('canvas');
      const say = el('div', { class: 'hint', textContent: 'Waiting for a trace from the capture recorder…' });
      root.append(el('div', { class: 'trace' }, [canvas, say]));
      let traces: Trace[] = [];
      const paint = (): void => {
        canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
        drawLanes(canvas, traces.map((t, i): Lane => [t.points, t.source, LANE_RGB[i % LANE_RGB.length]!]));
      };
      const topic = rigTopic(inst.prefix);
      if (topic) {
        const off = ctx.services.watchTopic?.(topic, (p) => {
          const next = tracesOf(p);
          if (!next.length) return;
          traces = next;
          const t = next[0]!;
          const span = t.start !== null && t.stop !== null ? ` · ${(t.stop - t.start).toPrecision(3)} s across` : '';
          say.textContent = `${next.map((x) => x.source).join(', ')} · ${t.points.length} points${span}`;
          paint();
        });
        if (off) ctx.dispose.add(off);
      }
      ctx.dispose.interval(paint, 1000);   // follow a resize
    }

    if (panes.readings) {
      const body = el('tbody');
      const rows = new Map<string, HTMLTableRowElement>();
      root.append(el('div', { class: 'rows' }, [el('table', {}, [body])]));
      const show = (r: Reading): void => {
        let tr = rows.get(r.name);
        if (!tr) {
          tr = el('tr', {}, [el('td', { class: 'n' }), el('td', { class: 'v' }), el('td', { class: 't' })]);
          rows.set(r.name, tr);
          const after = [...rows.keys()].sort().indexOf(r.name);
          body.insertBefore(tr, body.children[after] ?? null);
        }
        const [n, v, t] = [...tr.children] as HTMLElement[];
        n!.textContent = r.name;
        v!.textContent = r.unit ? `${r.value} ${r.unit}` : r.value;
        t!.textContent = r.ts ? r.ts.slice(11, 19) : '';
      };
      const off = ctx.services.watchTopic?.(readingsFilter(inst.prefix), (p, topic) => {
        const r = readingOf(topic, p);
        if (r) show(r);
      });
      if (off) ctx.dispose.add(off);
    }
  },
};

export default plugin;
