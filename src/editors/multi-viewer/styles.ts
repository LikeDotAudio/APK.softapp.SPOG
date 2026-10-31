// src/editors/multi-viewer/styles — verbatim port of the legacy
// addStyles('twist-editor-multi-viewer', …) CSS block so visuals match 1:1.

import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

export function injectMultiViewerStyles(): void {
  addStyles(
    'twist-editor-multi-viewer',
    `
        /* ===== Multi viewer ===== */
        /* LCARS elbow frame around the whole wall: left spine + top rail. */
        .mv-frame{position:relative;padding:62px 4px 18px 80px;margin-top:4px;}
        .mv-frame::before{content:'';position:absolute;top:0;left:0;width:150px;height:100%;
            border-left:64px solid var(--ed-color,${PAL.violet57});border-top:26px solid var(--ed-color,${PAL.violet57});
            border-top-left-radius:46px;border-bottom-left-radius:46px;box-sizing:border-box;z-index:0;}
        .mv-frame::after{content:'';position:absolute;top:0;left:160px;right:0;height:26px;
            background:var(--ed-color,${PAL.violet57});border-radius:0 12px 12px 0;z-index:0;}
        .mv-frame > *{position:relative;z-index:1;}
        .mv-frame-label{position:absolute;left:8px;top:34px;width:60px;text-align:center;z-index:1;
            font-size:10px;font-weight:900;letter-spacing:1px;color:${PAL.black};line-height:1.2;}
        .mv-presets{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
        .mv-pbtn{padding:9px 16px;border-radius:16px;background:${PAL.blue16};border:1px solid ${PAL.blue26};
            color:${PAL.blue91};cursor:pointer;font-weight:bold;letter-spacing:1px;font-size:12px;}
        .mv-pbtn.sel{background:var(--cyan,${PAL.cyan50});color:${PAL.black};border-color:${PAL.white};}
        /* The WALL is a 1:1 canvas — equal explicit rows/cols keep every pane
           1:1 too (a cols×cols wall of squares on a square raster). */
        .mv-grid{display:grid;gap:10px;aspect-ratio:1/1;width:min(100%,calc(100vh - 260px));}
        .mv-grid.compact{gap:4px;}
        .mv-win{background:${PAL.blue04s50};border:3px solid ${PAL.blue24};border-radius:6px;min-height:0;min-width:0;
            display:flex;flex-direction:column;overflow:hidden;cursor:grab;position:relative;}
        .mv-grid.compact .mv-win{border-width:2px;border-radius:4px;}
        .mv-tile{display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;
            letter-spacing:.5px;color:${PAL.blue60s27};text-align:center;padding:2px;height:100%;
            background:repeating-linear-gradient(45deg,${PAL.blue05} 0 8px,${PAL.blue07} 8px 16px);}
        .mv-win.empty{border-color:${PAL.blue16s35};opacity:.5;cursor:default;}
        .mv-win.pgm{border-color:${PAL.red60};box-shadow:0 0 0 1px ${PAL.red60}, 0 0 16px rgba(255,51,68,.5);}
        .mv-win.pvw{border-color:${PAL.green53s71};box-shadow:0 0 0 1px ${PAL.green53s71}, 0 0 16px rgba(51,221,102,.45);}
        .mv-win.dragging{opacity:.4;}
        /* Auto-multiviewer tile: on air via the switcher, read-only (dashed = not hand-routed). */
        .mv-win.mv-auto{cursor:default;border-style:dashed;}
        .mv-pbtn.mv-overflow{outline:2px dashed var(--state-onair,${PAL.amber50s100});outline-offset:-2px;}
        .mv-screen{flex:1;display:flex;align-items:center;justify-content:center;color:${PAL.sky45};
            font-size:13px;letter-spacing:1px;background:repeating-linear-gradient(45deg,${PAL.blue05} 0 10px,${PAL.blue07} 10px 20px);}
        .mv-meter{position:absolute;right:5px;top:8px;bottom:26px;width:7px;border-radius:3px;
            background:${PAL.blue09};overflow:hidden;display:flex;flex-direction:column-reverse;}
        .mv-meter > i{display:block;background:linear-gradient(${PAL.green44},${PAL.yellow56} 70%,${PAL.red62});width:100%;height:0%;}
        /* Audio-group pane: the screen is a BANK of n channel VU meters. */
        .mv-vubank{flex:1;display:flex;gap:4px;align-items:stretch;padding:22px 8px 6px;
            background:repeating-linear-gradient(45deg,${PAL.blue05} 0 10px,${PAL.blue07} 10px 20px);}
        .mv-vu{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;align-items:stretch;}
        .mv-vu .bar{flex:1;position:relative;background:${PAL.blue09};border-radius:2px;overflow:hidden;
            display:flex;flex-direction:column-reverse;box-shadow:inset 0 0 3px ${PAL.black};}
        .mv-vu .bar > i{display:block;width:100%;height:0%;
            background:linear-gradient(${PAL.red62},${PAL.yellow56} 30%,${PAL.green44} 55%);}
        .mv-vu > span{font-size:7px;text-align:center;color:${PAL.blue60s27};letter-spacing:.5px;}
        /* UMD — a proper Under-Monitor Display: dark strip, high-contrast
           program name, the source colour rides as a thin accent bar above. */
        .mv-umd{flex:0 0 auto;display:flex;align-items:center;justify-content:center;height:24px;
            font-weight:bold;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;
            color:${PAL.blue98};background:${PAL.blue03s53};border-top:3px solid var(--umd,${PAL.sky71});
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px;}
        .mv-umd[contenteditable]:focus{outline:2px solid var(--cyan);}
        .mv-tally{position:absolute;top:6px;left:6px;font-size:9px;font-weight:900;letter-spacing:1px;
            padding:1px 6px;border-radius:3px;background:${PAL.blue28s30};color:${PAL.blue91};}
        .mv-win.pgm .mv-tally{background:${PAL.red60};color:${PAL.white};}
        .mv-win.pvw .mv-tally{background:${PAL.green53s71};color:${PAL.black};}
    `,
  );
}
