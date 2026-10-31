// src/ui/console/authoring-styles — the CSS for the single-pane AUTHORING layer.
// Affordances live in the DOM always, revealed only in authoring mode. Split out of
// authoring.ts to keep each module under the 200-line rule; ensureStyles() is the
// only export — authoring.ts calls it at boot and per-room decorate.

import { addStyles } from '../dom.js';
import { PAL, alpha } from '../../domain/palette.js';

const STYLE_ID = 'tr-authoring';

// ---- CSS: affordances live in the DOM always, revealed only in authoring mode ---
const CSS = `
.auth-only{display:none !important;}
body.authoring .auth-only{display:flex !important;}

/* Seated at the production frame's top OUTER corner — the side the elbow spine sits
   on. The frame is the positioning context; the dock is absolute so it rides that
   corner and mirrors to the opposite edge on a chirality flip, tracking the elbow
   (spine is RIGHT in left-handed mode, LEFT in right-handed mode). */
.dest-frame{position:relative;}
/* The dock IS a segment of the production rail's elbow corner — not a pill floating
   over it. It seats exactly on the title rail band (flush to the top → top:0; rail height 35px), butt-joins the bar through a 4px
   black notch on the joining side, and its outer top corner carries the rail's 30px
   cap radius (Corner Law: round the terminating end, square the joining edges). */
.auth-dock{position:absolute;top:0;right:26px;left:auto;height:35px;z-index:30;
  display:flex;align-items:stretch;gap:5px;flex-direction:row-reverse;padding:0;}
/* No destination loaded → no rail to seat on → the dock hides entirely. */
.dest-frame:not(:has(.program-row)) .auth-dock{display:none;}
.authoring-toggle{display:inline-flex;align-items:center;gap:8px;box-sizing:border-box;
  font:900 12px/1 Arial;letter-spacing:2px;text-transform:uppercase;color:${PAL.black};background:transparent;
  border:none;border-left:4px solid var(--bg-color,${PAL.blue05_060c16});
  padding:0 20px 0 14px;cursor:pointer;box-shadow:none;}
.authoring-toggle:hover{background:${alpha(PAL.black, .16)};}
.authoring-toggle .cnt{background:${PAL.blue04};color:${PAL.sky94s100};border-radius:8px;padding:2px 6px;font-size:10px;min-width:8px;text-align:center;}
/* Authoring ON: the segment inverts — black fill, green text — so state is
   unmistakable while still reading as part of the bar. */
body.authoring .authoring-toggle{background:${PAL.blue04};color:${PAL.green53};box-shadow:none;}
body.authoring .authoring-toggle .cnt{color:${PAL.green53};}
.auth-tools{display:flex;gap:5px;align-items:center;}
/* Right-handed console: the elbow spine (and this dock) sit on the LEFT edge; the
   frame keeps 20px padding there to clear the pulse strip, so the rail starts x=20. */
html[data-chirality="right"] .auth-dock{right:auto;left:20px;flex-direction:row;}
html[data-chirality="right"] .authoring-toggle{padding:0 14px 0 20px;
  border-left:none;border-right:4px solid var(--bg-color,${PAL.blue05_060c16});}
.auth-tools button{font:900 10px/1 Arial;letter-spacing:1px;text-transform:uppercase;color:${PAL.black};
  border:none;border-radius:4px;padding:8px 12px;cursor:pointer;background:${PAL.yellow53};}
.auth-tools .revert{background:${PAL.red52};color:${PAL.white};}

.auth-roombar{gap:6px;margin:6px 0 8px;flex-wrap:wrap;align-items:center;}
.auth-btn{font:900 10px/1 Arial;letter-spacing:1px;text-transform:uppercase;color:${PAL.black};background:${PAL.yellow53};
  border:none;border-radius:4px;padding:7px 11px;cursor:pointer;}
.auth-btn.add{background:${PAL.green53};}
.auth-dirty{font:900 9px/1 Arial;letter-spacing:1px;text-transform:uppercase;color:${PAL.green53};padding-left:4px;}

.twist-container .auth-handle{position:absolute;top:2px;right:2px;z-index:6;gap:3px;}
.twist-container .auth-handle .h{width:19px;height:19px;border-radius:4px;display:flex;align-items:center;
  justify-content:center;font:900 12px/1 Arial;color:${PAL.black};cursor:pointer;box-shadow:0 1px 3px ${alpha(PAL.black, .5)};}
.twist-container .auth-handle .edit{background:${PAL.yellow53};}
.twist-container .auth-handle .del{background:${PAL.red52};color:${PAL.white};}

.auth-modal-bg{position:fixed;inset:0;z-index:2600;background:${alpha(PAL.blue04, .72)};display:flex;
  align-items:center;justify-content:center;font-family:Arial;}
.auth-modal{background:${PAL.blue12_0c1730};border:2px solid ${PAL.purple62};border-radius:12px;min-width:320px;
  max-width:min(94vw,540px);max-height:88vh;overflow:auto;padding:16px 18px;color:${PAL.sky94s100};}
.auth-modal h3{margin:0 0 12px;color:${PAL.purple62};font-size:13px;letter-spacing:2px;text-transform:uppercase;}
.auth-field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;}
.auth-field label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${PAL.sky69s41};}
.auth-field input,.auth-field select,.auth-field textarea{background:${PAL.blue04};border:1px solid ${PAL.blue34s39};
  border-radius:5px;color:${PAL.sky94s100};padding:7px 9px;font:13px Arial;width:100%;box-sizing:border-box;}
.auth-hint{font-size:10px;color:${PAL.sky56};margin:-4px 0 10px;}
.auth-modal .rowbtn{display:flex;gap:8px;justify-content:flex-end;margin-top:6px;}
.auth-modal .rowbtn button{font:900 11px/1 Arial;letter-spacing:1px;text-transform:uppercase;border:none;
  border-radius:5px;padding:9px 16px;cursor:pointer;}
.auth-modal .ok{background:${PAL.green53};color:${PAL.black};}
.auth-modal .cancel{background:${PAL.blue34s39};color:${PAL.sky94s100};}
.auth-palette{display:flex;flex-wrap:wrap;gap:6px;}
.auth-palette .tool{background:${PAL.blue20s48};border:1px solid ${PAL.blue34s39};border-radius:6px;padding:9px 11px;
  cursor:pointer;font-size:12px;color:${PAL.sky91};}
.auth-palette .tool:hover{background:${PAL.blue31s44};border-color:${PAL.purple62};}

/* scale + pan the room canvas (Ctrl/⌘+wheel to zoom, drag empty space to pan). */
.auth-zoom{display:flex;align-items:center;gap:3px;margin-left:auto;}
.auth-zoom button{font:900 12px/1 Arial;color:${PAL.black};background:${PAL.sky69s41};border:none;border-radius:4px;
  width:26px;height:26px;cursor:pointer;}
.auth-zoom .pct{font:900 10px/1 Arial;color:${PAL.sky69s41};min-width:38px;text-align:center;}
body.authoring .program-body{will-change:transform;transform-origin:0 0;}
body.authoring .program-row{cursor:default;}
body.authoring .program-row.panning{cursor:grabbing;}

/* drag-to-move a container (audit §4D). Reveal a grab cursor + drop targets. */
body.authoring .twist-container{cursor:grab;}
body.authoring .twist-container.twist-dragging{opacity:.35;cursor:grabbing;}
body.authoring .twist-container.twist-drop-before{box-shadow:-4px 0 0 0 ${PAL.purple62}, 0 0 10px ${alpha(PAL.purple62, .6)} !important;}
body.authoring .twist-container.twist-drop-after{box-shadow:4px 0 0 0 ${PAL.purple62}, 0 0 10px ${alpha(PAL.purple62, .6)} !important;}
`;

export function ensureStyles(): void { addStyles(STYLE_ID, CSS); }
