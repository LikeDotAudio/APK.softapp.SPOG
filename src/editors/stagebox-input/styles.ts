// src/editors/stagebox-input/styles — verbatim port of the legacy
// addStyles('sb-styles', …) CSS block so the Stage Box Input visuals match 1:1.

import { addStyles } from '../../ui/dom.js';
import { PAL, alpha } from '../../domain/palette.js';

const CSS = `
.sb{display:grid;grid-template-columns:300px minmax(0,1fr) 280px;gap:16px;height:100%;}
.sb-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:16px;}
.sb-card h4{margin:0 0 12px;color:${PAL.sky69};font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.sb-col{display:flex;flex-direction:column;gap:14px;overflow:auto;}
.sb-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;font-size:13px;color:${PAL.blue80s50};}
.sb-row b{color:${PAL.white};font-family:'Courier New',monospace;}
.sb-alias{width:100%;box-sizing:border-box;background:${PAL.blue09};border:1px solid ${PAL.blue27s36};border-radius:8px;color:${PAL.white};font:bold 15px 'Courier New',monospace;padding:9px 12px;letter-spacing:1px;}
.sb-sel{width:100%;box-sizing:border-box;background:${PAL.blue09};border:1px solid ${PAL.blue27s36};border-radius:8px;color:${PAL.sky91};font:13px sans-serif;padding:9px;}
.sb-knrow{display:flex;justify-content:space-around;margin:6px 0;}
.sb-kn{display:flex;flex-direction:column;align-items:center;gap:7px;}
.sb-dial{width:84px;height:84px;border-radius:50%;position:relative;cursor:ns-resize;touch-action:none;
    background:repeating-conic-gradient(from -136deg,${PAL.blue31} 0 1.5deg,transparent 1.5deg 14deg),${PAL.blue09};box-shadow:0 5px 13px ${alpha(PAL.black, .55)};}
.sb-dial::before{content:'';position:absolute;inset:9%;border-radius:50%;background:conic-gradient(from 225deg,var(--c,${PAL.sky69}) calc(var(--p,50%) * 0.75),${PAL.blue15} 0);
    -webkit-mask:radial-gradient(circle,transparent 53%,${PAL.black} 55%);mask:radial-gradient(circle,transparent 53%,${PAL.black} 55%);filter:drop-shadow(0 0 5px var(--c,${PAL.sky69}));}
.sb-dial::after{content:'';position:absolute;inset:24%;border-radius:50%;background:radial-gradient(circle at 42% 32%,${PAL.sky40},${PAL.blue15} 72%);box-shadow:inset 0 2px 5px ${alpha(PAL.white, .2)},0 2px 5px ${alpha(PAL.black, .5)};}
.sb-dial i{position:absolute;left:50%;top:50%;width:4px;height:36%;border-radius:3px;background:var(--c,${PAL.sky69});box-shadow:0 0 6px var(--c,${PAL.sky69});transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(var(--rot,0deg));}
.sb-kn b{font:bold 14px 'Courier New',monospace;color:${PAL.sky91};} .sb-kn span{font-size:11px;color:${PAL.sky71};}
.sb-key{display:block;width:100%;padding:14px;border-radius:10px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky84};font:bold 13px sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;text-align:center;margin-top:10px;}
.sb-key.on{background:${PAL.green53};color:${PAL.green05};border-color:${PAL.green53};box-shadow:0 0 10px ${alpha(PAL.green53, .5)};}
.sb-key.conf.on{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
.sb-warn{margin-top:10px;padding:10px;border-radius:8px;background:${alpha(PAL.red62, .12)};border:1px solid ${PAL.red62};color:${PAL.red80};font:bold 11px sans-serif;display:none;}
.sb-warn.on{display:block;}
/* centre: meter + history */
.sb-mid{display:flex;flex-direction:column;gap:14px;}
.sb-metwrap{display:flex;gap:16px;align-items:stretch;flex:0 0 auto;}
.sb-meter{position:relative;width:34px;height:200px;border-radius:6px;overflow:hidden;box-shadow:inset 0 0 0 1px ${PAL.blue19};
    background:linear-gradient(to top,${PAL.green27},${PAL.green53} 55%,${PAL.amber50} 80%,${PAL.red58} 100%);}
.sb-meter .mask{position:absolute;left:0;right:0;top:0;background:${PAL.blue09};}
.sb-meter .pk{position:absolute;left:0;right:0;height:2px;background:${PAL.white};}
.sb-headroom{flex:1;font:13px 'Courier New',monospace;color:${PAL.blue80s50};line-height:2;}
.sb-headroom b{color:${PAL.white};} .sb-headroom .hot{color:${PAL.red71};}
.sb-hist{flex:1;position:relative;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:10px;overflow:hidden;min-height:150px;}
.sb-hist canvas{position:absolute;inset:0;width:100%;height:100%;}
.sb-hist .cap{position:absolute;left:8px;top:6px;font:bold 10px 'Courier New',monospace;color:${PAL.sky69};letter-spacing:1px;z-index:2;}
/* channel jump bar */
.sb-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex:0 0 auto;}
.sb-nav .orig{font:bold 11px 'Courier New',monospace;color:${PAL.sky69};letter-spacing:1px;margin-right:8px;}
.sb-tab{padding:9px 15px;border-radius:8px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky71};font:bold 12px sans-serif;letter-spacing:1px;cursor:pointer;}
.sb-tab:hover{background:${PAL.blue19};}
.sb-tab.sel{background:${PAL.orange62};color:${PAL.orange06};border-color:${PAL.orange62};}
.sb-bankl{font:bold 11px 'Courier New',monospace;color:${PAL.orange62};letter-spacing:1px;margin-right:4px;}
.sb-arrow{padding:9px 13px;border-radius:8px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky91};font:900 13px sans-serif;cursor:pointer;}
.sb-arrow:hover{background:${PAL.blue19};}
.sb-slope{flex:1;padding:8px 4px;border-radius:6px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky71};font:bold 10px sans-serif;letter-spacing:.5px;cursor:pointer;}
.sb-slope:hover{background:${PAL.blue19};} .sb-slope.sel{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
.sb-host .sb{height:100%;}
/* bank quad — 4 channels at 1/4 screen each */
.sb-bankgrid{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;overflow:auto;}
.sb-host{position:relative;min-width:0;min-height:0;overflow:auto;border:1px solid ${PAL.blue19};border-radius:10px;}
.sb-cell-tag{position:absolute;right:8px;top:6px;z-index:6;background:${PAL.orange62};color:${PAL.orange06};font:900 11px sans-serif;letter-spacing:1px;border-radius:6px;padding:3px 9px;pointer-events:none;}
/* HPF response chart */
.sb-hpchart{width:100%;height:84px;margin-top:10px;background:${PAL.blue09};border:1px solid ${PAL.blue19};border-radius:8px;display:block;}
`;

export function injectStageBoxStyles(): void {
  addStyles('sb-styles', CSS);
}
