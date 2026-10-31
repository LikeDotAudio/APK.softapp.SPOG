// src/editors/chronos/styles.ts — CHRONOS chrome CSS, split out of index.ts.
// A rack of broadcast timer cards on black: control bar + scrolling card list,
// each card a black panel with a name, read-out picker and transport row.

import { PAL } from '../../domain/palette.js';

export const CSS = `
.cr{display:flex;flex-direction:column;gap:12px;height:100%;min-height:0;color:${PAL.blue92};}
.cr-bar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;}
.cr-bar h4{margin:0;color:${PAL.purple59};font:700 11px 'Courier New',monospace;letter-spacing:2px;text-transform:uppercase;}
.cr-grp{display:inline-flex;align-items:center;gap:6px;font:700 10px 'Courier New',monospace;letter-spacing:1px;color:${PAL.cyan60};text-transform:uppercase;}
.cr-seg{display:inline-flex;border:1px solid ${PAL.violet22};border-radius:9px;overflow:hidden;}
.cr-btn{font:800 11px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;padding:7px 13px;border:none;
  background:${PAL.violet10};color:${PAL.violet78};cursor:pointer;}
.cr-btn.on{background:${PAL.purple59};color:${PAL.purple07};}
.cr-list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:14px;padding:2px;}
.cr-card{background:${PAL.black};border:1px solid ${PAL.grey12s10};border-radius:12px;padding:10px 12px;
  display:flex;flex-direction:column;gap:8px;}
.cr-head{display:flex;align-items:center;gap:10px;}
.cr-name{font:800 11px 'Courier New',monospace;letter-spacing:2px;color:${PAL.blue56};text-transform:uppercase;}
.cr-sel{font:800 9px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;cursor:pointer;
  background:${PAL.purple13};color:${PAL.violet85};border:1px solid ${PAL.violet22};border-radius:6px;padding:4px 5px;}
.cr-body{position:relative;width:100%;}
.cr-face{position:absolute;inset:0;width:100%;height:100%;display:block;}
.cr-xport{display:inline-flex;gap:6px;margin-left:auto;align-items:center;}
.cr-tbtn{font:800 10px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;border:none;
  border-radius:8px;background:${PAL.blue16_16233d};color:${PAL.sky84};cursor:pointer;}
.cr-tbtn.set{background:${PAL.violet17};color:${PAL.violet82};}
.cr-tbtn.run{background:${PAL.red57};color:${PAL.red05};}
.cr-live{font:800 10px 'Courier New',monospace;letter-spacing:2px;color:${PAL.green68};}
`;
