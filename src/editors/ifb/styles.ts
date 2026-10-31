// src/editors/ifb/styles — verbatim port of the legacy addStyles('ifb-styles', …)
// CSS block from js/editors/ifb.js so the IFB visuals match 1:1.

import { addStyles } from '../../ui/dom.js';
import { PAL, alpha } from '../../domain/palette.js';

export function injectIfbStyles(): void {
  addStyles(
    'ifb-styles',
    `
.ifb{display:grid;grid-template-columns:200px minmax(0,1fr) 320px;gap:16px;height:100%;}
.ifb-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:16px;}
.ifb-card h4{margin:0 0 12px;color:${PAL.sky69};font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.ifb-ins{display:flex;flex-direction:column;gap:16px;}
.ifb-strip{display:flex;gap:12px;align-items:flex-end;}
.ifb-meter{position:relative;width:26px;height:150px;border-radius:5px;overflow:hidden;box-shadow:inset 0 0 0 1px ${PAL.blue19};
    background:linear-gradient(to top,${PAL.green27},${PAL.green53} 55%,${PAL.amber50} 80%,${PAL.red58} 100%);}
.ifb-meter .mask{position:absolute;left:0;right:0;top:0;background:${PAL.blue07s63};}
.ifb-stripinfo b{display:block;font:bold 12px sans-serif;color:${PAL.sky91};letter-spacing:1px;}
.ifb-stripinfo span{font:10px 'Courier New',monospace;color:${PAL.blue60s27};}

/* confidence feed (centre) */
.ifb-conf{position:relative;flex:1;display:flex;flex-direction:column;}
.ifb-feed{flex:1;position:relative;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:10px;overflow:hidden;min-height:200px;}
.ifb-feed canvas{position:absolute;inset:0;width:100%;height:100%;}
.ifb-status{position:absolute;left:50%;top:14px;transform:translateX(-50%);font:900 16px sans-serif;letter-spacing:3px;z-index:2;
    color:${PAL.green53};text-shadow:0 0 8px ${alpha(PAL.black, .7)};}
.ifb-status.talk{color:${PAL.red71};animation:ifbB 1s steps(2) infinite;}
@keyframes ifbB{50%{opacity:.35;}}
.ifb-duckwrap{margin-top:12px;}
.ifb-duck{position:relative;height:64px;background:${PAL.blue07s63};border:1px solid ${PAL.blue19};border-radius:8px;overflow:hidden;}
.ifb-duck canvas{position:absolute;inset:0;width:100%;height:100%;}
.ifb-cap{font:bold 10px 'Courier New',monospace;color:${PAL.sky69};letter-spacing:1px;margin:4px 2px;}

/* right: encoders + talk hierarchy */
.ifb-right{display:flex;flex-direction:column;gap:14px;overflow:auto;}
.ifb-knobs{display:flex;justify-content:space-around;}
.ifb-kn{display:flex;flex-direction:column;align-items:center;gap:7px;}
.ifb-dial{width:84px;height:84px;border-radius:50%;position:relative;cursor:ns-resize;touch-action:none;
    background:repeating-conic-gradient(from -136deg,${PAL.blue31} 0 1.5deg,transparent 1.5deg 14deg),${PAL.blue07s63};box-shadow:0 5px 13px ${alpha(PAL.black, .55)};}
.ifb-dial::before{content:'';position:absolute;inset:9%;border-radius:50%;background:conic-gradient(from 225deg,var(--c,${PAL.sky69}) calc(var(--p,50%) * 0.75),${PAL.blue16s48} 0);
    -webkit-mask:radial-gradient(circle,transparent 53%,${PAL.black} 55%);mask:radial-gradient(circle,transparent 53%,${PAL.black} 55%);filter:drop-shadow(0 0 5px var(--c,${PAL.sky69}));}
.ifb-dial::after{content:'';position:absolute;inset:24%;border-radius:50%;background:radial-gradient(circle at 42% 32%,${PAL.sky40},${PAL.blue15} 72%);box-shadow:inset 0 2px 5px ${alpha(PAL.white, .2)},0 2px 5px ${alpha(PAL.black, .5)};}
.ifb-dial i{position:absolute;left:50%;top:50%;width:4px;height:36%;border-radius:3px;background:var(--c,${PAL.sky69});box-shadow:0 0 6px var(--c,${PAL.sky69});transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(var(--rot,0deg));}
.ifb-kn b{font:bold 13px 'Courier New',monospace;color:${PAL.sky91};} .ifb-kn span{font-size:11px;color:${PAL.sky71};}
.ifb-talks{display:flex;flex-direction:column;gap:10px;}
.ifb-talk{display:flex;align-items:center;gap:12px;padding:14px;border-radius:10px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};cursor:pointer;user-select:none;}
.ifb-talk .pr{width:34px;height:34px;border-radius:8px;background:${PAL.blue15};color:${PAL.sky71};font:900 14px sans-serif;display:flex;align-items:center;justify-content:center;}
.ifb-talk .nm{flex:1;font:bold 13px sans-serif;color:${PAL.sky91};letter-spacing:1px;} .ifb-talk .nm small{display:block;color:${PAL.blue60s27};font-weight:normal;letter-spacing:0;}
.ifb-talk.on{background:${PAL.red62};border-color:${PAL.red62};} .ifb-talk.on .pr{background:${PAL.black};color:${PAL.red80};} .ifb-talk.on .nm{color:${PAL.white};}
.ifb-talk.p1.on{box-shadow:0 0 14px ${alpha(PAL.red62, .7)};}

/* delivery split: wired stage-box leg + wireless RF leg, fed by one routing decision */
.ifb-routes{display:flex;gap:6px;margin-bottom:10px;}
.ifb-route{flex:1;font:800 10px 'Courier New',monospace;letter-spacing:1px;padding:8px 4px;border:1px solid ${PAL.blue27s36};
    border-radius:8px;background:${PAL.blue12_0c1730};color:${PAL.sky71};cursor:pointer;}
.ifb-route.sel{background:${PAL.cyan52};border-color:${PAL.cyan52};color:${PAL.cyan09};box-shadow:0 0 10px ${alpha(PAL.cyan52, .45)};}
.ifb-leg{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid ${PAL.blue22s39};
    background:${PAL.blue09s58};margin-bottom:8px;opacity:.45;}
.ifb-leg.on{opacity:1;border-color:${PAL.cyan52};}
.ifb-leg .led{width:10px;height:10px;border-radius:50%;background:${PAL.blue31};flex:0 0 auto;}
.ifb-leg.on .led{background:${PAL.green53};box-shadow:0 0 8px ${PAL.green53};}
.ifb-leg .nm{flex:1;font:bold 11px sans-serif;color:${PAL.sky91};letter-spacing:1px;}
.ifb-leg .nm small{display:block;color:${PAL.blue60s27};font-weight:normal;letter-spacing:0;font-size:9px;}
.ifb-leg .open{font:800 9px 'Courier New',monospace;letter-spacing:1px;border:1px solid ${PAL.cyan37s54};border-radius:6px;
    background:${PAL.cyan12};color:${PAL.cyan52};padding:6px 8px;cursor:pointer;}
.ifb-leg .open:hover{background:${PAL.cyan18};}
`,
  );
}
