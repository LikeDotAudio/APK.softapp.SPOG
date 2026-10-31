// src/editors/wysiwyg/styles — verbatim port of the legacy addStyles('wy-styles') block.

import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

export function injectWysiwygStyles(): void {
  addStyles(
    'wy-styles',
    `
.wy{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px;height:100%;}
.wy-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:14px;}
.wy-card h4{margin:0 0 10px;color:${PAL.sky69};font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.wy-stage{position:relative;flex:1;min-height:360px;border-radius:12px;overflow:hidden;background:${PAL.blue04};}
.wy-stage canvas{position:absolute;inset:0;width:100%;height:100%;}
.wy-right{display:flex;flex-direction:column;gap:14px;overflow:auto;}
.wy-toggles{display:flex;flex-direction:column;gap:8px;}
.wy-tg{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;border-radius:9px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky84};font:bold 12px sans-serif;letter-spacing:1px;cursor:pointer;}
.wy-tg.on{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
.wy-fx{display:flex;flex-direction:column;gap:8px;}
.wy-fxr{display:flex;align-items:center;gap:10px;}
.wy-fxr .nm{width:42px;font:bold 12px sans-serif;color:${PAL.sky91};}
.wy-fxr input{flex:1;-webkit-appearance:none;height:12px;border-radius:7px;background:${PAL.blue19};box-shadow:inset 0 0 0 1px ${PAL.blue27s36};outline:none;cursor:pointer;}
.wy-fxr input::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 40% 35%,${PAL.white},${PAL.sky80});border:2px solid ${PAL.sky05};}
.wy-tag{font:10px 'Courier New',monospace;color:${PAL.blue53};letter-spacing:1px;line-height:1.7;}
.wy-leg{display:flex;align-items:center;gap:6px;font:10px 'Courier New',monospace;color:${PAL.sky71};}
.wy-leg i{flex:1;height:10px;border-radius:5px;background:linear-gradient(90deg,${PAL.blue28s56},${PAL.teal49},${PAL.amber65s100},${PAL.red62});}
`,
  );
}
