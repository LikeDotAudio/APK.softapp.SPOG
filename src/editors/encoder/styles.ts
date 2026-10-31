// src/editors/encoder/styles — verbatim port of the legacy addStyles('enc-styles', …)
// block from js/editors/encoder.js. Kept byte-for-byte so the visuals match.

import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

const CSS = `
.enc{display:grid;grid-template-columns:280px minmax(0,1fr) 300px;gap:16px;height:100%;}
.enc-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:14px;}
.enc-card h4{margin:0 0 12px;color:${PAL.sky69};font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.enc-col{display:flex;flex-direction:column;gap:14px;overflow:auto;}
/* input mezzanine */
.enc-mez{position:relative;aspect-ratio:1/1;border-radius:8px;overflow:hidden;border:1px solid ${PAL.blue19};background:${PAL.blue04};}
.enc-mez .pic{position:absolute;inset:0;background:linear-gradient(135deg,${PAL.blue28},${PAL.blue09s55});animation:encPan 9s ease-in-out infinite alternate;}
@keyframes encPan{from{filter:hue-rotate(0)}to{filter:hue-rotate(40deg)}}
.enc-mez .tag{position:absolute;left:6px;top:5px;font:bold 10px 'Courier New',monospace;color:${PAL.green81};letter-spacing:1px;}
.enc-mez .gold{position:absolute;right:6px;top:5px;font:bold 10px 'Courier New',monospace;color:${PAL.amber50};}
.enc-streams{display:flex;flex-direction:column;gap:8px;}
.enc-strm{display:flex;gap:8px;align-items:center;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:8px;padding:6px;}
.enc-strm .pic{width:40px;height:40px;border-radius:5px;flex:0 0 auto;display:block;background:${PAL.blue09s55};}
.enc-strm .nm{font:bold 11px sans-serif;color:${PAL.sky91};letter-spacing:1px;} .enc-strm .nm small{display:block;color:${PAL.blue60s27};font-size:9px;letter-spacing:1px;font-weight:normal;}
.enc-shead{grid-column:1 / -1;font:bold 10px 'Courier New',monospace;color:${PAL.sky69};letter-spacing:1px;margin-top:8px;padding-top:6px;border-top:1px solid ${PAL.blue19};}
.enc-aud{display:flex;flex-direction:column;gap:7px;margin-top:10px;}
.enc-arow{display:flex;align-items:center;gap:8px;}
.enc-arow .lab{width:96px;font:11px sans-serif;color:${PAL.sky91};} .enc-arow .lab small{color:${PAL.blue60s27};}
.enc-arow .m{flex:1;height:8px;border-radius:5px;background:${PAL.blue16s47};overflow:hidden;box-shadow:inset 0 0 0 1px ${PAL.blue27s36};}
.enc-arow .m i{display:block;height:100%;background:linear-gradient(90deg,${PAL.green53},${PAL.amber50});}
.enc-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
.enc-badge{font:bold 9px 'Courier New',monospace;letter-spacing:1px;color:${PAL.sky71};border:1px solid ${PAL.blue27s36};border-radius:5px;padding:4px 7px;background:${PAL.blue12_0c1730};}
.enc-badge.on{color:${PAL.green53};border-color:${PAL.green24};}
/* output map */
.enc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.enc-tile{position:relative;background:${PAL.blue12_0c1730};border:1px solid ${PAL.blue27s36};border-radius:10px;padding:12px;cursor:pointer;overflow:hidden;}
.enc-tile .ar{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.enc-tile .arbox{border:2px solid ${PAL.sky69};border-radius:2px;flex:0 0 auto;}
.enc-tile b{font:bold 15px 'Courier New',monospace;color:${PAL.white};} .enc-tile .codec{font:10px sans-serif;color:${PAL.blue60s27};}
.enc-tile .br{font:11px 'Courier New',monospace;color:${PAL.sky79};margin-top:4px;}
.enc-tile .led{position:absolute;right:10px;top:10px;width:11px;height:11px;border-radius:50%;background:${PAL.green53};box-shadow:0 0 7px ${PAL.green53};}
.enc-tile.off{opacity:.4;} .enc-tile.off .led{background:${PAL.blue29};box-shadow:none;}
.enc-tile.err{border-color:${PAL.red62};} .enc-tile.err .led{background:${PAL.red58};box-shadow:0 0 9px ${PAL.red58};}
.enc-tile .dest{font:9px 'Courier New',monospace;color:${PAL.sky69};margin-top:6px;letter-spacing:.5px;}
/* destinations vault */
.enc-dest{display:flex;flex-direction:column;gap:8px;}
.enc-d{display:flex;align-items:center;gap:8px;padding:10px;border-radius:8px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};cursor:pointer;}
.enc-d.sel{border-color:${PAL.sky69};background:${PAL.blue15};}
.enc-d .lk{width:22px;text-align:center;color:${PAL.green53};} .enc-d .nm{flex:1;font:bold 12px sans-serif;color:${PAL.sky91};}
.enc-d .pr{font:bold 9px 'Courier New',monospace;color:${PAL.blue60s27};border:1px solid ${PAL.blue27s36};border-radius:4px;padding:2px 5px;}
.enc-fo{display:flex;gap:8px;margin-top:6px;}
.enc-fo .pill{flex:1;text-align:center;padding:9px;border-radius:8px;font:bold 11px sans-serif;letter-spacing:1px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.blue60s27};}
.enc-fo .pill.on{background:${PAL.green24};color:${PAL.green81};border-color:${PAL.green53};}
.enc-key{padding:12px;border-radius:8px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky84};font:bold 11px sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;text-align:center;margin-top:8px;}
.enc-key.on{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
.enc-health{font:11px 'Courier New',monospace;line-height:1.9;color:${PAL.sky71};}
.enc-health .ok{color:var(--state-good);} .enc-health .bad{color:var(--state-dead);}
.enc-scte{margin-top:12px;padding:14px;border-radius:9px;border:1px solid ${PAL.red71};background:${PAL.red07};color:${PAL.red80};font:900 13px sans-serif;letter-spacing:2px;text-transform:uppercase;cursor:pointer;text-align:center;}
.enc-scte:hover{background:${PAL.red12};}
.enc-scte.on{background:${PAL.red62};color:${PAL.white};border-color:${PAL.red62};box-shadow:0 0 16px rgba(255,59,59,.7);}
.enc-toast{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:rgba(255,59,59,.92);color:${PAL.white};font:bold 11px 'Courier New',monospace;padding:7px 13px;border-radius:7px;z-index:5;white-space:nowrap;animation:encToast 1.8s ease forwards;}
@keyframes encToast{0%{opacity:0;transform:translate(-50%,12px)}15%{opacity:1;transform:translate(-50%,0)}85%{opacity:1}100%{opacity:0}}
`;

export function injectEncoderStyles(): void {
  addStyles('enc-styles', CSS);
}
