// src/ui/scan/scan-styles — chrome for the SCAN panel (ROAD-3476).
import { PAL, alpha } from '../../domain/palette.js';

export const SCAN_CSS = `
/* Fallback seat if the launcher is not adopted into the seat MENU (dev/tests). */
.scan-launch{position:fixed;left:12px;bottom:124px;z-index:60;font:800 12px 'Courier New',monospace;letter-spacing:1px;
  padding:7px 12px;border-radius:14px;background:${PAL.blue19};color:${PAL.sky84};border:1px solid ${PAL.blue23s39};cursor:pointer;}
.scan-panel{position:fixed;right:16px;top:64px;z-index:2700;width:380px;max-width:calc(100vw - 32px);max-height:84vh;display:none;
  flex-direction:column;background:${PAL.blue09};border:1px solid ${PAL.blue23s39};border-radius:12px;color:${PAL.sky84};
  font:12px 'Courier New',monospace;overflow:hidden;box-shadow:0 14px 50px ${alpha(PAL.black, .7)};}
.scan-panel.open{display:flex;}
.scan-head{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${PAL.cyan52};color:${PAL.sky09s75};font-weight:900;letter-spacing:2px;}
.scan-head .scan-x{margin-left:auto;cursor:pointer;padding:0 6px;}
.scan-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:7px 12px;border-bottom:1px solid ${PAL.blue18s42};}
.scan-row label{color:${PAL.blue44s20};font-weight:900;letter-spacing:1px;}
.scan-panel button,.scan-panel select,.scan-panel input[type=text]{background:${PAL.blue19};color:${PAL.sky84};border:1px solid ${PAL.blue23s39};
  border-radius:8px;padding:5px 9px;font:800 11px 'Courier New',monospace;}
.scan-panel select{max-width:100%;flex:1;}
.scan-panel input[type=text]{flex:1;min-width:0;}
.scan-panel button.on{background:${PAL.cyan71};color:${PAL.black};}
.scan-panel button:disabled{opacity:.45;}
.scan-engine{color:${PAL.blue44s20};}
.scan-engine.none{color:${PAL.red71};}
.scan-card{color:${PAL.white};padding:6px 12px;border-bottom:1px solid ${PAL.blue18s42};min-height:1.2em;}
.scan-video{width:100%;max-height:220px;background:${PAL.black};display:none;}
.scan-video.live{display:block;}
.scan-photo{display:none;}
.scan-log{overflow-y:auto;padding:6px 8px;display:flex;flex-direction:column;gap:4px;min-height:60px;}
.scan-empty{color:${PAL.blue44s20};padding:12px;text-align:center;font-style:italic;}
.scan-evt{border-left:3px solid ${PAL.blue23s39};padding:4px 8px;background:${alpha(PAL.black, .25)};border-radius:0 6px 6px 0;word-break:break-word;}
.scan-evt.ok{border-left-color:${PAL.green67};}
.scan-evt.warn{border-left-color:${PAL.amber69};}
.scan-evt.bad{border-left-color:${PAL.red71};}
.scan-evt .scan-t{color:${PAL.blue44s20};font-size:10px;margin-right:6px;}
.scan-evt .scan-code{color:${PAL.white};font-weight:900;}
@keyframes scan-flash{0%,100%{outline-color:transparent;}50%{outline-color:${PAL.amber69};}}
.scan-flash{outline:3px solid ${PAL.amber69};outline-offset:2px;animation:scan-flash .6s 4;}
`;
