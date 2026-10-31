// src/ui/console/router-view-styles — the Minesweeper / Win95 skin for the
// 1990s router-view crosspoint grid. Split out of router-view.ts (200-line rule);
// re-injected by router-view.ts via addStyles('router-view-styles', RV_CSS).
import { PAL } from '../../domain/palette.js';

export const RV_CSS = `
.rv-btn{position:fixed;right:14px;bottom:76px;z-index:1000;background:${PAL.cyan52};color:${PAL.cyan06};border:none;border-radius:18px 6px 6px 18px;font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:8px 18px 8px 16px;cursor:pointer;box-shadow:inset 5px 0 0 ${PAL.cyan37s55};}
.rv-btn:hover{filter:brightness(1.1);}
.rv-overlay{position:fixed;inset:0;z-index:2500;display:none;flex-direction:column;background:${PAL.cyan25};color:${PAL.black};font-family:'MS Sans Serif',Tahoma,Geneva,sans-serif;font-size:12px;}
.rv-overlay.open{display:flex;}
.rv-win{margin:18px;display:flex;flex-direction:column;flex:1;min-height:0;background:${PAL.grey75s0};border:3px solid;border-color:${PAL.white} ${PAL.grey50} ${PAL.grey50} ${PAL.white};}
.rv-titlebar{background:linear-gradient(90deg,${PAL.blue25s100},${PAL.sky44s86});color:${PAL.white};font-weight:bold;letter-spacing:1px;padding:5px 8px;display:flex;align-items:center;gap:12px;}
.rv-titlebar .rv-x{margin-left:auto;background:${PAL.grey75s0};color:${PAL.black};border:2px solid;border-color:${PAL.white} ${PAL.grey50} ${PAL.grey50} ${PAL.white};width:22px;height:20px;line-height:14px;text-align:center;font-weight:bold;cursor:pointer;}
.rv-x:active{border-color:${PAL.grey50} ${PAL.white} ${PAL.white} ${PAL.grey50};}
.rv-bar{display:flex;align-items:center;gap:10px;padding:8px;flex-wrap:wrap;border-bottom:2px solid ${PAL.grey50};}
.rv-bar input{font-family:inherit;font-size:12px;padding:3px 6px;min-width:140px;border:2px solid;border-color:${PAL.grey50} ${PAL.white} ${PAL.white} ${PAL.grey50};background:${PAL.white};}
.rv-tg{font-family:inherit;font-weight:bold;font-size:11px;padding:5px 10px;cursor:pointer;background:${PAL.grey75s0};border:2px solid;border-color:${PAL.white} ${PAL.grey50} ${PAL.grey50} ${PAL.white};white-space:nowrap;}
.rv-tg.on{border-color:${PAL.grey50} ${PAL.white} ${PAL.white} ${PAL.grey50};background:${PAL.grey60};}
.rv-count{font-size:11px;color:${PAL.blue25s100};font-weight:bold;}
.rv-help{margin-left:auto;font-size:11px;color:${PAL.grey25s0};}
.rv-body{flex:1;overflow:auto;padding:10px;background:${PAL.grey75s0};}
.rv-msg{padding:40px;text-align:center;color:${PAL.grey25s0};}
table.rv-grid{border-collapse:separate;border-spacing:0;}
.rv-grid th,.rv-grid td{padding:0;text-align:center;white-space:nowrap;}
.rv-chead,.rv-rhead,.rv-twisthead,.rv-feedhead,.rv-corner{background:${PAL.grey75s0};border:2px solid;border-color:${PAL.white} ${PAL.grey50} ${PAL.grey50} ${PAL.white};font-weight:bold;padding:3px 8px;}
.rv-chead{cursor:pointer;color:${PAL.blue25s100};letter-spacing:1px;text-align:center;}
.rv-chead.lv0{background:${PAL.blue25s100};color:${PAL.white};border-color:${PAL.sky44s86} ${PAL.blue13s100} ${PAL.blue13s100} ${PAL.sky44s86};}
.rv-chead.lv1{background:${PAL.blue87s30};}
.rv-chead.grp,.rv-rhead.grp,.rv-twisthead.grp,.rv-feedhead.grp{font-style:italic;color:${PAL.blue25s100};}
.rv-chead:active,.rv-rhead:active{border-color:${PAL.grey50} ${PAL.white} ${PAL.white} ${PAL.grey50};}
.rv-rhead{cursor:pointer;color:${PAL.blue25s100};letter-spacing:.5px;text-align:left;}
.rv-rhead.lv0{background:${PAL.blue25s100};color:${PAL.white};border-color:${PAL.sky44s86} ${PAL.blue13s100} ${PAL.blue13s100} ${PAL.sky44s86};}
.rv-rhead.lv1{background:${PAL.blue87s30};}
.rv-twisthead{font-weight:normal;color:${PAL.black};writing-mode:vertical-rl;transform:rotate(180deg);vertical-align:bottom;height:120px;padding:8px 3px;}
.rv-feedhead{text-align:left;font-weight:normal;}
.rv-grid thead th{position:sticky;top:0;z-index:3;}
.rv-corner{position:sticky;left:0;top:0;z-index:4;}
.rv-cell{width:24px;height:22px;background:${PAL.grey75s0};border:2px solid;border-color:${PAL.white} ${PAL.grey50} ${PAL.grey50} ${PAL.white};cursor:pointer;font-weight:bold;color:${PAL.blue25s100};}
.rv-cell.grp{cursor:crosshair;}
.rv-cell.grp:hover{background:${PAL.sky77s47};}
.rv-cell.on{border-color:${PAL.grey50} ${PAL.white} ${PAL.white} ${PAL.grey50};background:${PAL.grey74};color:${PAL.red38};}
.rv-cell.on::after{content:'\\2737';}
.rv-cell.grp.on::after{content:'\\25A0';color:${PAL.blue25s100};}
.rv-cell.bad{background:${PAL.red75};}
.rv-hl{background:${PAL.yellow75} !important;}
.rv-cell.on.rv-hl{background:${PAL.red91} !important;}`;
