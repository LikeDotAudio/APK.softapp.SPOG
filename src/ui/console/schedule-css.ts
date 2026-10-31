import { PAL } from '../../domain/palette.js';

export const SCHED_CSS = `
.sc-ov{position:fixed;inset:0;z-index:3100;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,rgba(13,23,48,.92),rgba(3,6,15,.96));font-family:Arial,Helvetica,sans-serif;}
.sc-ov.open{display:flex;}
.sc-box{width:min(960px,94vw);max-height:90vh;overflow:auto;background:${PAL.blue09s58};border:1px solid ${PAL.blue19};border-radius:16px;padding:26px;}
.sc-box h2{margin:0 0 2px;color:${PAL.white};font-size:22px;letter-spacing:2px;display:flex;justify-content:space-between;align-items:center;}
.sc-box h2 button{font-size:12px;padding:4px 8px;background:${PAL.blue19};color:${PAL.white};border:none;border-radius:4px;cursor:pointer;}
.sc-box p{margin:0 0 20px;color:${PAL.blue60s27};font-size:12px;letter-spacing:1px;}
.sc-slot{display:grid;grid-template-columns:120px 1fr;gap:14px;border-radius:12px;border:1px solid ${PAL.blue27s36};background:${PAL.blue12_0c1730};padding:14px;margin-bottom:12px;position:relative;}
.sc-slot.live{border-color:${PAL.red62};box-shadow:0 0 16px rgba(255,59,59,.35);}
.sc-time{font:bold 15px 'Courier New',monospace;color:${PAL.sky69};letter-spacing:1px;}
.sc-time .badge{display:inline-block;margin-top:8px;font:900 9px sans-serif;letter-spacing:1px;border-radius:5px;padding:3px 7px;background:${PAL.blue19};color:${PAL.sky71};}
.sc-slot.live .sc-time .badge{background:${PAL.red62};color:${PAL.white};}
.sc-slot.reh{border-color:${PAL.orange62};box-shadow:0 0 16px rgba(242,183,75,.25);}
.sc-slot.reh .sc-time .badge{background:${PAL.orange62};color:${PAL.black};}
.sc-slot.tear{border-color:${PAL.violet57};box-shadow:0 0 16px rgba(160,110,180,.25);}
.sc-slot.tear .sc-time .badge{background:${PAL.violet57};color:${PAL.white};}
.sc-show b{display:block;color:${PAL.white};font-size:17px;letter-spacing:1px;}
.sc-room{color:${PAL.sky81s100};font-size:12px;letter-spacing:1px;margin:3px 0 10px;}
.sc-crew{display:flex;flex-wrap:wrap;gap:6px;}
.sc-resources{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.sc-role{font:bold 10px sans-serif;letter-spacing:.5px;border-radius:6px;padding:5px 9px;background:${PAL.blue15};color:${PAL.sky91};border:1px solid ${PAL.blue27s36};}
.sc-resource{font:bold 10px sans-serif;letter-spacing:.5px;border-radius:6px;padding:5px 9px;background:${PAL.violet11s48};color:${PAL.violet80s44};border:1px solid ${PAL.violet30};}
.sc-legend{display:flex;gap:16px;margin:-8px 0 16px;font:bold 11px sans-serif;letter-spacing:1px;}
.sc-hint{color:${PAL.blue53};font-size:11px;letter-spacing:1px;margin-top:6px;}
.sc-edit-btn{position:absolute;top:14px;right:14px;background:${PAL.blue19};color:${PAL.white};border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;}
.sc-edit-btn:hover{background:${PAL.blue27s36};}
.sc-locked-msg{position:absolute;top:14px;right:14px;color:${PAL.red71};font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:4px;}
.sc-editor{display:flex;flex-direction:column;gap:8px;width:100%;}
.sc-editor input{background:${PAL.blue12s57};border:1px solid ${PAL.blue27s36};color:${PAL.white};padding:6px;border-radius:4px;}
.sc-editor label{font-size:11px;color:${PAL.blue60s27};display:flex;flex-direction:column;gap:4px;}
.sc-editor-actions{display:flex;gap:8px;margin-top:8px;}
.sc-editor-actions button{padding:6px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;}
.sc-editor-actions button.save{background:${PAL.amber55s73};color:${PAL.black};}
.sc-editor-actions button.cancel{background:${PAL.blue19};color:${PAL.white};}
.sc-new-btn{width:100%;padding:12px;background:${PAL.blue15};color:${PAL.sky91};border:1px dashed ${PAL.blue27s36};border-radius:8px;cursor:pointer;margin-bottom:12px;font-weight:bold;}
.sc-new-btn:hover{background:${PAL.blue19};}
`;
