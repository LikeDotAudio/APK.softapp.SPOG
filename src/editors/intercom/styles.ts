// src/editors/intercom/styles — verbatim port of the legacy intercom CSS block
// (js/editors/intercom.js addStyles('twist-editor-intercom', ...)). Injected once.

import { addStyles } from '../../ui/dom.js';
import { PAL, alpha } from '../../domain/palette.js';

export function injectIntercomStyles(): void {
  addStyles(
    'twist-editor-intercom',
    `
        /* ===== Intercom ===== */
        .ic-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:18px;}
        .ic-key{background:${PAL.blue12s47};border:1px solid ${PAL.blue23s34};border-radius:7px;
            padding:10px;display:flex;flex-direction:column;gap:8px;align-items:stretch;}
        .ic-key .ic-name{font-weight:900;letter-spacing:1px;text-align:center;font-size:13px;color:${PAL.blue91};
            background:${PAL.blue18};border-radius:4px;padding:8px 4px;cursor:pointer;transition:all .1s;}
        .ic-key.talk .ic-name{background:${PAL.orange50s100};color:${PAL.black};box-shadow:0 0 12px ${alpha(PAL.orange50s100, .6)};}
        .ic-key.listen .ic-name{box-shadow:inset 0 0 0 2px ${PAL.green53s71};color:${PAL.green81s100};}
        .ic-key.live .ic-name{outline:2px solid ${PAL.red60};}
        .ic-tl{display:flex;gap:6px;}
        .ic-tl button{flex:1;font-size:9px;font-weight:900;letter-spacing:1px;border:none;border-radius:3px;
            padding:4px;cursor:pointer;background:${PAL.blue23};color:${PAL.blue91};}
        .ic-tl button.talk.on{background:${PAL.orange50s100};color:${PAL.black};}
        .ic-tl button.listen.on{background:${PAL.green37s71};color:${PAL.white};}
        .ic-vol{width:100%;accent-color:var(--cyan,${PAL.cyan50});}
        .ic-sub{display:flex;gap:16px;flex-wrap:wrap;}
        .ic-card{background:${PAL.blue10};border:1px solid ${PAL.blue23s39};border-radius:8px;padding:12px 16px;min-width:200px;}
        .ic-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 0;font-size:12px;}
        .ic-pill{font-size:10px;font-weight:900;letter-spacing:1px;padding:3px 9px;border-radius:10px;
            background:${PAL.blue18};color:${PAL.sky71};cursor:pointer;}
        .ic-pill.on{background:${PAL.green53s71};color:${PAL.black};}

        /* ===== Intercom — TALK GROUPS ===== */
        .ic-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
        .ic-tool-btn{padding:11px 22px;border-radius:18px;background:var(--ed-color,${PAL.orange69});color:${PAL.black};
            font-weight:900;letter-spacing:1px;font-size:12px;cursor:pointer;border:none;}
        .ic-tool-btn.ghost{background:${PAL.blue23};color:${PAL.blue91};}
        .ic-hint{font-size:11px;letter-spacing:1px;color:var(--cyan,${PAL.cyan50});font-weight:bold;}
        .ic-groups{display:flex;flex-direction:column;gap:10px;margin-bottom:18px;}
        .ic-group{display:flex;align-items:stretch;gap:12px;background:${PAL.blue10};border:1px solid ${PAL.blue23s39};
            border-radius:14px;padding:10px;}
        .ic-group-talk{flex:0 0 auto;min-width:170px;border:none;border-radius:12px;cursor:pointer;
            background:linear-gradient(${PAL.blue24},${PAL.blue18s42});font-weight:900;letter-spacing:2px;font-size:18px;color:${PAL.blue91};
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:16px 26px;
            transition:all .1s;}
        .ic-group-talk small{font-size:9px;opacity:.7;font-weight:bold;letter-spacing:1px;}
        .ic-group-talk:hover{filter:brightness(1.12);}
        .ic-group.on .ic-group-talk{background:${PAL.orange50s100};color:${PAL.black};box-shadow:0 0 20px ${alpha(PAL.orange50s100, .75)};}
        .ic-group-members{flex:1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
        .ic-chip{font-size:11px;font-weight:bold;letter-spacing:.5px;background:${PAL.blue18};color:${PAL.blue91};
            padding:6px 11px;border-radius:10px;}
        .ic-group-x{flex:0 0 auto;align-self:center;cursor:pointer;color:${PAL.blue60s27};font-weight:900;font-size:20px;padding:0 10px;}
        .ic-group-x:hover{color:${PAL.red70};}
        .ic-grid.selecting .ic-key{cursor:pointer;}
        .ic-key.picked{outline:3px solid var(--cyan,${PAL.cyan50});outline-offset:1px;}
    `,
  );
}
