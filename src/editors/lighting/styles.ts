// src/editors/lighting/styles — the DMX console CSS, ported verbatim from
// js/editors/lighting.js so the rebuilt pane matches the legacy visuals 1:1.

import { PAL, alpha } from '../../domain/palette.js';

export const CSS = `
.lt{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px;height:100%;}
.lt-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:16px;}
.lt-card h4{margin:0 0 12px;color:${PAL.sky69};font-size:12px;letter-spacing:2px;text-transform:uppercase;}
/* the rig diagram */
.lt-stage{position:relative;flex:1;border-radius:12px;overflow:hidden;min-height:340px;
    background:radial-gradient(circle at 50% 42%, ${PAL.blue21s35} 0%, ${PAL.blue09} 70%);}
.lt-subj{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:70px;height:104px;border-radius:32px 32px 14px 14px;
    background:linear-gradient(${PAL.orange72},${PAL.orange52});box-shadow:0 10px 26px ${alpha(PAL.black, .5)};}
.lt-subj::after{content:'';position:absolute;left:50%;top:-34px;transform:translateX(-50%);width:44px;height:44px;border-radius:50%;background:${PAL.orange72};}
.lt-fix{position:absolute;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:8px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font:900 10px sans-serif;color:${PAL.sky05};border:2px solid ${PAL.sky05};box-shadow:0 0 14px currentColor;}
.lt-fix .lbl{position:absolute;top:48px;white-space:nowrap;font:bold 9px 'Courier New',monospace;color:${PAL.sky71};letter-spacing:1px;}
.lt-fix.sel{outline:2px solid ${PAL.white};}
.lt-beam{position:absolute;inset:0;pointer-events:none;}
/* fixture strips */
.lt-strips{display:flex;flex-direction:column;gap:10px;overflow:auto;}
.lt-strip{display:flex;align-items:center;gap:12px;background:${PAL.blue12_0c1730};border:1px solid ${PAL.blue27s36};border-radius:10px;padding:10px;}
.lt-strip.sel{border-color:${PAL.sky69};}
.lt-strip .nm{width:84px;font:bold 12px sans-serif;color:${PAL.sky91};} .lt-strip .nm small{display:block;color:${PAL.blue60s27};font-weight:normal;font-size:9px;}
.lt-strip .int{flex:1;-webkit-appearance:none;appearance:none;height:14px;border-radius:8px;background:${PAL.blue19};box-shadow:inset 0 0 0 1px ${PAL.blue27s36};outline:none;cursor:pointer;}
.lt-strip .int::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 40% 35%,${PAL.white},${PAL.green83});border:2px solid ${PAL.sky05};cursor:pointer;}
.lt-strip .pc{width:40px;text-align:right;font:bold 12px 'Courier New',monospace;color:${PAL.white};}
.lt-strip .ct{width:84px;-webkit-appearance:none;appearance:none;height:14px;border-radius:8px;outline:none;cursor:pointer;
    background:linear-gradient(90deg,${PAL.orange81},${PAL.white},${PAL.sky87});box-shadow:inset 0 0 0 1px ${PAL.blue27s36};}
.lt-strip .ct::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:22px;border-radius:5px;background:${PAL.blue15};border:2px solid ${PAL.white};cursor:pointer;}
.lt-strip .kv{width:48px;font:11px 'Courier New',monospace;color:${PAL.blue80s50};}
.lt-dmx{margin-top:10px;font:11px 'Courier New',monospace;color:${PAL.blue53};letter-spacing:1px;}
.lt-rcol{display:flex;flex-direction:column;gap:16px;overflow:auto;min-height:0;}
.lt-scenes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.lt-scene{padding:13px 4px;border-radius:8px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky91};font:900 10px sans-serif;letter-spacing:1px;cursor:pointer;}
.lt-scene:hover{background:${PAL.blue19};} .lt-scene.on{background:${PAL.orange62};color:${PAL.orange06};border-color:${PAL.orange62};}
.lt-cues{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px;}
.lt-cue{padding:12px 4px;border-radius:8px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky71};font:bold 10px sans-serif;letter-spacing:1px;cursor:pointer;}
.lt-cue:hover{background:${PAL.blue19};} .lt-cue.fire{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
`;
