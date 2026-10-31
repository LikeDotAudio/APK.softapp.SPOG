// src/editors/signaling/styles — verbatim port of the legacy
// addStyles('sg-styles', CSS) block from js/editors/signaling.js.
import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

const CSS = `
.sg{display:grid;grid-template-columns:240px minmax(0,1fr) 300px;gap:16px;height:100%;}
.sg-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:16px;}
.sg-card h4{margin:0 0 12px;color:${PAL.sky69};font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.sg-col{display:flex;flex-direction:column;gap:14px;overflow:auto;}
/* On-Air */
.sg-onair{border-radius:14px;padding:26px 10px;text-align:center;font:900 30px sans-serif;letter-spacing:4px;
    background:${PAL.orange06s38};color:${PAL.amber26};border:2px solid ${PAL.blue25};transition:.2s;}
.sg-onair.live{background:${PAL.red13};color:${PAL.white};border-color:${PAL.red58};box-shadow:0 0 26px rgba(255,43,43,.6);animation:sgPulse 1.4s ease-in-out infinite;}
.sg-onair.reh{background:${PAL.amber13s76};color:${PAL.amber71};border-color:${PAL.amber50};box-shadow:0 0 18px rgba(255,212,0,.4);}
@keyframes sgPulse{50%{filter:brightness(1.25)}}
.sg-mode{display:flex;gap:8px;margin-top:14px;}
.sg-mode .b{flex:1;padding:12px;border-radius:9px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky71};font:900 12px sans-serif;letter-spacing:1px;cursor:pointer;text-align:center;}
.sg-mode .b.sel{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
/* tally bus */
.sg-bus{display:flex;flex-direction:column;gap:12px;}
.sg-take{align-self:flex-start;padding:12px 26px;border-radius:10px;border:none;background:${PAL.red62};color:${PAL.white};font:900 14px sans-serif;letter-spacing:2px;cursor:pointer;box-shadow:0 0 14px rgba(255,59,59,.5);}
.sg-take:hover{filter:brightness(1.1);}
.sg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.sg-cam{position:relative;border-radius:10px;border:2px solid ${PAL.blue29};background:${PAL.blue09s58};padding:14px 8px 10px;text-align:center;}
.sg-cam .nm{font:900 14px sans-serif;color:${PAL.sky91};letter-spacing:1px;}
.sg-cam .st{font:bold 9px 'Courier New',monospace;letter-spacing:1px;color:${PAL.blue60s27};margin-top:4px;min-height:11px;}
.sg-cam.pgm{border-color:${PAL.red58};box-shadow:0 0 12px rgba(255,43,43,.6);} .sg-cam.pgm .nm{color:${PAL.red71};} .sg-cam.pgm .st{color:${PAL.red71};}
.sg-cam.pvw{border-color:${PAL.green53};} .sg-cam.pvw .nm{color:${PAL.green72};} .sg-cam.pvw .st{color:${PAL.green72};}
.sg-cam.iso{border-color:${PAL.amber50};} .sg-cam.iso .st{color:${PAL.amber71};}
.sg-cam .row{display:flex;gap:4px;margin-top:8px;}
.sg-cam .row button{flex:1;padding:5px 0;border-radius:5px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky71};font:bold 9px sans-serif;cursor:pointer;}
.sg-cam .row .pgmb:hover{background:${PAL.red13};color:${PAL.red80};} .sg-cam .row .pvwb:hover{background:${PAL.green14s66};color:${PAL.green81_9effb0};} .sg-cam .row .isob:hover{background:${PAL.amber13s76};color:${PAL.amber71};}
/* trigger panel maker */
.sg-trigs{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.sg-trig{padding:16px 8px;border-radius:10px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky91};font:900 11px sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;text-align:center;}
.sg-trig:hover{background:${PAL.blue16s47};} .sg-trig.fire{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
.sg-trig.scte{border-color:${PAL.red71};color:${PAL.red80};} .sg-trig.scte.fire{background:${PAL.red62};color:${PAL.white};border-color:${PAL.red62};}
.sg-add{grid-column:1 / -1;padding:12px;border-radius:10px;border:1px dashed ${PAL.blue27s36};background:transparent;color:${PAL.blue53};font:bold 11px sans-serif;letter-spacing:1px;cursor:pointer;}
.sg-log{margin-top:12px;font:11px 'Courier New',monospace;color:${PAL.blue60s27};line-height:1.7;max-height:120px;overflow:auto;}
.sg-log b{color:${PAL.sky91};}
`;

export function injectSignalingStyles(): void {
  addStyles('sg-styles', CSS);
}
