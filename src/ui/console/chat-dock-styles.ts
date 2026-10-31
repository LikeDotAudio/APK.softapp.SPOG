// src/ui/console/chat-dock-styles — CSS for the global PRODUCTION CHAT dock.

import { PAL } from '../../domain/palette.js';

export const CSS = `
.chat-launch{position:fixed;right:14px;bottom:76px;z-index:1000;background:${PAL.green53};color:${PAL.green07};border:none;border-radius:18px 6px 6px 18px;font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:8px 18px 8px 16px;cursor:pointer;box-shadow:inset 5px 0 0 ${PAL.green34};display:flex;align-items:center;gap:8px;}
.chat-launch:hover{filter:brightness(1.1);}
.chat-launch .cd-badge{display:none;min-width:16px;height:16px;line-height:16px;text-align:center;border-radius:8px;background:${PAL.red62};color:${PAL.white};font-size:10px;padding:0 4px;}
.chat-launch.unread .cd-badge{display:inline-block;}

.chat-panel{position:fixed;right:14px;bottom:120px;z-index:2400;width:min(420px,92vw);height:min(560px,70vh);display:none;flex-direction:column;background:${PAL.blue05s29};border:1px solid ${PAL.sky18};border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.6);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:${PAL.sky89};}
.chat-panel.open{display:flex;}
.cd-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:${PAL.green08};border-bottom:1px solid ${PAL.green34};}
.cd-head b{font-weight:900;letter-spacing:2px;font-size:12px;color:${PAL.green53};text-transform:uppercase;}
.cd-x{margin-left:auto;background:none;border:none;color:${PAL.sky63};font-size:18px;line-height:1;cursor:pointer;padding:0 4px;}
.cd-x:hover{color:${PAL.white};}

.cd-route{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${PAL.blue05s33};border-bottom:1px solid ${PAL.sky15s30};flex-wrap:wrap;}
.cd-route .arw{color:${PAL.green53};font-weight:900;}
.cd-route select{flex:1;min-width:120px;background:${PAL.blue03s60};color:${PAL.sky91};border:1px solid ${PAL.blue19};border-radius:8px;padding:6px 8px;font:inherit;font-size:12px;}

.cd-log{flex:1;min-height:0;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;}
.cd-empty{margin:auto;color:${PAL.sky35};font-size:12px;text-align:center;}
.cd-row{max-width:82%;display:flex;flex-direction:column;gap:3px;}
.cd-row.out{align-self:flex-end;align-items:flex-end;}
.cd-row.in{align-self:flex-start;align-items:flex-start;}
.cd-meta{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${PAL.sky49};}
.cd-bub{padding:8px 11px;border-radius:12px;font-size:13px;line-height:1.4;word-break:break-word;background:${PAL.sky12};border:1px solid ${PAL.sky18s38};}
.cd-row.out .cd-bub{background:${PAL.green11};border-color:${PAL.green34};}
.cd-bub a{color:${PAL.sky75s100};}
.cd-bub img{max-width:100%;border-radius:8px;display:block;cursor:zoom-in;margin-top:2px;}
.cd-linkchip{display:inline-flex;align-items:center;gap:6px;color:${PAL.sky75s100};text-decoration:none;}
.cd-linkchip:hover{text-decoration:underline;}

.cd-compose{display:flex;align-items:center;gap:6px;padding:9px 10px;border-top:1px solid ${PAL.sky15s30};background:${PAL.blue05s33};}
.cd-compose textarea{flex:1;resize:none;height:38px;max-height:96px;background:${PAL.blue03s60};color:${PAL.sky91};border:1px solid ${PAL.blue19};border-radius:8px;padding:8px 10px;font:inherit;font-size:13px;}
.cd-tool{background:${PAL.sky12};border:1px solid ${PAL.sky18s38};color:${PAL.sky81s100};border-radius:8px;width:34px;height:34px;font-size:15px;cursor:pointer;flex:none;}
.cd-tool:hover{background:${PAL.sky16};}
.cd-send{background:${PAL.green53};border:none;color:${PAL.green07};border-radius:8px;width:38px;height:34px;font-size:16px;font-weight:900;cursor:pointer;flex:none;}
.cd-send:hover{filter:brightness(1.1);}`;
