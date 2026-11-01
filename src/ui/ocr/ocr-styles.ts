// src/ui/ocr/ocr-styles — chrome for the OCR importer (ROAD-3475), in the SCAN
// panel's palette.
import { PAL, alpha } from '../../domain/palette.js';

export const OCR_CSS = `
.ocr-panel{position:fixed;right:16px;top:64px;z-index:2700;width:620px;max-width:calc(100vw - 32px);max-height:88vh;display:none;
  flex-direction:column;background:${PAL.blue09};border:1px solid ${PAL.blue23s39};border-radius:12px;color:${PAL.sky84};
  font:12px 'Courier New',monospace;overflow-y:auto;box-shadow:0 14px 50px ${alpha(PAL.black, .7)};}
.ocr-panel.open{display:flex;}
.ocr-head{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${PAL.cyan52};color:${PAL.sky09s75};font-weight:900;letter-spacing:2px;position:sticky;top:0;z-index:2;}
.ocr-head .ocr-x{margin-left:auto;cursor:pointer;padding:0 6px;}
.ocr-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:7px 12px;border-bottom:1px solid ${PAL.blue18s42};}
.ocr-row label{color:${PAL.blue44s20};font-weight:900;letter-spacing:1px;}
.ocr-panel button,.ocr-panel select,.ocr-panel input[type=text]{background:${PAL.blue19};color:${PAL.sky84};border:1px solid ${PAL.blue23s39};
  border-radius:8px;padding:5px 9px;font:800 11px 'Courier New',monospace;}
.ocr-panel select{flex:1;max-width:100%;}
.ocr-panel button:disabled{opacity:.45;}
.ocr-file{display:none;}
.ocr-engine{color:${PAL.blue44s20};}
.ocr-strip{display:flex;gap:6px;overflow-x:auto;padding:7px 12px;border-bottom:1px solid ${PAL.blue18s42};}
.ocr-chip{white-space:nowrap;}
.ocr-chip.on{background:${PAL.cyan71} !important;color:${PAL.black} !important;}
.ocr-chip.failed{border-color:${PAL.red71} !important;}
.ocr-chip.reading{border-style:dashed !important;}
.ocr-view{border-bottom:1px solid ${PAL.blue18s42};}
.ocr-stage{position:relative;line-height:0;background:${PAL.black};outline:none;max-height:46vh;overflow:auto;}
.ocr-stage:focus{box-shadow:inset 0 0 0 2px ${PAL.cyan71};}
.ocr-img{width:100%;display:block;}
.ocr-svg{position:absolute;inset:0;width:100%;height:100%;}
.ocr-box{fill:${alpha(PAL.green67, .12)};stroke:${PAL.green67};stroke-width:2;vector-effect:non-scaling-stroke;cursor:pointer;}
.ocr-box.doubt{fill:${alpha(PAL.amber69, .14)};stroke:${PAL.amber69};}
.ocr-box.fixed{stroke-dasharray:5 3;}
.ocr-box.hit{fill:${alpha(PAL.cyan71, .3)};}
.ocr-box.sel{stroke:${PAL.white};stroke-width:3;fill:${alpha(PAL.white, .18)};}
.ocr-word-meta{color:${PAL.white};flex:1 1 100%;}
.ocr-edit{flex:1;min-width:0;}
.ocr-cands{display:flex;flex-direction:column;border-bottom:1px solid ${PAL.blue18s42};}
.ocr-cand{display:flex;gap:8px;align-items:center;padding:5px 12px;}
.ocr-cand.shape .ocr-val{color:${PAL.amber69};}
.ocr-kind{color:${PAL.blue44s20};font-weight:900;min-width:80px;}
.ocr-val{color:${PAL.white};font-weight:900;flex:1;word-break:break-all;}
.ocr-how{color:${PAL.blue44s20};font-size:10px;}
.ocr-to{color:${PAL.white};}
.ocr-empty{color:${PAL.blue44s20};padding:10px 12px;font-style:italic;}
.ocr-log{padding:6px 8px;display:flex;flex-direction:column;gap:4px;min-height:40px;}
.ocr-evt{border-left:3px solid ${PAL.blue23s39};padding:4px 8px;background:${alpha(PAL.black, .25)};border-radius:0 6px 6px 0;word-break:break-word;}
.ocr-evt.ok{border-left-color:${PAL.green67};}
.ocr-evt.warn{border-left-color:${PAL.amber69};}
.ocr-evt.bad{border-left-color:${PAL.red71};}
.ocr-evt .ocr-t{color:${PAL.blue44s20};font-size:10px;margin-right:6px;}
`;
