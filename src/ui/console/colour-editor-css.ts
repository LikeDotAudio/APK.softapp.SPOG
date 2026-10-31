// src/ui/console/colour-editor-css — the LCARS stylesheet for the COLOUR &
// VISION editor overlay (colour-editor.ts). Injected once via addStyles(STYLE_ID).

import { PAL, alpha } from '../../domain/palette.js';

export const STYLE_ID = 'tr-colour-editor';
export const CSS = `
.cse-note{color:${PAL.sky74s42};font-size:12px;line-height:1.55;margin:0 0 18px;max-width:74ch;}
.cse-sec{margin:0 0 24px;}
.cse-presets{display:flex;flex-wrap:wrap;gap:12px;}
/* LCARS Corner Law: inner radius = ½ outer, tops/bottoms square. Ladder pair 16↔8:
   leading (left) corners = outer 16, trailing (right) = inner 8; long edges stay flat. */
.cse-preset{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:126px;flex:1 1 126px;
  max-width:180px;padding:14px 12px 10px;border:2px solid ${PAL.blue27s36};border-radius:16px 8px 8px 16px;background:${PAL.blue13};
  color:${PAL.sky93s100};cursor:pointer;font:700 11px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;text-align:center;}
.cse-preset:hover{border-color:${PAL.sky43};background:${PAL.blue15};}
.cse-preset .g{font-size:28px;line-height:1;}
.cse-preset .h{font:400 10px Arial,sans-serif;letter-spacing:0;text-transform:none;color:${PAL.sky61};line-height:1.3;}
.cse-preset .sel{font-size:9px;letter-spacing:1px;color:${PAL.sky75s100};min-height:11px;}
.cse-preset[aria-pressed="true"]{border-color:${PAL.sky75s100};box-shadow:inset 0 0 0 2px ${alpha(PAL.sky75s100, .35)};}
.cse-row{display:flex;align-items:center;gap:16px;margin:0 0 12px;flex-wrap:wrap;}
.cse-lab{width:120px;flex:0 0 auto;color:${PAL.sky69s41};font:700 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;}
.cse-seg{display:inline-flex;border:2px solid ${PAL.blue27s36};border-radius:15px;overflow:hidden;}
.cse-seg button{padding:9px 18px;background:${PAL.blue13};color:${PAL.blue89};border:none;border-right:1px solid ${PAL.blue27s36};
  cursor:pointer;font:700 12px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;}
.cse-seg button:last-child{border-right:none;}
.cse-seg button:hover{background:${PAL.blue15};}
.cse-seg button[aria-pressed="true"]{background:${PAL.sky24};color:${PAL.white};box-shadow:inset 0 -3px 0 ${PAL.sky75s100};}
.cse-hint{color:${PAL.sky55};font:400 11px Arial,sans-serif;}
.cse-pals{display:flex;flex-wrap:wrap;gap:10px;}
.cse-pal{position:relative;display:flex;flex-direction:column;gap:7px;align-items:flex-start;min-width:138px;
  padding:11px 13px 9px;border:2px solid ${PAL.blue27s36};border-radius:16px 8px 8px 16px;background:${PAL.blue13};color:${PAL.sky93s100};cursor:pointer;}
.cse-pal:hover{border-color:${PAL.sky43};background:${PAL.blue15};}
.cse-pal[aria-pressed="true"]{border-color:${PAL.sky75s100};box-shadow:inset 0 0 0 2px ${alpha(PAL.sky75s100, .35)};}
.cse-dots{display:flex;gap:5px;}
.cse-dots i{width:20px;height:20px;border-radius:50%;box-shadow:0 0 0 1px ${alpha(PAL.white, .18)};}
.cse-pal .nm{font:700 12px Arial,sans-serif;letter-spacing:.5px;}
.cse-pal .safe{font:800 8px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:${PAL.blue09};
  background:${PAL.teal54};border-radius:8px;padding:2px 6px;}
.cse-pal .safe.no{visibility:hidden;}
.cse-pal .selmark{position:absolute;top:8px;right:9px;font:800 12px Arial;color:${PAL.sky75s100};min-width:12px;text-align:right;}
.cse-prev{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:18px;border-radius:16px 8px 8px 16px;
  background:${PAL.blue09};border:1px solid ${PAL.blue19};}
.cse-node{display:flex;align-items:center;gap:8px;padding:11px 24px;font:800 12px Arial,sans-serif;
  letter-spacing:1px;border:2px solid currentColor;border-radius:8px;background:${alpha(PAL.white, .02)};}
.cse-vid{color:var(--sig-video,${PAL.purple70});clip-path:polygon(0 0,100% 0,88% 100%,12% 100%);}
.cse-aud{color:var(--sig-audio,${PAL.orange69});clip-path:polygon(12% 0,88% 0,100% 100%,0 100%);}
.cse-prog{color:var(--sig-program,${PAL.blue60});}
.cse-chip{display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:22px;
  border:2px solid currentColor;font:800 12px Arial,sans-serif;letter-spacing:1px;}
.cse-chip .g{font-size:15px;line-height:1;}
.cse-fault{color:var(--state-alarm,${PAL.red62});}
.cse-ok{color:var(--state-ok,${PAL.teal54});}
.cse-onair{color:var(--state-onair,${PAL.amber50s100});}
/* Sample LCARS windows — mini elbow frames painted by the live palette tokens,
   so a palette pick shows real chrome, not just pills. Corner Law: outer 16,
   inner elbow radius 8 (= ½ outer), tops/bottoms square where edges join. */
.cse-wins{display:flex;flex-wrap:wrap;gap:14px;width:100%;margin-top:14px;}
.cse-win{--wc:${PAL.purple70};position:relative;flex:0 0 176px;height:104px;background:${PAL.blue06_060c1a};
  border-radius:16px 8px 8px 8px;overflow:hidden;border:1px solid ${alpha(PAL.white, .07)};}
.cse-win-rail{position:absolute;top:0;left:0;right:0;height:22px;background:var(--wc);
  border-radius:16px 8px 0 0;color:${PAL.sky08};font:800 9px Arial,sans-serif;letter-spacing:2px;
  text-transform:uppercase;display:flex;align-items:center;justify-content:flex-end;padding:0 10px;}
.cse-win-spine{position:absolute;top:22px;left:0;bottom:0;width:16px;background:var(--wc);}
.cse-win-elbow{position:absolute;top:22px;left:16px;width:8px;height:8px;
  background:radial-gradient(circle at 100% 100%,transparent 8px,var(--wc) 8px);}
.cse-win-body{position:absolute;top:30px;left:26px;right:10px;bottom:9px;display:flex;flex-direction:column;gap:6px;}
.cse-win-body i{display:block;height:10px;border-radius:4px;background:color-mix(in srgb,var(--wc) 32%,${PAL.blue09});}
.cse-win-states{display:flex;gap:7px;margin-top:auto;}
.cse-win-states b{width:12px;height:12px;border-radius:50%;}
.cse-win-states .d-alarm{background:var(--state-alarm,${PAL.red62});}
.cse-win-states .d-ok{background:var(--state-ok,${PAL.teal54});}
.cse-win-states .d-onair{background:var(--state-onair,${PAL.amber50s100});}
.cse-hue-row{display:flex;align-items:center;gap:16px;margin:0 0 12px;opacity:0.3;pointer-events:none;transition:opacity 0.2s;}
.cse-hue-row.active{opacity:1;pointer-events:auto;}
.cse-hue-slider{-webkit-appearance:none;appearance:none;width:160px;height:8px;border-radius:4px;background:linear-gradient(to right, ${PAL.red50}, ${PAL.yellow50}, ${PAL.green50}, ${PAL.cyan50}, ${PAL.blue50}, ${PAL.purple50}, ${PAL.red50});outline:none;}
.cse-hue-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${PAL.white};border:2px solid ${PAL.blue27s36};cursor:pointer;}
.cse-hue-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${PAL.white};border:2px solid ${PAL.blue27s36};cursor:pointer;}
`;
