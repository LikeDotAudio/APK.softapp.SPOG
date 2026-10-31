// src/editors/clock/styles — the CLOCK editor stylesheet, extracted verbatim
// from index.ts (the 200-line split). index injects it once via
// addStyles('twist-editor-clock', CSS); visuals are unchanged.

import { PAL, alpha } from '../../domain/palette.js';

export const CSS = `
.ck{display:flex;flex-direction:column;gap:12px;height:100%;min-height:0;color:${PAL.blue92};
  font-family:'Courier New',Consolas,monospace;}
.ck-bar{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;}
.ck-grp{display:flex;flex-direction:column;gap:7px;}
.ck-grp-lbl{font:800 10px 'Courier New',monospace;letter-spacing:2px;color:${PAL.purple59};text-transform:uppercase;}
.ck-grp-row{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;}
.ck-seg{display:inline-flex;border:1px solid ${PAL.violet22};border-radius:10px;overflow:hidden;}
.ck-btn{font:800 11px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;padding:8px 13px;border:none;
  background:${PAL.indigo09};color:${PAL.violet78};cursor:pointer;}
.ck-btn:hover{filter:brightness(1.25);}
.ck-btn.on{background:${PAL.purple59};color:${PAL.purple07};}
.ck-add{font:800 11px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;padding:8px 14px;cursor:pointer;
  border:1px solid ${PAL.green32};border-radius:10px;background:${PAL.green09};color:${PAL.green77};}
.ck-add:hover{background:${PAL.green14};}
.ck-hint{font:700 10px 'Courier New',monospace;letter-spacing:.4px;color:${PAL.grey47};}

.ck-stage{position:relative;flex:1;min-height:360px;overflow:auto;resize:vertical;
  background:${PAL.indigo04};border:1px solid ${PAL.blue12s14};border-radius:12px;
  background-image:radial-gradient(${alpha(PAL.purple59, .09)} 1px,transparent 1px);background-size:22px 22px;}

.ck-win{position:absolute;display:flex;flex-direction:column;min-width:120px;min-height:120px;
  background:${PAL.indigo04};border:1px solid ${PAL.blue15s18};border-radius:12px;overflow:hidden;resize:both;box-shadow:0 6px 20px ${alpha(PAL.black, .5)};}
.ck-win.sel{border-color:${PAL.purple59};box-shadow:0 0 0 1px ${PAL.purple59},0 8px 26px ${alpha(PAL.purple59, .28)};}
.ck-win-head{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:0;padding:5px 7px;cursor:move;user-select:none;
  background:${PAL.purple07};border-bottom:1px solid ${PAL.purple13};}
.ck-win-title{flex:1 1 40px;min-width:0;font:800 10px 'Courier New',monospace;letter-spacing:1px;color:${PAL.purple75};text-transform:uppercase;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;outline:none;cursor:text;}
.ck-win-title:focus{color:${PAL.white};}
.ck-ico{cursor:pointer;color:${PAL.violet78};background:${alpha(PAL.white, .06)};border-radius:6px;font:800 9px 'Courier New',monospace;
  letter-spacing:1px;line-height:1;padding:4px 6px;}
.ck-ico:hover{background:${alpha(PAL.purple59, .3)};color:${PAL.white};}
.ck-ico.ck-x{color:${PAL.red78};}
/* Per-window pickers (zone offset · resolution · face) — each clock is independent. */
.ck-face-sel{font:800 9px 'Courier New',monospace;letter-spacing:.5px;text-transform:uppercase;cursor:pointer;min-width:0;
  background:${PAL.purple13};color:${PAL.violet85};border:1px solid ${PAL.violet22};border-radius:6px;padding:3px 3px;}
.ck-win-body{flex:1;min-height:0;position:relative;}
.ck-win-body canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:auto;display:block;}

.ck-date{display:flex;align-items:stretch;justify-content:center;gap:1px;width:100%;height:100%;--vf:26px;
  background:${PAL.black};box-shadow:inset 0 0 22px ${alpha(PAL.red58, .12)};}
.ck-date .ck-cell{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.2em;min-width:0;}
.ck-date .ck-cell + .ck-cell{border-left:1px solid ${PAL.blue12s14};}
.ck-date .ck-cap{font:700 max(7px,calc(var(--vf)*.34)) 'Courier New',monospace;letter-spacing:2px;color:${PAL.blue56};text-transform:uppercase;}
.ck-date .ck-val{font:800 var(--vf) 'Courier New',Consolas,monospace;letter-spacing:1px;color:${PAL.red58};line-height:1;
  text-shadow:0 0 12px ${alpha(PAL.red58, .75)};}
.ck-date .ck-day .ck-val{font-size:calc(var(--vf)*.77);letter-spacing:2px;}

.ck-saved{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;}
.ck-empty{font:700 10px 'Courier New',monospace;color:${PAL.grey40s12};letter-spacing:.4px;}
`;
