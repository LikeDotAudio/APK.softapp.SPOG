// src/editors/graphics-engine/styles — scoped CSS for the Graphics Engine editor.
// Injected once (keyed id). All classes are `gfx-`-prefixed; palette reuses the
// LCARS vars for cohesion. The stage renders broadcast-correct graphics (plates,
// drop shadows, title-safe) so the preview reads like real fill+key on air.

import { addStyles } from '../../ui/dom.js';
import { PAL, alpha } from '../../domain/palette.js';

export function injectGraphicsStyles(): void {
  addStyles(
    'twist-editor-graphics',
    `
.gfx{display:grid;grid-template-columns:230px minmax(0,1fr) 300px;gap:14px;height:100%;min-height:0;color:${PAL.sky91};}
.gfx-col{display:flex;flex-direction:column;gap:10px;min-height:0;}
.gfx-col h4{margin:0;color:${PAL.purple59};font:700 11px 'Courier New',monospace;letter-spacing:2px;text-transform:uppercase;}

/* ---- left rail: rundown / template list ---- */
.gfx-rail{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding-right:2px;}
.gfx-item{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:9px;cursor:pointer;
  background:${PAL.blue09s58};border:1px solid ${PAL.blue19};font:600 12px sans-serif;letter-spacing:.5px;color:${PAL.sky84s61};
  transition:background .12s,border-color .12s;}
.gfx-item:hover{background:${PAL.blue14s56};border-color:${PAL.blue31};}
.gfx-item.sel{background:${PAL.indigo13s50};border-color:${PAL.purple59};color:${PAL.violet93};box-shadow:0 0 8px ${alpha(PAL.purple59, .35)};}
.gfx-item .kind{margin-left:auto;font:10px 'Courier New',monospace;color:${PAL.blue60s27};letter-spacing:1px;}
.gfx-empty{color:${PAL.blue60s27};font:11px 'Courier New',monospace;padding:8px;}

/* ---- center: stage + lifecycle ---- */
.gfx-center{display:flex;flex-direction:column;gap:12px;min-width:0;}
.gfx-stage-wrap{position:relative;width:100%;aspect-ratio:16/9;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:12px;
  overflow:hidden;box-shadow:inset 0 0 40px ${alpha(PAL.black, .6)};
  /* checkerboard = the ALPHA the renderer would key over program (audit §4) */
  background-image:linear-gradient(45deg,${PAL.blue08s52} 25%,transparent 25%),linear-gradient(-45deg,${PAL.blue08s52} 25%,transparent 25%),
    linear-gradient(45deg,transparent 75%,${PAL.blue08s52} 75%),linear-gradient(-45deg,transparent 75%,${PAL.blue08s52} 75%);
  background-size:36px 36px;background-position:0 0,0 18px,18px -18px,-18px 0;}
.gfx-stage{position:absolute;inset:0;}
.gfx-layer{position:absolute;inset:0;overflow:hidden;}
.gfx-stage-badge{position:absolute;top:8px;left:10px;z-index:9;font:800 10px 'Courier New',monospace;letter-spacing:2px;
  color:${PAL.blue04};background:${PAL.purple59};padding:2px 8px;border-radius:5px;}
/* SMPTE ST 2046-1 guides: safe title 90% (5% margins), safe action 93% (3.5%). */
.gfx-safe-action{position:absolute;inset:3.5%;border:1px dashed ${alpha(PAL.sky69, .28)};pointer-events:none;z-index:8;}
.gfx-safe-title{position:absolute;inset:5%;border:1px dashed ${alpha(PAL.amber50_ffd600, .3)};pointer-events:none;z-index:8;}

.gfx-transport{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.gfx-btn{flex:1;min-width:64px;padding:11px 6px;border-radius:9px;border:1px solid ${PAL.blue19};background:${PAL.blue09s58};color:${PAL.sky91};
  font:800 12px 'Courier New',monospace;letter-spacing:1.5px;cursor:pointer;transition:filter .1s,background .1s;}
.gfx-btn:hover{filter:brightness(1.25);}
.gfx-btn:disabled{opacity:.35;cursor:not-allowed;filter:none;}
.gfx-btn.take{background:${PAL.green27};border-color:${PAL.green53};color:${PAL.green96};}
.gfx-btn.out{background:${PAL.red21};border-color:${PAL.red71};color:${PAL.red92};}
.gfx-btn.upd{background:${PAL.sky19};border-color:${PAL.sky69};}
.gfx-status{display:flex;gap:12px;align-items:center;font:11px 'Courier New',monospace;color:${PAL.blue60s27};letter-spacing:1px;}
.gfx-dot{width:9px;height:9px;border-radius:50%;background:${PAL.blue31};box-shadow:0 0 0 1px ${PAL.blue19};}
.gfx-dot.live{background:${PAL.red58};box-shadow:0 0 8px ${PAL.red58};animation:gfxpulse 1.1s ease-in-out infinite;}
@keyframes gfxpulse{50%{opacity:.4;}}

/* ---- right: field editor ---- */
.gfx-fields{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;}
.gfx-field{display:flex;flex-direction:column;gap:4px;}
.gfx-field label{font:10px 'Courier New',monospace;letter-spacing:1px;color:${PAL.blue60s27};text-transform:uppercase;}
.gfx-field input,.gfx-field textarea{background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:7px;color:${PAL.cyan96};
  font:13px sans-serif;padding:8px 9px;outline:none;resize:vertical;}
.gfx-field input:focus,.gfx-field textarea:focus{border-color:${PAL.purple59};box-shadow:0 0 6px ${alpha(PAL.purple59, .3)};}
.gfx-field textarea{min-height:74px;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;}
.gfx-hint{font:10px 'Courier New',monospace;color:${PAL.blue44s25};letter-spacing:.5px;}

/* ================= BROADCAST GRAPHICS (rendered onto the stage) ============= */
.gfx-graphic{position:absolute;inset:0;font-family:'Helvetica Neue',Arial,sans-serif;pointer-events:none;}
/* animate-IN / OUT: transform+opacity only (GPU compositor path, audit §3C) */
.gfx-graphic>*{opacity:0;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .4s ease;}
.gfx-graphic.on>*{opacity:1;transform:none;}
.gfx-graphic.gfx-out>*{opacity:0;transition:transform .55s ease-in,opacity .5s ease;}
.gfx-updated{animation:gfxflash .45s ease;}
@keyframes gfxflash{0%{filter:brightness(2.2);}100%{filter:brightness(1);}}

/* lower third / name super (audit §2A) */
.gfx-l3-plate{position:absolute;left:5%;bottom:11%;min-width:42%;max-width:70%;padding:12px 20px;border-radius:5px;
  background:linear-gradient(100deg,${alpha(PAL.purple59, .94)},${alpha(PAL.indigo29, .9)});
  box-shadow:0 6px 20px ${alpha(PAL.black, .55)};border-left:5px solid ${PAL.amber50};transform:translateX(-24px);}
.gfx-l3-name{font-weight:800;font-size:clamp(16px,3.4vw,30px);color:${PAL.white};letter-spacing:1px;text-shadow:0 2px 6px ${alpha(PAL.black, .6)};}
.gfx-l3-title{font-weight:600;font-size:clamp(10px,1.9vw,16px);color:${PAL.purple96};letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
.gfx-l3-loc{font:600 clamp(9px,1.5vw,13px)/'1' 'Courier New',monospace;color:${PAL.amber50};letter-spacing:2px;margin-top:5px;}

/* lists: up-next + participants (staggered entrance, audit §2C) */
.gfx-list-panel{position:absolute;right:6%;top:12%;width:42%;padding:16px;border-radius:10px;
  background:${alpha(PAL.blue06_060c1a, .86)};box-shadow:0 8px 26px ${alpha(PAL.black, .5)};border-top:4px solid ${PAL.purple59};}
.gfx-list-head{font-weight:800;font-size:clamp(13px,2.2vw,20px);color:${PAL.white};letter-spacing:2px;margin-bottom:10px;
  text-transform:uppercase;border-bottom:1px solid ${alpha(PAL.purple59, .4)};padding-bottom:7px;}
.gfx-list-row,.gfx-person-row{display:flex;align-items:center;gap:10px;padding:6px 0;
  font-weight:600;font-size:clamp(11px,1.8vw,16px);color:${PAL.sky96s100};
  transform:translateX(30px);transition-delay:calc(var(--i,0)*.07s)!important;}
.gfx-graphic.on .gfx-list-row,.gfx-graphic.on .gfx-person-row{transform:none;}
.gfx-list-dot{width:8px;height:8px;border-radius:50%;background:${PAL.amber50};flex:0 0 auto;box-shadow:0 0 6px ${PAL.amber50};}
.gfx-headshot{width:38px;height:38px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  font-weight:800;color:${PAL.blue04};background:linear-gradient(135deg,${PAL.purple59},${PAL.sky69});}
.gfx-person-txt{display:flex;flex-direction:column;line-height:1.2;}
.gfx-person-txt b{color:${PAL.white};letter-spacing:.5px;}
.gfx-person-txt span{font:600 11px 'Courier New',monospace;color:${PAL.violet75};letter-spacing:1px;text-transform:uppercase;}

/* bug / DOG (audit §2B) — persistent corner */
.gfx-bug-box{position:absolute;top:6%;right:5%;padding:7px 12px;border-radius:6px;background:${alpha(PAL.blue06_060c1a, .7)};
  backdrop-filter:blur(2px);border:1px solid ${alpha(PAL.purple59, .5)};text-align:right;transform:translateY(-14px);}
.gfx-bug-box b{color:${PAL.white};font-weight:900;letter-spacing:2px;font-size:clamp(11px,1.8vw,17px);}
.gfx-bug-sub{display:block;color:${PAL.red68s100};font:800 9px 'Courier New',monospace;letter-spacing:2px;}

/* ticker / crawl (audit §2B) */
.gfx-ticker-bar{position:absolute;left:0;right:0;bottom:6%;height:clamp(26px,5vw,44px);display:flex;align-items:center;
  background:linear-gradient(90deg,${alpha(PAL.blue06_060c1a, .96)},${alpha(PAL.blue06_060c1a, .9)});border-top:2px solid ${PAL.purple59};transform:translateY(30px);}
.gfx-ticker-tag{flex:0 0 auto;height:100%;display:flex;align-items:center;padding:0 14px;background:${PAL.red58};color:${PAL.white};
  font-weight:900;letter-spacing:2px;font-size:clamp(10px,1.7vw,15px);}
.gfx-ticker-track{flex:1;overflow:hidden;white-space:nowrap;}
.gfx-ticker-crawl{display:inline-block;padding-left:100%;color:${PAL.sky96s100};font-weight:700;letter-spacing:1px;
  font-size:clamp(11px,1.8vw,16px);animation:gfxcrawl 22s linear infinite;}
@keyframes gfxcrawl{to{transform:translateX(-100%);}}
.gfx-crawl-el{white-space:nowrap;}
.gfx-crawl-sep{color:${PAL.amber50};font-weight:900;}

/* credit roll (audit §2C) — one card at a time; NEXT transitions the next over */
.gfx-credit-card{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;gap:10px;
  align-items:center;justify-content:center;padding:0 12%;text-align:center;}
.gfx-credit-row{display:flex;align-items:baseline;width:100%;max-width:80%;gap:6px;
  font-size:clamp(13px,2.6vw,26px);color:${PAL.white};}
.gfx-credit-role{font-weight:600;color:${PAL.violet75};letter-spacing:2px;text-transform:uppercase;white-space:nowrap;}
.gfx-credit-lead{flex:1;border-bottom:2px dotted ${alpha(PAL.violet75, .55)};transform:translateY(-4px);}
.gfx-credit-name{font-weight:900;letter-spacing:1px;white-space:nowrap;text-shadow:0 2px 8px ${alpha(PAL.black, .6)};}
.gfx-credit-line{font-weight:800;font-size:clamp(14px,3vw,30px);color:${PAL.white};letter-spacing:2px;}

/* full-screen title (audit §2A) */
.gfx-fs{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  background:radial-gradient(120% 120% at 50% 30%,${alpha(PAL.indigo18, .55)},${alpha(PAL.blue04, .9)});}
.gfx-fs-title{font-weight:900;font-size:clamp(22px,6vw,58px);color:${PAL.white};letter-spacing:2px;text-shadow:0 4px 18px ${alpha(PAL.purple59, .6)};
  transform:scale(.9);}
.gfx-fs-sub{font-weight:600;font-size:clamp(11px,2.4vw,22px);color:${PAL.amber50};letter-spacing:4px;text-transform:uppercase;margin-top:10px;}

/* score bug (audit §2B) — update-in-place */
.gfx-score{position:absolute;top:6%;left:50%;transform:translate(-50%,-16px);display:flex;align-items:stretch;
  background:${alpha(PAL.blue06_060c1a, .92)};border-radius:8px;overflow:hidden;box-shadow:0 6px 18px ${alpha(PAL.black, .5)};border:1px solid ${PAL.blue31};}
.gfx-score-team{display:flex;align-items:center;gap:9px;padding:7px 13px;font-weight:800;color:${PAL.white};letter-spacing:1px;}
.gfx-score-name{font-size:clamp(11px,1.8vw,16px);}
.gfx-score-pts{font-size:clamp(14px,2.6vw,22px);color:${PAL.amber50};min-width:22px;text-align:center;}
.gfx-score-clock{display:flex;align-items:center;padding:0 12px;background:${PAL.purple59};color:${PAL.blue04};font-weight:900;
  font-family:'Courier New',monospace;letter-spacing:1px;}

/* ---- crawl item editor (ticker): running list, enable + reorder for NEXT ---- */
.gfx-crawl{display:flex;flex-direction:column;gap:5px;background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:10px;
  padding:10px 12px;max-height:280px;overflow-y:auto;}
.gfx-crawl-h{color:${PAL.purple59};font:700 11px 'Courier New',monospace;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px;}
.gfx-crawl-row{display:flex;align-items:center;gap:8px;}
.gfx-crawl-row input[type=checkbox]{width:15px;height:15px;accent-color:${PAL.purple59};cursor:pointer;flex:0 0 auto;}
.gfx-crawl-n{font:bold 10px 'Courier New',monospace;color:${PAL.sky44s20};min-width:16px;text-align:right;}
.gfx-crawl-text{flex:1;min-width:0;background:${PAL.blue09};color:${PAL.sky96s100};border:1px solid ${PAL.blue27s36};border-radius:6px;
  padding:5px 8px;font:12px sans-serif;}
.gfx-crawl-row.off .gfx-crawl-text{opacity:.45;}
.gfx-crawl-mv{flex:0 0 auto;width:24px;height:24px;border:none;border-radius:6px;background:${PAL.blue16_16233d};color:${PAL.sky84};
  cursor:pointer;font-size:12px;line-height:1;}
.gfx-crawl-mv:hover{filter:brightness(1.35);}
`,
  );
}
