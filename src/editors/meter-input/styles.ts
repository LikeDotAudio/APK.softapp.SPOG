// src/editors/meter-input/styles — CSS for the (real-video) Meter Input editor.
// LCARS "okudagram" chrome: an EDIT DETECTOR title tab, colour-accented SOURCE /
// PRESETS / SENS button groups, pill buttons, and solid-colour card headers.
import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

export function injectMeterInputStyles(): void {
  addStyles('meter-input-styles', `
.mi{display:flex;flex-direction:column;gap:12px;height:100%;}
/* ── LCARS top bar ─────────────────────────────────────────────────────── */
.mi-bar{display:flex;flex-direction:column;gap:10px;}
.mi-bar-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;}
.mi-bar-stat{justify-content:flex-end;}
.mi-title{font:900 14px sans-serif;letter-spacing:3px;text-transform:uppercase;color:${PAL.orange06};
    background:${PAL.orange65_f2a25a};padding:9px 22px;border-radius:6px 6px 6px 18px;white-space:nowrap;}
.mi-title-line{flex:1 1 60px;min-width:40px;height:14px;border-radius:7px;background:${PAL.orange65_f2a25a};opacity:.85;}
.mi-bar-groups{align-items:flex-start;gap:14px;}
.mi-grp{display:flex;flex-direction:column;align-items:stretch;gap:9px;padding:10px 14px 12px 20px;border-radius:10px;
    position:relative;overflow:hidden;background:rgba(var(--acc),.07);}
.mi-grp::before{content:'';position:absolute;left:0;top:0;bottom:0;width:9px;background:rgb(var(--acc));}
.mi-grp-lbl{font:900 11px sans-serif;letter-spacing:2px;text-transform:uppercase;color:rgb(var(--acc));}
.mi-grp-btns{display:flex;flex-direction:column;align-items:stretch;gap:8px;}
.mi-grp-src{--acc:224,150,60;} .mi-grp-pre{--acc:186,150,214;} .mi-grp-sens{--acc:224,110,90;}
.mi-pill{font:bold 11px sans-serif;letter-spacing:1px;text-transform:uppercase;padding:8px 15px;border-radius:14px;
    border:none;background:${PAL.blue18s41};color:${PAL.blue87};cursor:pointer;white-space:nowrap;
    transition:filter .15s,background .15s,margin-left .2s cubic-bezier(.3,.8,.3,1),padding-left .2s,border-radius .2s;}
.mi-pill:hover{filter:brightness(1.28);}
.mi-pill.on{background:rgb(var(--acc,224,150,60));color:${PAL.orange05};box-shadow:0 0 10px rgba(var(--acc,224,150,60),.5);}
/* Selected pill TUCKS INTO the group's colour spine: slides left to meet it and
   squares its left edge so pill + spine read as one continuous LCARS accent bar. */
.mi-grp .mi-pill.on{margin-left:-11px;padding-left:26px;border-radius:0 14px 14px 0;
    box-shadow:inset 4px 0 8px rgba(0,0,0,.3),0 0 10px rgba(var(--acc,224,150,60),.5);}
.mi-url{font:11px monospace;background:${PAL.blue09};color:${PAL.sky91};border:1px solid ${PAL.blue27s36};border-radius:12px;padding:8px 12px;min-width:200px;}
.mi-stat{font:11px sans-serif;color:${PAL.orange56};}
/* ── floating cards ────────────────────────────────────────────────────── */
.mi-vidcard,.mi-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:10px 12px 12px;
    display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 18px rgba(0,0,0,.4);min-width:200px;}
.mi-vidcard{min-height:140px;} .mi-card{min-height:120px;}
.mi-vidcard h4,.mi-card h4{margin:-10px -12px 6px;padding:7px 12px;background:var(--hc,${PAL.sky34});color:${PAL.blue08};
    font:900 11px sans-serif;letter-spacing:2px;text-transform:uppercase;border-radius:11px 11px 0 0;
    cursor:move;user-select:none;display:flex;align-items:center;gap:7px;}
.mi-vidcard h4::before,.mi-card h4::before{content:'⠿';color:rgba(0,0,0,.4);font-size:12px;}
.mi-btnicon{cursor:pointer;color:${PAL.blue08};background:rgba(0,0,0,.18);border-radius:6px;font-weight:900;
    font-size:12px;line-height:1;padding:3px 6px;}
.mi-btnicon:hover{background:rgba(0,0,0,.38);}
.mi-x{margin-left:auto;}
.mi-vid{flex:1 1 auto;min-height:0;width:100%;height:100%;border-radius:8px;background:${PAL.black};display:block;object-fit:contain;}
.mi-preview{display:none;}
.mi-grid{position:relative;min-height:660px;}
.mi-scope{position:relative;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:8px;overflow:hidden;
    flex:1 1 auto;min-height:0;}
.mi-scope canvas{position:absolute;inset:0;width:100%;height:100%;}
.mi-tag{position:absolute;left:8px;top:6px;z-index:2;font:bold 9px 'Courier New',monospace;letter-spacing:1px;color:${PAL.sky69};}
.mi-loudrow{display:flex;gap:12px;align-items:stretch;flex:1 1 auto;min-height:0;}
.mi-lufs{font:bold 28px 'Courier New',monospace;color:${PAL.sky91};line-height:1;align-self:center;}
.mi-lufs small{display:block;font-size:9px;color:${PAL.blue53};letter-spacing:1px;margin-top:3px;}
/* ── edit detector: luminance + edit log ───────────────────────────────── */
.mi-lumin{display:flex;flex-direction:column;gap:9px;padding:4px 2px;}
.mi-luminrow{display:flex;align-items:center;gap:10px;}
.mi-lumin-lbl{font:900 11px sans-serif;letter-spacing:2px;color:${PAL.sky75};}
.mi-lumin-track{flex:1;height:16px;border-radius:8px;background:${PAL.blue12_0c1730};overflow:hidden;box-shadow:inset 0 0 4px ${PAL.black};}
.mi-lumin-bar{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,${PAL.blue28s42},${PAL.sky75});transition:width .12s;}
.mi-lumin-val{font:bold 13px 'Courier New',monospace;color:${PAL.sky91};min-width:58px;text-align:right;}
.mi-lumin-range{display:flex;gap:18px;font:11px sans-serif;color:${PAL.sky71};}
.mi-lumin-range b{color:${PAL.sky75};font:bold 12px 'Courier New',monospace;margin-left:4px;}
.mi-lumin-sens{display:flex;align-items:center;gap:8px;flex-wrap:wrap;--acc:224,110,90;margin-top:2px;}
.mi-lumin-count,.mi-lumin-tempo{font:11px sans-serif;color:${PAL.sky71};}
.mi-lumin-count b{color:${PAL.orange65s85};font:bold 12px 'Courier New',monospace;}
.mi-lumin-tempo b{color:${PAL.sky75};font:bold 13px 'Courier New',monospace;}
.mi-editlog{display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;}
.mi-editlog-top{display:flex;align-items:center;gap:10px;}
.mi-editlog-count{margin-left:auto;font:11px sans-serif;color:${PAL.sky71};}
.mi-clear{padding:6px 14px;--acc:224,110,90;}
.mi-editlist{flex:1 1 auto;min-height:0;overflow:auto;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:8px;
    padding:8px 10px;font:12px/1.5 'Courier New',monospace;color:${PAL.sky91};display:flex;flex-direction:column;gap:3px;}
.mi-edit-empty{color:${PAL.sky44s20};font-style:italic;}
.mi-edit-row{display:flex;gap:8px;align-items:baseline;}
.mi-edit-row .dot{color:${PAL.orange65s85};} .mi-edit-row .t{color:${PAL.amber65};font-weight:bold;}
.mi-edit-row .l{color:${PAL.sky66};margin-left:auto;font-size:11px;}
/* ── layout inspector popup (opened by the LAYOUT pill) ────────────────── */
.mi-layout{position:fixed;right:16px;top:56px;z-index:9;display:none;max-width:60vw;max-height:64vh;overflow:auto;
    background:${PAL.blue09s58};border:1px solid ${PAL.blue27s36};border-radius:8px;padding:12px 14px;color:${PAL.sky84};
    font:11px/1.55 'Courier New',monospace;white-space:pre;box-shadow:0 10px 28px rgba(0,0,0,.6);}
.mi-layout.open{display:block;}
`);
}
