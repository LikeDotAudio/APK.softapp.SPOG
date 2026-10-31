// src/ui/console/mission — a slim banner naming your active working context (the
// open destination + its group lineage), tied to your MISSION from the schedule
// (the show booked to that room, and whether you're on its crew).
// It DOCKS BESIDE THE CLOCK: the bottom row reads [mission · MQTT · time] — the
// dock position is computed from the live clock/chip rects, so it follows the
// row through both chiralities AND both faces (the clock corner swaps sides).
// Port of js/mission.js; clicking it opens the schedule. Mirrors the context into
// the URL as #on/<group>/<name> (replaceState, only when no overlay owns the hash).
import { addStyles } from '../dom.js';
import { role } from '../../platform/auth.js';
import { showSchedule, SCHEDULE, type Slot } from './schedule.js';
import { openTimeline } from './captains-log-timeline.js';
import { PAL, alpha } from '../../domain/palette.js';

const slug = (s: string): string => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fmt = (h: number): string => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
const nowH = (): number => { try { const d = new Date(); return d.getHours() + d.getMinutes() / 60; } catch { return 14.2; } };

const MZ_CSS = `
/* Rides the LANE the credits pill vacated (bottom:6, below the tab pills),
   docked beside the clock column — never over the footer tabs. */
.mz-bar{position:fixed;bottom:6px;z-index:1500;display:none;align-items:center;gap:10px;cursor:pointer;background:linear-gradient(90deg,${alpha(PAL.blue09s58, .92)},${alpha(PAL.blue12_0c1730, .92)});border:1px solid ${PAL.sky27};border-radius:999px;padding:5px 14px;font-family:Arial,Helvetica,sans-serif;color:${PAL.sky91};font-size:11px;letter-spacing:1px;box-shadow:0 4px 18px ${alpha(PAL.black, .45)};max-width:64vw;}
.mz-bar.show{display:inline-flex;}
.mz-bar:hover{border-color:${PAL.blue51};}
.mz-where{font-weight:900;color:${PAL.white};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:30vw;}
.mz-show{color:${PAL.sky81s100};white-space:nowrap;}
.mz-role{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.mz-dot{width:8px;height:8px;border-radius:50%;display:inline-block;box-shadow:0 0 6px currentColor;}
.mz-live{font-weight:900;border-radius:6px;padding:2px 8px;letter-spacing:1px;}
.mz-live.now{background:${PAL.red62};color:${PAL.white};animation:mzPulse 1.4s ease-in-out infinite;}
.mz-live.next{background:${PAL.blue19};color:${PAL.sky71};}
.mz-live.idle{background:${PAL.blue15};color:${PAL.blue53};}
@keyframes mzPulse{0%,100%{opacity:.8;}50%{opacity:1;box-shadow:0 0 12px ${alpha(PAL.red62, .7)};}}`;

interface Ctx { name: string; lineage: string[]; group: string }

function activeContext(): Ctx | null {
  const tab = document.querySelector<HTMLElement>('.lcars-tab.active');
  if (!tab) return null;
  const name = (tab.innerText || '').trim();
  if (!name) return null;
  const lineage: string[] = [];
  for (let g: Element | null = tab.closest('.lcars-group'); g; g = g.parentElement && g.parentElement.closest('.lcars-group')) {
    const l = g.querySelector<HTMLElement>(':scope > .lcars-group-label span');
    if (l) lineage.unshift(l.innerText.trim());
  }
  return { name, lineage, group: lineage[0] || 'DESTINATION' };
}

function matchSlot(ctx: Ctx): Slot | null {
  const hay = (ctx.name + ' ' + ctx.lineage.join(' ')).toLowerCase();
  const words = hay.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  let best: Slot | null = null, score = 0;
  SCHEDULE.forEach((sl) => {
    const room = (sl.room + ' ' + sl.show).toLowerCase();
    let sc = 0; words.forEach((w) => { if (room.indexOf(w) >= 0) sc++; });
    if (sc > score) { score = sc; best = sl; }
  });
  return score > 0 ? best : null;
}

const divisionColor = (tier: string): string => (/command/i.test(tier) ? PAL.red58s71 : /scien/i.test(tier) ? PAL.blue65s82 : PAL.amber55s73);

export function initMission(): void {
  if (document.querySelector('.mz-bar')) return;
  addStyles('mission-styles', MZ_CSS);
  const bar = document.createElement('div');
  bar.className = 'mz-bar';
  bar.title = 'Your current mission — click to open the timeline';
  bar.addEventListener('click', () => openTimeline());
  document.body.appendChild(bar);

  const setURL = (ctx: Ctx): void => {
    const h = location.hash || '';
    if (h && !/^#on\//.test(h)) return;   // an overlay/editor owns the hash
    const want = '#on/' + slug(ctx.group) + '/' + slug(ctx.name);
    if (h !== want) { try { history.replaceState(null, '', want); } catch { /* ignore */ } }
  };

  // Anchor the bar's outer edge to the clock column's side of the screen —
  // it starts where the time starts, in the lane just below it.
  const dock = (): void => {
    const clock = document.querySelector('.ptp-clock')?.getBoundingClientRect();
    if (!clock || !clock.width) { bar.style.right = '16px'; bar.style.left = 'auto'; return; }
    if (clock.left + clock.width / 2 < window.innerWidth / 2) {
      bar.style.left = `${Math.round(clock.left)}px`;
      bar.style.right = 'auto';
    } else {
      bar.style.right = `${Math.round(window.innerWidth - clock.right)}px`;
      bar.style.left = 'auto';
    }
  };

  const render = (): void => {
    const ctx = activeContext();
    if (!ctx) { bar.classList.remove('show'); return; }
    setURL(ctx);
    dock();
    const r = role();
    const slot = matchSlot(ctx);
    const now = nowH();
    let liveCls = 'idle', liveTxt = 'STANDBY';
    if (slot) {
      if (now >= slot.s && now < slot.e) { liveCls = 'now'; liveTxt = '● LIVE NOW'; }
      else if (slot.s > now) { liveCls = 'next'; liveTxt = 'UP ' + fmt(slot.s); }
      else { liveCls = 'idle'; liveTxt = 'WRAPPED'; }
    }
    const col = r ? divisionColor(r.tier) : PAL.blue53;
    const roleHtml = r
      ? `<span class="mz-role"><span class="mz-dot" style="color:${col}"></span>You: <b style="color:${col}">${r.name}</b> · ${r.sub || r.tier}</span>`
      : '';
    const showHtml = slot ? `<span class="mz-show">▣ ${slot.show}</span>` : `<span class="mz-show">▣ no show booked</span>`;
    bar.innerHTML = `<span class="mz-where">${ctx.group} · ${ctx.name}</span>${showHtml}${roleHtml}<span class="mz-live ${liveCls}">${liveTxt}</span>`;
    bar.classList.add('show');
  };

  let pending = false;
  const schedule = (): void => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; render(); }); };
  new MutationObserver(schedule).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  setInterval(render, 30000);
  window.addEventListener('resize', schedule);
  schedule();
}
