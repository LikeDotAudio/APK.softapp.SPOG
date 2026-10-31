// src/editors/audio-monitor/styles — verbatim port of the legacy
// addStyles('am2-styles', …) CSS block so the confidence monitor matches 1:1.

import { addStyles } from '../../ui/dom.js';
import { PAL, alpha } from '../../domain/palette.js';

const CSS = `
.am2{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;height:100%;}
.am2-bridge{overflow:auto;display:flex;flex-wrap:wrap;gap:14px;align-content:flex-start;padding:2px;}
.am2-block{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:12px;}
.am2-bh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;}
.am2-bh b{color:${PAL.sky69};font-size:12px;letter-spacing:2px;}
.am2-fmt{font:bold 10px 'Courier New',monospace;color:${PAL.sky91};background:${PAL.blue15};border:1px solid ${PAL.blue27s36};border-radius:6px;padding:4px 8px;cursor:pointer;letter-spacing:1px;}
.am2-fmt:hover{background:${PAL.blue21};}
.am2-meters{display:flex;gap:10px;}
.am2-ch{display:flex;flex-direction:column;align-items:center;gap:6px;width:46px;}
.am2-meter{position:relative;width:24px;height:210px;border-radius:5px;overflow:hidden;box-shadow:inset 0 0 0 1px ${PAL.blue19};
    background:linear-gradient(to top,${PAL.green27} 0%,${PAL.green53} 55%,${PAL.amber50} 80%,${PAL.red62_ff5a3b} 92%,${PAL.red58} 100%);}
.am2-meter .mask{position:absolute;left:0;right:0;top:0;background:${PAL.blue07s63};}
.am2-meter .pk{position:absolute;left:0;right:0;height:2px;background:${PAL.blue94s100};}
.am2-meter.tp{box-shadow:inset 0 0 0 1px ${PAL.blue19}, 0 0 9px ${PAL.red58};}
.am2-meter .scale{position:absolute;right:1px;top:0;bottom:0;width:1px;}
.am2-lab{font:bold 10px 'Courier New',monospace;color:${PAL.sky84};text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46px;}
.am2-cue{width:40px;padding:5px 0;border-radius:6px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky71};font:bold 9px sans-serif;letter-spacing:1px;cursor:pointer;text-align:center;}
.am2-cue.on{background:${PAL.amber50};color:${PAL.orange06};border-color:${PAL.amber50};box-shadow:0 0 8px ${alpha(PAL.amber50, .6)};}
.am2-mute{width:40px;padding:4px 0;border-radius:6px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.blue60s27};font:bold 9px sans-serif;cursor:pointer;text-align:center;}
.am2-mute.on{background:${PAL.red62};color:${PAL.white};border-color:${PAL.red62};}
.am2-phase{margin-top:10px;display:flex;gap:10px;align-items:center;}
.am2-liss{width:74px;height:74px;border-radius:8px;background:radial-gradient(circle,${PAL.blue06s62},${PAL.blue04});border:1px solid ${PAL.blue19};}
.am2-corr{flex:1;}
.am2-corr .bar{position:relative;height:12px;border-radius:6px;background:linear-gradient(to right,${PAL.red62},${PAL.orange30} 18%,${PAL.blue16s47} 50%,${PAL.blue30} 82%,${PAL.green53});box-shadow:inset 0 0 0 1px ${PAL.blue19};}
.am2-corr .bar{background:linear-gradient(to right,${PAL.red62} 0%,${PAL.orange30} 22%,${PAL.blue16s47} 50%,${PAL.green24} 78%,${PAL.green53} 100%);}
.am2-corr .ind{position:absolute;top:-3px;width:4px;height:18px;border-radius:2px;background:${PAL.white};box-shadow:0 0 5px ${PAL.white};}
.am2-corr .cl{display:flex;justify-content:space-between;font:9px 'Courier New',monospace;color:${PAL.blue53};margin-top:3px;}

.am2-master{display:flex;flex-direction:column;gap:14px;overflow:auto;}
.am2-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:16px;}
.am2-card h4{margin:0 0 12px;color:${PAL.sky69};font-size:13px;letter-spacing:2px;text-transform:uppercase;}
.am2-lufs{font:bold 38px 'Courier New',monospace;color:${PAL.sky91};text-align:center;line-height:1;}
.am2-lufs small{display:block;font-size:12px;color:${PAL.blue53};letter-spacing:2px;margin-top:6px;}
.am2-lhist{display:block;width:100%;height:96px;background:${PAL.blue07s63};border:1px solid ${PAL.blue19};border-radius:8px;margin-top:12px;}
.am2-tp{margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px;font:bold 11px sans-serif;letter-spacing:1px;color:${PAL.blue60s27};}
.am2-tp .led{width:12px;height:12px;border-radius:50%;background:${PAL.green24};}
.am2-tp.hot{color:${PAL.red71};} .am2-tp.hot .led{background:${PAL.red58};box-shadow:0 0 9px ${PAL.red58};}
.am2-vol{display:flex;align-items:center;gap:12px;}
.am2-vol input{flex:1;-webkit-appearance:none;appearance:none;height:18px;border-radius:10px;background:${PAL.blue16s47};box-shadow:inset 0 0 0 1px ${PAL.blue27s36};outline:none;cursor:pointer;}
.am2-vol input::-webkit-slider-thumb{-webkit-appearance:none;width:40px;height:28px;border-radius:9px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;}
.am2-vol b{font:bold 14px 'Courier New',monospace;color:${PAL.white};width:54px;text-align:right;}
.am2-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.am2-key{padding:16px 6px;border-radius:10px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky84};font:bold 12px sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;text-align:center;}
.am2-key:hover{background:${PAL.blue16s47};}
.am2-key.on{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
.am2-key.warn.on{background:${PAL.red62};color:${PAL.white};border-color:${PAL.red62};}
.am2-key.dim.on{background:${PAL.amber50};color:${PAL.orange06};border-color:${PAL.amber50};}
`;

export function injectAudioMonitorStyles(): void {
  addStyles('am2-styles', CSS);
}
