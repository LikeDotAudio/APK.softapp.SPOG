// src/ui/merge/observer-styles — LCARS-flavoured chrome for the merge observer.
import { PAL, alpha } from '../../domain/palette.js';
import { STATE_VAR } from '../../domain/state.js';

export const MERGE_CSS = `
/* Fallback style if the launcher is NOT adopted into the seat MENU (dev/tests). In
   the app initUserMenu moves it into the menu, where .um-panel .mrg-launch restyles it. */
.mrg-launch{position:fixed;left:12px;bottom:88px;z-index:60;font:800 12px 'Courier New',monospace;letter-spacing:1px;
  padding:7px 12px;border-radius:14px;background:${PAL.violet17s39};color:${PAL.violet80s44};border:1px solid ${PAL.violet34};cursor:pointer;}
.mrg-launch:hover{background:${PAL.violet23};}
/* The panel opens centred near the top — clear of the CHAT/VOICE docks + sources rail. */
.mrg-panel{position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:2700;width:360px;max-height:78vh;display:none;flex-direction:column;
  background:${PAL.indigo05};border:1px solid ${PAL.violet34};border-radius:12px;color:${PAL.violet89};font:13px 'Courier New',monospace;overflow:hidden;box-shadow:0 14px 50px ${alpha(PAL.black, .7)};}
.mrg-panel.open{display:flex;}
.mrg-head{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${PAL.violet17s39};font-weight:800;letter-spacing:1px;}
.mrg-head .mrg-x{margin-left:auto;cursor:pointer;padding:0 6px;color:${PAL.violet80s44};}
.mrg-cfg{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:8px 12px;border-bottom:1px solid ${PAL.violet17s39};color:${PAL.violet70};font-size:12px;}
.mrg-cfg label{display:flex;align-items:center;gap:6px;cursor:pointer;}
.mrg-cfg input[type=range]{width:90px;}
.mrg-seat{margin-left:auto;color:${PAL.green72s57};}
.mrg-feed{overflow-y:auto;padding:6px 8px;display:flex;flex-direction:column;gap:5px;}
.mrg-empty{color:${PAL.violet42};padding:16px 8px;text-align:center;font-style:italic;}
.mrg-evt{border-left:3px solid ${PAL.violet22};padding:5px 8px;background:${PAL.indigo09};border-radius:0 6px 6px 0;}
.mrg-evt.contest{border-left-color:${PAL.red71};background:${PAL.pink11};}
.mrg-evt.concord{border-left-color:${PAL.amber50};background:${PAL.amber10};}
.mrg-evt .mrg-l1{display:flex;gap:8px;align-items:baseline;}
.mrg-evt .mrg-tag{font-weight:800;font-size:10px;letter-spacing:1px;}
.mrg-evt.contest .mrg-tag{color:${PAL.red77};}
.mrg-evt.concord .mrg-tag{color:${PAL.amber69};}
.mrg-evt.compose .mrg-tag{color:${PAL.green67};}
.mrg-evt .mrg-key{color:${PAL.violet78s38};}
.mrg-evt .mrg-res{margin-left:auto;color:${PAL.white};font-weight:800;}
.mrg-evt .mrg-time{color:${PAL.violet42};font-size:10px;}
.mrg-prop{display:flex;gap:6px;font-size:11px;color:${PAL.violet60};padding-left:4px;}
.mrg-prop.win{color:${PAL.white};}
.mrg-prop .mrg-w{color:${PAL.green72s57};font-weight:800;}
.mrg-arena{border-top:1px solid ${PAL.violet17s39};padding:10px 12px;background:${PAL.indigo06};}
.mrg-arena h5{margin:0 0 8px;color:${PAL.violet80s44};font-size:11px;letter-spacing:1px;}
.mrg-arena .mrg-row{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:12px;color:${PAL.violet70};}
.mrg-arena input[type=range]{flex:1;}
.mrg-arena .mrg-val{width:34px;text-align:right;color:${PAL.white};font-weight:800;}
.mrg-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:90;
  background:${PAL.pink11};border:1px solid ${PAL.red71};color:${PAL.red92};font:800 13px 'Courier New',monospace;letter-spacing:1px;
  padding:10px 18px;border-radius:10px;box-shadow:0 6px 30px ${alpha(STATE_VAR.dead, .35)};opacity:0;transition:opacity .2s, transform .2s;pointer-events:none;}
.mrg-toast.show{opacity:1;transform:translateX(-50%) translateY(6px);}
.mrg-toast.concord{background:${PAL.amber10};border-color:${PAL.amber50};color:${PAL.amber86};}
`;
