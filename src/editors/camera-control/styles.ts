// src/editors/camera-control/styles — all CSS for the CCU/RCP console.
// Ported verbatim from js/editors/camera/styles.js so visuals match 1:1.

import { PAL, alpha } from '../../domain/palette.js';

export const CSS = `
.cc-wrap{display:grid;grid-template-columns:minmax(0,1fr) 580px;grid-template-rows:minmax(0,1fr) auto;gap:12px;height:100%;
  user-select:none;-webkit-user-select:none;-moz-user-select:none;}

/* ---- the glass (everything overlaid) ---- */
.cc-glass{grid-column:1;grid-row:1;position:relative;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:12px;overflow:hidden;min-height:320px;}
/* the "video" is a true 1:1 square, centred, with the scopes/maps overlaid on it */
.cc-video{position:absolute;top:0;bottom:10px;left:50%;transform:translateX(-50%);aspect-ratio:1/1;overflow:hidden;background:${PAL.blue04};box-shadow:0 0 0 1px ${PAL.blue14};}
.cc-scene{position:absolute;inset:0;transition:filter .12s;background:${PAL.blue04};overflow:hidden;}
/* The camera picture is the routed source's FAUX SIGNAL (person-in-a-room). It
   fills the scene; the frame loop applies pan/tilt/zoom as a transform over it. */
.cc-subject{position:absolute;inset:0;width:100%;height:100%;display:block;
    transform-origin:center center;transition:transform .1s linear;will-change:transform;}
/* Colour bars: the largest 1:1 square that fits (full height), centred */
.cc-smpte{position:absolute;top:0;bottom:10px;left:50%;transform:translateX(-50%);aspect-ratio:1/1;display:none;z-index:1;}
.cc-smpte.on{display:block;} .cc-smpte canvas{width:100%;height:100%;display:block;}
/* the bouncing DVD-style lineage badge (parent › child › grandchild) — big & fast */
.cc-dvd{position:absolute;left:0;top:0;display:none;padding:12px 22px;border:3px solid currentColor;border-radius:10px;
    font:900 22px 'Courier New',monospace;letter-spacing:2px;color:${PAL.white};white-space:nowrap;z-index:6;pointer-events:none;
    background:${alpha(PAL.black, .4)};text-shadow:0 0 8px ${alpha(PAL.black, .9)};box-shadow:0 0 18px currentColor;}
.cc-dvd.on{display:block;}

.cc-osd{position:absolute;left:50%;transform:translateX(-50%);top:8px;font:bold 12px 'Courier New',monospace;color:${PAL.green90};letter-spacing:1px;text-shadow:0 0 4px ${PAL.black};z-index:5;}
.cc-rec{position:absolute;right:14px;top:8px;color:${PAL.red68s100};font:bold 12px 'Courier New',monospace;z-index:5;display:none;}
.cc-rec.on{display:block;animation:ccBlink 1s steps(2) infinite;}
@keyframes ccBlink{50%{opacity:.2;}}

/* ---- LEFT-docked scopes: vectorscope (top) + RGB-parade waveform (bottom).
   Each is a resizable box; the corner handle (.cc-rsz) grows it, and the canvas
   redraws to its new client size every frame. ---- */
.cc-scope{position:absolute;z-index:4;}
.cc-vecbox{left:10px;top:30px;width:172px;height:172px;}
.cc-vec{display:block;width:100%;height:100%;border-radius:50%;
    background:radial-gradient(circle,${alpha(PAL.black, .5)},${alpha(PAL.black, .85)});border:1px solid ${PAL.blue27s36};}
.cc-wfbox{left:10px;bottom:10px;width:330px;height:150px;background:${alpha(PAL.sky02, .72)};
    border:1px solid ${PAL.blue22};border-radius:9px;overflow:hidden;}
.cc-wf{display:block;width:100%;height:100%;}
.cc-wf-tag{position:absolute;left:50%;transform:translateX(-50%);top:5px;z-index:2;font:bold 10px 'Courier New',monospace;letter-spacing:2px;color:${PAL.sky69};pointer-events:none;text-shadow:0 0 4px ${PAL.black};}
.cc-rsz{position:absolute;right:2px;top:2px;width:18px;height:18px;cursor:nesw-resize;z-index:6;touch-action:none;
    background:repeating-linear-gradient(45deg,transparent 0 3px,${PAL.sky69} 3px 4px);border-radius:0 8px 0 0;opacity:.65;}
.cc-rsz:hover{opacity:1;}

/* robotics maps (camera visualization) — translucent overlays, docked RIGHT */
.cc-map{position:absolute;right:10px;z-index:4;border:1px solid ${alpha(PAL.sky69, .32)};border-radius:8px;overflow:hidden;background:${alpha(PAL.blue04, .5)};}
.cc-map.top{top:30px;width:216px;height:150px;} .cc-map.side{top:190px;width:216px;height:118px;}
.cc-map .lbl{position:absolute;left:7px;top:4px;z-index:2;font:bold 8px 'Courier New',monospace;letter-spacing:1px;color:${PAL.sky69};}
.cc-map svg{width:100%;height:100%;}

/* ---- right rail ---- */
.cc-rail{grid-column:2;grid-row:1;display:flex;flex-direction:column;gap:10px;overflow:auto;padding-right:2px;}
.cc-card{background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:12px;padding:6px 14px;}
.cc-card h4{margin:0 0 8px;color:${PAL.sky69};font-size:13px;letter-spacing:2px;text-transform:uppercase;}
.cc-knobs{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
.cc-knobs .cc-dial{width:72px;height:72px;}
.cc-kn{display:flex;flex-direction:column;align-items:center;gap:6px;}

/* motorized rotary encoder: notched bezel, glowing value arc, metallic cap, lit pointer */
.cc-dial{width:80px;height:80px;border-radius:50%;position:relative;cursor:ns-resize;touch-action:none;
    background:repeating-conic-gradient(from -136deg,${PAL.blue31} 0 1.5deg,transparent 1.5deg 14deg), ${PAL.blue09};box-shadow:0 5px 13px ${alpha(PAL.black, .55)};}
.cc-dial::before{content:'';position:absolute;inset:9%;border-radius:50%;
    background:conic-gradient(from 225deg,var(--c,${PAL.sky69}) calc(var(--p,50%) * 0.75),${PAL.blue15} 0);
    -webkit-mask:radial-gradient(circle,transparent 53%,${PAL.black} 55%);mask:radial-gradient(circle,transparent 53%,${PAL.black} 55%);filter:drop-shadow(0 0 5px var(--c,${PAL.sky69}));}
.cc-dial::after{content:'';position:absolute;inset:24%;border-radius:50%;background:radial-gradient(circle at 42% 32%,${PAL.sky40},${PAL.blue15} 72%);
    box-shadow:inset 0 2px 5px ${alpha(PAL.white, .2)},inset 0 -3px 6px ${alpha(PAL.black, .55)},0 2px 5px ${alpha(PAL.black, .5)};}
.cc-dial .ptr{position:absolute;left:50%;top:50%;width:4px;height:36%;border-radius:3px;background:var(--c,${PAL.sky69});box-shadow:0 0 6px var(--c,${PAL.sky69});
    transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(var(--rot,0deg));z-index:2;}
.cc-kn span{font-size:11px;color:${PAL.sky71};letter-spacing:.5px;text-align:center;} .cc-kn b{font:bold 13px 'Courier New',monospace;color:${PAL.sky91};}

/* RGB Venn: spread gains form the outer triangle, blacks cluster in the middle */
.cc-venn{position:relative;width:500px;max-width:100%;height:182px;margin:2px auto;}
.cc-venn-bg{position:absolute;inset:0;pointer-events:none;}
.cc-venn-bg span{position:absolute;width:280px;height:195px;border-radius:50%;mix-blend-mode:screen;opacity:.4;filter:blur(5px);}
.cc-venn-bg .r{background:${PAL.red58};left:-35px;top:-46px;} .cc-venn-bg .g{background:${PAL.green48};left:255px;top:-46px;} .cc-venn-bg .b{background:${PAL.blue59};left:110px;top:40px;}
.cc-venn .slot{position:absolute;transform:translate(-50%,-50%);}
.cc-venn .slot .cc-dial{width:80px;height:80px;}
.cc-venn .slot.blk .cc-dial{width:48px;height:48px;}
.cc-venn .slot .cc-kn{gap:3px;} .cc-venn .slot.blk .cc-kn b,.cc-venn .slot.blk .cc-kn span{font-size:10px;}

/* joystick + sliders */
.cc-stick{position:relative;width:214px;height:214px;margin:2px auto;border-radius:50%;background:radial-gradient(circle,${PAL.blue19},${PAL.blue09s58});border:3px solid ${PAL.blue27s36};touch-action:none;cursor:grab;}
.cc-stick .puck{position:absolute;left:50%;top:50%;width:74px;height:74px;border-radius:50%;background:radial-gradient(circle at 35% 30%,${PAL.sky81},${PAL.sky48});box-shadow:0 8px 18px ${alpha(PAL.black, .6)};transform:translate(-50%,-50%);}
.cc-stick .puck::after{content:'';position:absolute;inset:30%;border-radius:50%;border:2px solid ${alpha(PAL.white, .35)};}
.cc-stick .ring{position:absolute;inset:20px;border-radius:50%;border:2px dashed ${PAL.blue27s36};}
/* RATE — scales how fast the PTZ pans / tilts / recalls */
.cc-rate{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
.cc-rate label{font-size:13px;font-weight:900;color:${PAL.sky71};letter-spacing:2px;width:48px;}
.cc-rate input{flex:1;-webkit-appearance:none;appearance:none;height:18px;border-radius:11px;background:${PAL.blue19};box-shadow:inset 0 0 0 1px ${PAL.blue27s36};outline:none;cursor:pointer;}
.cc-rate input::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:26px;border-radius:9px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;box-shadow:0 3px 8px ${alpha(PAL.black, .5)};}
.cc-rate input::-moz-range-thumb{width:30px;height:26px;border-radius:9px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;}
.cc-ratev{font:bold 13px 'Courier New',monospace;color:${PAL.sky81};width:46px;text-align:right;}
/* Ped (left) + joystick + Zoom (right) on a row; Dolly is the full-width rail below */
.cc-jsgrid{display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;gap:10px 12px;align-items:center;justify-items:center;}
.cc-vside{display:flex;flex-direction:column;align-items:center;gap:8px;}
.cc-vside label{font-size:13px;font-weight:900;color:${PAL.sky71};letter-spacing:2px;}
.cc-vbar{-webkit-appearance:none;appearance:none;writing-mode:vertical-lr;direction:rtl;width:30px;height:190px;border-radius:16px;background:${PAL.blue19};box-shadow:inset 0 0 0 1px ${PAL.blue27s36};outline:none;cursor:pointer;}
.cc-vbar::-webkit-slider-thumb{-webkit-appearance:none;width:42px;height:34px;border-radius:9px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;box-shadow:0 3px 8px ${alpha(PAL.black, .5)};}
.cc-vbar::-moz-range-thumb{width:42px;height:34px;border-radius:9px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;}
.cc-dollybar{grid-column:1 / -1;width:100%;display:flex;align-items:center;gap:12px;}
.cc-dollybar label{font-size:13px;font-weight:900;color:${PAL.sky71};letter-spacing:2px;width:60px;}
.cc-dollybar input{flex:1;-webkit-appearance:none;appearance:none;height:22px;border-radius:13px;background:${PAL.blue19};box-shadow:inset 0 0 0 1px ${PAL.blue27s36};outline:none;cursor:pointer;}
.cc-dollybar input::-webkit-slider-thumb{-webkit-appearance:none;width:48px;height:34px;border-radius:11px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;box-shadow:0 3px 8px ${alpha(PAL.black, .5)};}
.cc-dollybar input::-moz-range-thumb{width:48px;height:34px;border-radius:11px;background:radial-gradient(circle at 40% 35%,${PAL.sky81},${PAL.sky48});border:2px solid ${PAL.sky05};cursor:pointer;}
.cc-hint{font-size:11px;color:${PAL.blue53};margin-top:6px;letter-spacing:.5px;text-align:center;}

.cc-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.cc-key{padding:16px 6px;border-radius:10px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};color:${PAL.sky84};font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;cursor:pointer;text-align:center;}
.cc-key:hover{background:${PAL.blue19};} .cc-key.on{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};}
/* telemetry as its own overlaid box on the glass (bottom-left, above waveform) */
.cc-tel-box{position:absolute;right:10px;bottom:10px;z-index:5;background:${alpha(PAL.blue04, .66)};border:1px solid ${PAL.blue22};border-radius:9px;padding:10px 13px;min-width:160px;}
/* glass function buttons */
.cc-fbtn{position:absolute;z-index:6;padding:13px 20px;border-radius:11px;border:1px solid ${PAL.blue27s36};background:${alpha(PAL.blue12_0c1730, .86)};color:${PAL.sky84};font:900 13px sans-serif;letter-spacing:2px;text-transform:uppercase;cursor:pointer;user-select:none;}
.cc-fbtn:hover{background:${alpha(PAL.blue19, .92)};}
.cc-fbtn.on{background:${PAL.sky69};color:${PAL.sky05};border-color:${PAL.sky69};box-shadow:0 0 12px ${alpha(PAL.sky69, .5)};}
.cc-bars-btn{right:14px;bottom:144px;}
.cc-wb-btn{left:10px;top:50%;transform:translateY(-50%);overflow:hidden;}
.cc-wb-btn .fill{position:absolute;left:0;bottom:0;width:100%;height:0;background:${alpha(PAL.amber50, .35)};z-index:-1;transition:none;}
.cc-wb-btn.on{background:${PAL.green53};color:${PAL.green05};border-color:${PAL.green53};box-shadow:0 0 12px ${alpha(PAL.green53, .5)};}
.cc-tel-box .cap{color:${PAL.sky69};font:bold 9px 'Courier New',monospace;letter-spacing:2px;margin-bottom:5px;}
.cc-tel{font:12px 'Courier New',monospace;color:${PAL.sky84s100};line-height:1.75;} .cc-tel b{color:${PAL.white};}
/* camera nickname field */
.cc-nick{width:100%;box-sizing:border-box;margin-bottom:10px;background:${PAL.blue09};border:1px solid ${PAL.blue27s36};border-radius:8px;color:${PAL.white};font:bold 14px 'Courier New',monospace;letter-spacing:1px;padding:9px 11px;}
.cc-nick::placeholder{color:${PAL.blue53};}

/* ---- footer ---- */
.cc-foot{grid-column:1 / -1;grid-row:2;display:flex;gap:16px;align-items:stretch;}
.cc-foot .cc-card{flex:1;min-width:0;}
.cc-tallies{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;}
.cc-tally{flex:1;min-width:64px;height:58px;border-radius:9px;border:2px solid ${PAL.blue27s36};background:${PAL.blue09s58};color:${PAL.sky71};font-weight:900;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;}
.cc-tally .st{position:absolute;top:5px;right:6px;width:10px;height:10px;border-radius:50%;background:${PAL.blue27s36};}
/* Inherited device name (assigned camera) — smaller type so lineage names fit. */
.cc-tally.named{font-size:10px;letter-spacing:.4px;padding:0 6px;text-align:center;line-height:1.2;}
.cc-tally.sel{outline:2px solid ${PAL.sky69};color:${PAL.white};}
.cc-tally.live{border-color:${PAL.red62};color:${PAL.red71};} .cc-tally.live .st{background:${PAL.red62};box-shadow:0 0 8px ${PAL.red62};}
.cc-tally.pvw{border-color:${PAL.green53};color:${PAL.green70s74};} .cc-tally.pvw .st{background:${PAL.green53};}
.cc-foot .cc-pre{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;}
.cc-foot .cc-pre .cc-key{padding:18px 6px;font-size:15px;} .cc-foot .cc-pre .cc-key.set{border-color:${PAL.green53};color:${PAL.green70s74};}
.cc-foot .cc-keys{margin-top:10px;max-width:460px;}
`;
