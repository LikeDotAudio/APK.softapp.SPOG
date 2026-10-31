// src/ui/console/mqtt-tree-styles — the CSS for the MQTT chip + retained-tree panel.
//
// Extracted verbatim from mqtt-tree.ts (audit §5.5 split). The chip is pinned
// bottom-RIGHT and sits to the LEFT of the .ptp-clock read-out (both share
// bottom:42px). The clock publishes its live width as --ptp-clock-w (clock.ts) so
// the chip clears the clock as its format cycles (variable width). lcars-pulse.ts
// nudges both `right` offsets inward past the 20px edge pulse.
import { PAL } from '../../domain/palette.js';

export const MQ_CSS = `
.mq-chip{position:fixed;right:calc(28px + var(--ptp-clock-w,180px));bottom:42px;z-index:1600;display:inline-flex;align-items:center;gap:7px;
    background:${PAL.blue12_0c1730};border:1px solid ${PAL.blue27s36};border-radius:6px 14px 14px 6px;color:${PAL.sky84};
    font:bold 10px sans-serif;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;cursor:pointer;
    box-shadow:0 3px 12px rgba(0,0,0,.5);}
.mq-chip:hover{border-color:${PAL.blue51};color:${PAL.white};}
.mq-chip.seat-synced{box-shadow:0 0 10px rgba(57,211,83,.35);border-color:${PAL.green29};}
.mq-dot{width:9px;height:9px;border-radius:50%;background:${PAL.blue53};box-shadow:0 0 6px currentColor;color:${PAL.blue53};}
.mq-dot.on{background:${PAL.amber50};color:${PAL.amber50};} .mq-dot.live{background:${PAL.green53};color:${PAL.green53};} .mq-dot.err{background:${PAL.red57};color:${PAL.red57};}
.mqt{position:fixed;right:14px;bottom:114px;z-index:1601;display:none;flex-direction:column;
    width:min(820px,94vw);height:min(70vh,720px);background:${PAL.orange03};color:${PAL.amber71s100};
    border:1px solid ${PAL.amber15};border-radius:10px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.7);
    font:13px/1.4 'Courier New',monospace;}
.mqt.open{display:flex;}
.mqt-head{display:flex;align-items:center;gap:12px;padding:9px 14px;background:${PAL.yellow53};color:${PAL.orange06};
    font-weight:900;letter-spacing:2px;flex:0 0 auto;}
.mqt-head button{font:bold 11px sans-serif;letter-spacing:1px;text-transform:uppercase;border:none;
    border-radius:5px;padding:5px 10px;cursor:pointer;background:${PAL.orange06};color:${PAL.amber71s100};}
.mqt-head button:hover{filter:brightness(1.3);}
.mqt-head .sp{flex:1;}
.mqt-head .mqt-count{background:${PAL.orange06};color:${PAL.yellow53};padding:2px 9px;border-radius:8px;font:bold 12px monospace;}
.mqt-head .mqt-x{background:transparent;color:${PAL.orange06};font-size:16px;padding:2px 6px;cursor:pointer;}
/* Connection form — host / port / user / pass are ALWAYS shown and pre-filled. */
.mqt-form{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:8px 14px;background:${PAL.amber06};
    border-bottom:1px solid ${PAL.orange11s45};flex:0 0 auto;font:10px monospace;color:${PAL.yellow53};}
.mqt-form label{display:inline-flex;align-items:center;gap:5px;text-transform:uppercase;letter-spacing:1px;}
.mqt-form input{font:12px 'Courier New',monospace;padding:5px 8px;border:1px solid ${PAL.amber15};border-radius:5px;
    background:${PAL.orange03};color:${PAL.amber85};}
.mqt-form input:focus{outline:none;border-color:${PAL.yellow53};}
.mqt-form input.host{width:160px;} .mqt-form input.port{width:66px;}
.mqt-form input.user,.mqt-form input.pass{width:110px;}
.mqt-form button{font:bold 10px sans-serif;letter-spacing:1px;text-transform:uppercase;border:none;
    border-radius:5px;padding:6px 11px;cursor:pointer;background:${PAL.yellow53};color:${PAL.orange06};}
.mqt-form button.off{background:${PAL.amber15};color:${PAL.amber71s100};}
.mqt-form button:hover{filter:brightness(1.15);}
.mqt-eff{padding:5px 14px;font:10px monospace;background:${PAL.orange05s54};flex:0 0 auto;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mqt-eff b.ok{color:var(--state-good);} .mqt-eff b.warn{color:var(--state-kinda);} .mqt-eff b.bad{color:var(--state-dead);}
.mqt-eff .u{color:${PAL.amber36s48};}
.mqt-scroll{flex:1 1 auto;overflow:auto;}
.mqt table{width:100%;border-collapse:collapse;}
.mqt th,.mqt td{text-align:left;padding:5px 14px;border-bottom:1px solid ${PAL.amber09};vertical-align:top;}
.mqt th{position:sticky;top:0;background:${PAL.orange05s54};color:${PAL.yellow53};letter-spacing:1px;}
.mqt td.topic{color:${PAL.sky69};white-space:nowrap;}
.mqt tr.branch td{cursor:pointer;background:${PAL.orange04};}
.mqt tr.branch td.topic{color:${PAL.yellow53};font-weight:bold;}
.mqt tr.branch:hover td{background:${PAL.amber06s66};}
.mqt .caret{display:inline-block;width:14px;color:${PAL.amber36s48};}
.mqt .cnt{margin-left:8px;font-size:10px;color:${PAL.amber36s48};font-weight:normal;}
.mqt .tick{display:inline-block;width:14px;color:${PAL.amber15};}
.mqt td.val{color:${PAL.amber85};white-space:pre-wrap;word-break:break-word;}
.mqt td.age{color:${PAL.amber36s48};text-align:right;white-space:nowrap;}
.mqt .empty{padding:40px;text-align:center;color:${PAL.amber30};letter-spacing:1px;}`;
