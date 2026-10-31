// src/editors/timer/styles — the LCARS chrome for the dual-count timer (split from
// index.ts, audit §4.5). Injected once via addStyles('twist-editor-timer', CSS).

import { PAL } from '../../domain/palette.js';

export const CSS = `
.rc{display:flex;flex-direction:column;gap:14px;height:100%;min-height:0;overflow:auto;color:${PAL.purple87};
  font-family:'Courier New',Consolas,monospace;}
.rc-panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(430px,1fr));gap:16px;}
/* Locked wall-clock header — sticky at the top of the scroll, can't move/close. */
.rc-clock{position:sticky;top:0;z-index:6;flex:0 0 auto;display:flex;align-items:center;gap:14px;
  background:${PAL.indigo04};border:1px solid ${PAL.purple13};border-radius:14px;padding:8px 12px;
  box-shadow:0 10px 22px rgba(0,0,0,.6);}
.rc-clock-lbl{display:flex;flex-direction:column;gap:4px;min-width:118px;}
.rc-clock-lbl b{font:800 12px 'Courier New',monospace;letter-spacing:2px;color:${PAL.purple59};text-transform:uppercase;}
.rc-clock-zone{font:700 10px 'Courier New',monospace;letter-spacing:1px;color:${PAL.green75};text-transform:uppercase;}
.rc-clock-lock{font:700 8px 'Courier New',monospace;letter-spacing:1px;color:${PAL.grey47};text-transform:uppercase;}
.rc-clock-body{position:relative;flex:1;min-width:0;height:108px;}
.rc-clock-body canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}
.rc-clock-cfg{display:flex;flex-direction:column;gap:5px;align-items:stretch;}
.rc-clock-sel{font:800 9px 'Courier New',monospace;letter-spacing:.5px;text-transform:uppercase;cursor:pointer;min-width:0;
  background:${PAL.purple13};color:${PAL.violet85};border:1px solid ${PAL.violet22};border-radius:6px;padding:3px 4px;max-width:200px;}
.rc-panel{display:flex;flex-direction:column;gap:10px;background:${PAL.indigo04};border:1px solid ${PAL.purple13};border-radius:14px;padding:12px;}
.rc-phead{display:flex;align-items:center;gap:10px;font:800 12px 'Courier New',monospace;letter-spacing:2px;color:${PAL.purple59};text-transform:uppercase;}
.rc-phead .st{margin-left:auto;font:700 10px 'Courier New',monospace;letter-spacing:1px;color:${PAL.green75};text-transform:none;}
.rc-bezel{background:${PAL.grey02s9};border:2px solid ${PAL.purple11};border-radius:10px;padding:8px 10px;display:flex;align-items:center;gap:8px;}
.rc-canvas{flex:1;min-width:0;height:auto;display:block;}
.rc-badges{display:flex;flex-direction:column;gap:3px;align-items:flex-end;min-width:40px;font:700 9px 'Courier New',monospace;letter-spacing:1px;}
.rc-badge{color:${PAL.grey47};}.rc-badge.hot{color:${PAL.red68s100};}
.rc-fnrow,.rc-keys{display:grid;gap:7px;grid-template-columns:repeat(4,1fr);}
.rc-k{border:none;border-radius:9px;padding:12px 4px;cursor:pointer;font:800 12px 'Courier New',monospace;letter-spacing:1px;
  background:${PAL.indigo09};color:${PAL.violet83};text-transform:uppercase;position:relative;}
.rc-k .sub{display:block;font:700 7px 'Courier New',monospace;color:${PAL.violet49};letter-spacing:1px;margin-bottom:2px;min-height:8px;}
.rc-k.op{background:${PAL.purple11s43};}
.rc-k.go{background:${PAL.red30};color:${PAL.yellow97};}
.rc-k.wide{grid-column:span 2;}
.rc-k.shift{background:${PAL.violet17s26};}
.rc-k.shift.on{background:${PAL.amber62};color:${PAL.orange11};}
.rc-k:active{filter:brightness(1.3);}
.rc-drawer{background:${PAL.blue05s13};border:1px solid ${PAL.blue15s14};border-radius:8px;padding:6px 10px;}
.rc-drawer summary{cursor:pointer;font:800 11px 'Courier New',monospace;letter-spacing:2px;color:${PAL.purple59};text-transform:uppercase;}
.rc-fns{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:8px;}
.rc-fn{border:1px solid ${PAL.violet16};background:${PAL.violet07s33};color:${PAL.violet78};border-radius:7px;padding:7px 9px;cursor:pointer;
  font:700 10px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;text-align:left;}
.rc-fn:hover{background:${PAL.violet11};}
.rc-gstat{font:700 10px 'Courier New',monospace;letter-spacing:1px;color:${PAL.grey47};display:flex;gap:14px;flex-wrap:wrap;padding:0 4px;}
.rc-gstat b{color:${PAL.green75};}
.rc-bezel{cursor:pointer;}
.rc-panel.sel{border-color:${PAL.purple59};box-shadow:0 0 0 1px ${PAL.purple59},0 0 16px rgba(200,100,200,.22);}
.rc-panel.sel .rc-phead{color:${PAL.purple75};}
.rc-phead .kb{margin-left:8px;font:700 9px 'Courier New',monospace;letter-spacing:1px;color:${PAL.purple59};opacity:0;transition:opacity .12s;}
.rc-panel.sel .rc-phead .kb{opacity:1;}
.rc-hint{font:700 10px 'Courier New',monospace;letter-spacing:.4px;color:${PAL.grey47};padding:0 4px;}
.rc-hint b{color:${PAL.purple59};}
.rc-sc{background:${PAL.blue05s13};border:1px solid ${PAL.blue15s14};border-radius:8px;padding:10px 12px;}
.rc-sc-title{font:800 11px 'Courier New',monospace;letter-spacing:2px;color:${PAL.purple59};text-transform:uppercase;margin-bottom:9px;}
.rc-sc-title span{color:${PAL.grey47};letter-spacing:.4px;text-transform:none;font-weight:700;}
.rc-sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:7px 16px;}
.rc-sc-row{display:flex;align-items:center;gap:10px;font:700 10px 'Courier New',monospace;}
.rc-kbd{display:inline-flex;align-items:center;justify-content:center;min-width:38px;padding:4px 8px;border-radius:6px;
  background:${PAL.indigo09};border:1px solid ${PAL.violet16};box-shadow:0 1px 0 ${PAL.black};color:${PAL.amber62};font:800 11px 'Courier New',monospace;letter-spacing:1px;flex:0 0 auto;}
.rc-sc-desc{color:${PAL.violet78};}
`;
