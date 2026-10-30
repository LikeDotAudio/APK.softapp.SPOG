// src/ui/console/captains-log-timeline-staffing — the Timeline Viewer's NEEDS STAFFING
// view. The ×N overlap badge only says "this lane double-books at peak"; this turns it
// into an actionable list: for every crew-role (WHO) or production-room (HOW) lane,
// each window where two or more bookings run at once → WHEN (start–end), WHO/WHAT (the
// lane), HOW MANY more operators / rooms, and WHICH shows collide. Pure model + HTML,
// plus a small drawer the view toggles from the ⚠ STAFFING button or a ×N badge.
import { el } from '../dom.js';

export interface SPlan { s: number; e: number; showName?: string; label?: string }
export interface SLane { type?: string; name: string; plans: SPlan[] }
export interface StaffNeed { lane: string; kind: 'crew' | 'room'; s: number; e: number; peak: number; extra: number; shows: string[] }

/** Every window (ending after `now`) where a crew/room lane is booked twice or more. */
export function needsStaffing(lanes: SLane[], now = -Infinity): StaffNeed[] {
  const out: StaffNeed[] = [];
  for (const ln of lanes) {
    if (ln.type !== 'who' && ln.type !== 'how') continue;
    const plans = ln.plans.filter((p) => p.e > p.s);
    // Sweep line: +1 at a start, −1 at an end; an end sorts BEFORE a start at the same
    // instant so back-to-back bookings (rehearsal → air → teardown) don't count.
    const pts = plans.flatMap((p) => [{ t: p.s, d: 1 }, { t: p.e, d: -1 }]).sort((a, b) => a.t - b.t || a.d - b.d);
    const wins: StaffNeed[] = [];
    let n = 0, open: StaffNeed | null = null;
    for (const { t, d } of pts) {
      n += d;
      if (n >= 2) {
        if (!open) open = { lane: ln.name, kind: ln.type === 'how' ? 'room' : 'crew', s: t, e: t, peak: n, extra: 0, shows: [] };
        open.peak = Math.max(open.peak, n);
      } else if (open) {
        open.e = t;
        if (open.e > open.s) wins.push(open);
        open = null;
      }
    }
    for (const w of wins) {
      w.extra = w.peak - 1;
      w.shows = [...new Set(plans.filter((p) => p.s < w.e && p.e > w.s).map((p) => p.showName || p.label || '?'))];
      out.push(w);
    }
  }
  return out.filter((w) => w.e > now).sort((a, b) => a.s - b.s || a.lane.localeCompare(b.lane));
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
const when = (ts: number): string => new Date(ts).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const hhmm = (ts: number): string => new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/** Drawer body: one row per window, optionally scoped to a single lane (a ×N click). */
export function staffingHtml(needs: StaffNeed[], scope = ''): string {
  const rows = scope ? needs.filter((w) => w.lane === scope) : needs;
  const head = `<div class="tl-staff-h">⚠ NEEDS STAFFING${scope ? ` · ${esc(scope)}` : ''} <span>(${rows.length})</span><span class="x" data-staff-close>✕</span></div>`;
  if (!rows.length) return head + `<div class="tl-staff-none">— no double-bookings ahead —</div>`;
  return head + rows.map((w) => {
    const what = w.kind === 'room' ? `room${w.extra === 1 ? '' : 's'}` : `operator${w.extra === 1 ? '' : 's'}`;
    return `<div class="tl-staff-row" data-staff-at="${w.s}" title="scroll the timeline to this clash">`
      + `<b>${esc(when(w.s))}–${esc(hhmm(w.e))}</b> <i>${esc(w.lane)}</i> needs <em>+${w.extra} ${what}</em>`
      + `<div class="tl-staff-shows">${w.shows.map(esc).join(' · ')}</div></div>`;
  }).join('');
}

export const STAFF_CSS = `
.tl-staff{position:absolute;right:16px;top:110px;z-index:9;width:340px;max-height:60%;overflow:auto;display:none;background:#0a1120;border:1px solid #ff6a6a;border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,.65);font:11px/1.45 'Courier New',monospace;color:#e6f2ff;}
.tl-staff.open{display:block;}
.tl-staff-h{position:sticky;top:0;display:flex;gap:6px;align-items:center;padding:7px 11px;background:#3a1010;color:#ff9a9a;font-weight:bold;letter-spacing:1px;}
.tl-staff-h .x{margin-left:auto;cursor:pointer;color:#c88;}
.tl-staff-row{padding:6px 11px;border-bottom:1px solid #1d2942;cursor:pointer;}
.tl-staff-row:hover{background:#16233d;}
.tl-staff-row em{font-style:normal;font-weight:900;color:#ff6a6a;}
.tl-staff-row i{color:#6FC8F0;font-style:normal;}
.tl-staff-shows{color:#8a99a8;font-size:10px;}
.tl-staff-none{padding:10px 11px;color:#7e93b5;}
.tl-conflict{cursor:pointer;}
`;

/** The drawer + its toggle button. `needs()` is recomputed on every open/refresh;
 *  `scrollTo(ts)` pans the timeline to a clash. Failures degrade to an empty list so a
 *  bad booking never takes the rest of the Timeline Viewer down. */
export function makeStaffing(needs: () => StaffNeed[], scrollTo: (ts: number) => void): { btn: HTMLElement; drawer: HTMLElement; refresh: () => void; open: (scope?: string) => void } {
  const btn = el('button', { class: 'tl-btn', title: 'Who / what / when a second operator or room is needed' }, ['⚠ STAFFING']);
  const drawer = el('div', { class: 'tl-staff' });
  let scope = '';
  const safe = (): StaffNeed[] => { try { return needs(); } catch (err) { console.warn('[timeline] staffing scan failed', err); return []; } };
  const refresh = (): void => {
    const list = safe();
    btn.textContent = `⚠ STAFFING (${list.length})`;
    btn.classList.toggle('on', drawer.classList.contains('open'));
    if (drawer.classList.contains('open')) drawer.innerHTML = staffingHtml(list, scope);
  };
  const open = (sc = ''): void => { scope = sc; drawer.classList.add('open'); refresh(); };
  btn.addEventListener('click', () => { if (drawer.classList.contains('open') && !scope) drawer.classList.remove('open'); else open(); refresh(); });
  drawer.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-staff-close]')) { drawer.classList.remove('open'); refresh(); return; }
    const row = t.closest<HTMLElement>('[data-staff-at]');
    if (row) scrollTo(Number(row.dataset['staffAt']));
  });
  return { btn, drawer, refresh, open };
}
