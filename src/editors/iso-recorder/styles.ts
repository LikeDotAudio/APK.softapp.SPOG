// src/editors/iso-recorder/styles — verbatim port of the legacy addStyles block.

import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

export function injectIsoRecorderStyles(): void {
  addStyles(
    'twist-editor-iso-recorder',
    `
        /* ===== ISO recorder + instant replay ===== */
        .iso-sec{margin-bottom:24px;}
        .iso-bar{display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap;}
        .iso-disk{flex:1;min-width:160px;height:14px;border-radius:7px;background:${PAL.blue09};overflow:hidden;}
        .iso-disk > i{display:block;height:100%;background:linear-gradient(90deg,${PAL.green44},${PAL.yellow56} 80%,${PAL.red62});}
        .iso-cards{display:flex;gap:10px;flex-wrap:wrap;}
        .iso-card{width:152px;background:${PAL.blue10};border:1px solid ${PAL.blue23s39};border-radius:8px;padding:8px;
            display:flex;flex-direction:column;gap:6px;}
        .iso-screen{height:76px;border-radius:4px;display:flex;align-items:center;justify-content:center;
            color:${PAL.sky45};font-size:12px;position:relative;
            background:repeating-linear-gradient(45deg,${PAL.blue05} 0 10px,${PAL.blue07} 10px 20px);}
        .iso-screen .rec-dot{position:absolute;top:6px;left:6px;width:10px;height:10px;border-radius:50%;background:${PAL.blue31s27};}
        .iso-card.rec .iso-screen .rec-dot{background:${PAL.red60};animation:recPulse 1s steps(1) infinite;}
        .iso-name{font-size:11px;font-weight:bold;text-align:center;}
        .iso-tc{font-family:monospace;font-size:13px;text-align:center;color:${PAL.green81s100};}
        .iso-card.rec .iso-tc{color:${PAL.red71s100};}
        .iso-recbtn{border:none;border-radius:4px;padding:6px;font-weight:900;letter-spacing:1px;
            font-size:11px;cursor:pointer;background:${PAL.red60};color:${PAL.white};}
        .iso-card.rec .iso-recbtn{background:${PAL.black};border:1px solid ${PAL.red60};color:${PAL.red60};}
        .iso-file{font-size:9px;color:${PAL.blue60s27};text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .rp-wrap{background:${PAL.blue10};border:1px solid ${PAL.blue23s39};border-radius:8px;padding:14px;}
        .rp-timeline{position:relative;height:42px;border-radius:6px;background:${PAL.blue09};overflow:hidden;margin-bottom:14px;}
        .rp-buffer{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,255,255,.05),rgba(0,255,255,.20));}
        .rp-poi{position:absolute;top:0;bottom:0;width:2px;background:${PAL.amber61};}
        .rp-play{position:absolute;top:0;bottom:0;width:2px;background:${PAL.red60};box-shadow:0 0 8px ${PAL.red60};}
        .rp-row{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;}
        .rp-jog{flex:1;min-width:220px;}
        .rp-jog input{width:100%;accent-color:var(--cyan,${PAL.cyan50});}
        .rp-tc{font-family:monospace;font-size:20px;color:var(--cyan,${PAL.cyan50});text-align:center;}
        .rp-btns,.rp-angles,.rp-speeds{display:flex;gap:6px;flex-wrap:wrap;}
        .rp-btn{padding:9px 14px;border-radius:5px;background:${PAL.blue20};border:1px solid ${PAL.blue32s31};color:${PAL.blue91};
            cursor:pointer;font-weight:900;letter-spacing:1px;font-size:12px;}
        .rp-btn.sel{background:var(--cyan,${PAL.cyan50});color:${PAL.black};border-color:${PAL.white};}
        .rp-btn.air{background:${PAL.red60};color:${PAL.white};border-color:${PAL.red80s100};}
        .rp-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
        .rp-clip{background:${PAL.blue16};border:1px solid ${PAL.blue26};border-radius:5px;padding:6px 10px;
            font-size:11px;font-family:monospace;color:${PAL.green81s100};}
    `,
  );
}
