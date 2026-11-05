// src/editors/data-logger/series — the logger's data, pure (no DOM, no bus):
// what a meter said as a number, a rolling series per meter, the window a chart
// shows, and the CSV a run exports.
//
// A meter answers on its device's `/Read` topic as plain SCPI text: a reading is
// "+1.23456789E-03", an identity is "Agilent Technologies,33210A,…". Only the
// first number in a reply is a reading; a reply with none (an *IDN?, an error
// string) is not plotted — it is not a measurement.

export interface Sample { t: number; v: number }

export interface Series {
  key: string;        // the meter's identity key (serial / USB id) — never its address
  label: string;      // "Keysight 34401A #…"
  topic: string;      // its /Read topic
  samples: Sample[];
}

/** The first number in a SCPI reply, or null. "+9.9E37" (overload) is kept: it is what the meter said. */
export function reading(payload: unknown): number | null {
  const text = typeof payload === 'number' ? String(payload) : typeof payload === 'string' ? payload : '';
  const m = text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/);
  if (!m) return null;
  const v = Number(m[0]);
  // "Agilent Technologies,33210A,…" has digits in a model name: a reply that is
  // mostly letters is an answer, not a reading.
  if (/[A-Za-z]{3,}/.test(text.replace(/[eE][-+]?\d+/g, ''))) return null;
  return Number.isFinite(v) ? v : null;
}

/** Add one sample, keeping at most `max` (oldest dropped). */
export function push(s: Series, v: number, t: number, max = 20_000): void {
  s.samples.push({ t, v });
  if (s.samples.length > max) s.samples.splice(0, s.samples.length - max);
}

/** The samples inside the last `spanMs`, and their value range (padded when flat). */
export function windowOf(series: Series[], now: number, spanMs: number): { from: number; lo: number; hi: number } {
  const from = now - spanMs;
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of series) for (const p of s.samples) if (p.t >= from) { lo = Math.min(lo, p.v); hi = Math.max(hi, p.v); }
  if (!Number.isFinite(lo)) return { from, lo: 0, hi: 1 };
  if (lo === hi) { const pad = Math.abs(lo) * 0.05 || 0.5; lo -= pad; hi += pad; }
  return { from, lo, hi };
}

/** One CSV of every series: time (ISO), meter, value — the run, in order. */
export function toCsv(series: Series[]): string {
  const rows = series.flatMap((s) => s.samples.map((p) => ({ ...p, label: s.label })));
  rows.sort((a, b) => a.t - b.t);
  const esc = (x: string): string => (/[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
  return ['time,meter,value', ...rows.map((r) => `${new Date(r.t).toISOString()},${esc(r.label)},${r.v}`)].join('\n') + '\n';
}

/** The last value of a series and its stats over the window. */
export function stats(s: Series, from: number): { last: number | null; min: number; max: number; n: number } {
  const w = s.samples.filter((p) => p.t >= from);
  if (!w.length) return { last: s.samples.at(-1)?.v ?? null, min: NaN, max: NaN, n: 0 };
  return { last: w.at(-1)!.v, min: Math.min(...w.map((p) => p.v)), max: Math.max(...w.map((p) => p.v)), n: w.length };
}
