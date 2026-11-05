// src/ui/console/clock-float-styles — the floating clock window's look (palette tokens only).
import { PAL, alpha } from '../../domain/palette.js';

export const CLOCK_FLOAT_CSS = `
.clock-float-launch{position:fixed;left:246px;bottom:76px;z-index:1000;background:${PAL.amber60};color:${PAL.amber09};border:none;border-radius:18px 6px 6px 18px;font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:8px 18px 8px 16px;cursor:pointer;box-shadow:inset 5px 0 0 ${PAL.amber35};}
.clock-float-launch.on{background:${PAL.orange50};}
html[data-chirality="right"] .clock-float-launch{left:auto;right:246px;border-radius:6px 18px 18px 6px;}
.clock-float{position:fixed;z-index:2600;display:none;flex-direction:column;min-width:220px;min-height:150px;resize:both;overflow:hidden;background:${alpha(PAL.blue04, .92)};border:1px solid ${PAL.amber35};border-radius:14px;box-shadow:0 12px 40px ${alpha(PAL.black, .6)};backdrop-filter:blur(6px);font-family:Arial,Helvetica,sans-serif;color:${PAL.amber85};}
.clock-float .cf-head{display:flex;align-items:center;gap:6px;padding:6px 10px;background:${alpha(PAL.amber60, .16)};cursor:move;user-select:none;letter-spacing:2px;font-size:12px;}
.clock-float .cf-sp{flex:1;}
.clock-float button{background:none;border:1px solid ${alpha(PAL.amber60, .4)};color:${PAL.amber85};border-radius:6px;cursor:pointer;font:700 13px Arial,Helvetica,sans-serif;padding:0 7px;line-height:20px;}
.clock-float .cf-tiles{flex:1;display:flex;flex-wrap:wrap;gap:8px;padding:8px;overflow:auto;}
.clock-float .cf-tile{flex:1 1 160px;min-width:140px;min-height:110px;display:flex;flex-direction:column;background:${alpha(PAL.black, .35)};border-radius:10px;overflow:hidden;}
.clock-float .cf-tile canvas{flex:1;width:100%;min-height:80px;}
.clock-float .cf-ctl{display:flex;gap:4px;padding:4px;}
.clock-float select{flex:1;min-width:0;background:${PAL.blue09};color:${PAL.amber85};border:1px solid ${alpha(PAL.amber60, .3)};border-radius:5px;font:11px Arial,Helvetica,sans-serif;}
`;
