import { PAL, alpha } from '../../domain/palette.js';

export const PROMPTER_CSS = `
.tp{display:grid;grid-template-columns:1fr 1fr;gap:14px;height:100%;min-height:0;color:${PAL.sky91};position:relative;}
.tp-col{display:flex;flex-direction:column;gap:10px;min-height:0;position:relative;}
.tp-col h4{margin:0;color:${PAL.sky69};font:700 22px 'Courier New',monospace;letter-spacing:2px;text-transform:uppercase;}
.tp-script-wrapper{flex:1;min-height:0;display:flex;flex-direction:column;background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:8px;overflow:hidden;}
.tp-script-wrapper:focus-within{border-color:${PAL.sky69};}
.tp-script-container{flex:1;min-height:0;display:flex;}
.tp-gutter{padding:10px 8px;background:${PAL.blue09};color:${PAL.blue39};font:13px/1.6 'Courier New',monospace;text-align:right;border-right:1px solid ${PAL.blue19};overflow:hidden;user-select:none;white-space:pre;}
.tp-script{flex:1;min-height:0;background:transparent;border:none;color:${PAL.sky91};
  font:13px/1.6 'Courier New',monospace;padding:10px 12px;outline:none;white-space:pre-wrap;overflow:auto;}
.tp-toolbar { display:flex; gap: 8px; padding: 6px 12px; background: ${PAL.blue19}; border-bottom: 1px solid ${PAL.blue19}; }
.tp-tool-btn { font: bold 14px monospace; padding: 4px 8px; border-radius: 4px; background: ${PAL.blue09}; color: ${PAL.sky91}; border: 1px solid ${PAL.blue27s36}; cursor: pointer; }
.tp-tool-btn:hover { background: ${PAL.blue19}; }
.tp-tool-sep { width:1px; align-self:stretch; margin:2px 4px; background:${PAL.blue27s36}; }
.tp-tool-hl { width: 24px; height: 24px; padding: 0; border-radius: 4px; border: 1px solid ${alpha(PAL.black, .4)}; cursor: pointer; box-shadow: inset 0 0 0 1px ${alpha(PAL.white, .25)}; }
.tp-tool-hl:hover { transform: scale(1.12); }
.tp-tool-hl.clear { background: ${PAL.blue09}; color: ${PAL.sky91}; font: bold 16px monospace; box-shadow: inset 0 0 0 1px ${PAL.blue27s36}; }
.tp-ctrls{display:flex;flex-wrap:wrap;gap:16px;align-items:center;}
.tp-btn{font:800 22px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;padding:18px 30px;border:none;
  border-radius:20px;background:${PAL.blue19};color:${PAL.sky84};cursor:pointer;}
.tp-btn.on{background:${PAL.sky69};color:${PAL.sky08};}
.tp-file-btn{font:700 20px 'Courier New',monospace;padding:8px 16px;background:${PAL.blue19};border:none;border-radius:8px;color:${PAL.sky91};cursor:pointer;}
.tp-file-btn:hover{background:${PAL.blue27s36};}
.tp-slide{display:flex;align-items:center;gap:12px;font:20px 'Courier New',monospace;color:${PAL.blue60s27};letter-spacing:1px;}
.tp-slide input{width:220px;height:24px;cursor:pointer;}
.tp-config{display:flex;flex-wrap:wrap;gap:16px;align-items:center;font:20px 'Courier New',monospace;color:${PAL.blue60s27};}
.tp-config label{display:flex;align-items:center;gap:8px;cursor:pointer;}
.tp-config input[type="color"]{width:40px;height:40px;padding:0;border:none;border-radius:4px;background:none;cursor:pointer;}
.tp-config input[type="checkbox"]{width:24px;height:24px;cursor:pointer;}
.tp-stage{aspect-ratio:1/1;max-height:100%;margin:0 auto;position:relative;overflow:hidden;background:${PAL.black};border:1px solid ${PAL.blue19};border-radius:10px;}
.tp-scroll{position:absolute;left:0;right:0;top:0;padding:0 9%;color:${PAL.white};font-weight:800;text-align:center;
  text-shadow:0 2px 8px ${alpha(PAL.black, .8)};will-change:transform;}
.tp-scroll.show-lines { counter-reset: tp-line; }
.tp-scroll.show-lines > div, .tp-scroll.show-lines > p { counter-increment: tp-line; }
.tp-scroll.show-lines > div::before, .tp-scroll.show-lines > p::before { content: counter(tp-line) ": "; opacity: 0.5; margin-right: 8px; }
.tp-scroll p{margin:0 0 .7em;}
.story-marker{color:${PAL.amber60};font-weight:700;font-size:0.65em;border-top:1px dashed ${alpha(PAL.white, .35)};padding-top:4px;margin-top:8px;text-transform:uppercase;}
.gpo-marker{color:${PAL.red60s100};font-weight:700;font-size:0.65em;border-top:1px dashed ${alpha(PAL.red60s100, .35)};padding-top:4px;margin-top:8px;text-transform:uppercase;}
.tp-gpo-log{height:80px;overflow-y:auto;background:${PAL.blue09};border:1px solid ${PAL.blue19};border-radius:8px;padding:8px;font:14px monospace;color:${PAL.red60s100};}
.tp-gpo-entry{margin-bottom:4px;border-bottom:1px dashed ${PAL.blue19};padding-bottom:4px;}
.tp-shortcuts{position:absolute;bottom:20px;right:100px;background:${alpha(PAL.blue09, .9)};border:1px solid ${PAL.blue19};border-radius:8px;padding:12px;font:14px monospace;color:${PAL.blue60s27};box-shadow:0 4px 12px ${alpha(PAL.black, .5)};z-index:100;pointer-events:none;}
.tp-shortcuts h4{margin:0 0 10px 0;color:${PAL.sky69};font-size:16px;text-transform:uppercase;}
.tp-shortcuts div{margin-bottom:6px;}
.tp-wheel-col{background:${PAL.blue04};border:1px solid ${PAL.blue19};border-radius:10px;display:flex;flex-direction:column;align-items:center;padding:15px 0;width:80px;}
.tp-pace-container { position:relative; flex:1; width:48px; background:${PAL.blue04}; border:2px solid ${PAL.blue19}; border-radius:8px; cursor:pointer; user-select:none; overflow:hidden; margin-bottom:10px; }
.tp-wheel-bg { position:absolute; top:0; left:0; right:0; bottom:0; background-image:repeating-linear-gradient(transparent, transparent 18px, ${alpha(PAL.sky69, .15)} 18px, ${alpha(PAL.sky69, .15)} 20px); background-size:100% 20px; z-index:1; }
.tp-pace-track { position:absolute; left:50%; width:8px; top:10px; bottom:10px; margin-left:-4px; background:${alpha(PAL.blue19, .5)}; border-radius:4px; z-index:2; }
.tp-pace-fill { position:absolute; left:0; right:0; border-radius:4px; z-index:3; }
.tp-pace-thumb { position:absolute; left:-8px; right:-8px; height:16px; margin-top:-8px; background:${PAL.white}; border:3px solid ${PAL.sky69}; border-radius:8px; box-shadow:0 2px 6px ${alpha(PAL.black, .8)}; z-index:4; pointer-events:none; }
.tp-pace-center { position:absolute; top:50%; left:5px; right:5px; height:2px; margin-top:-1px; background:${PAL.white}; opacity:0.3; z-index:2; }
.tp-wheel-label { color:${PAL.sky69}; font:bold 18px monospace; margin-bottom:10px; text-shadow:0 2px 4px ${PAL.black}; }
.tp-mid{position:absolute;left:0;right:0;top:50%;height:2px;background:${alpha(PAL.sky69, .35)};pointer-events:none;margin-top:-1px;}
.tp-mid::before{content:'▶';position:absolute;left:3%;top:-10px;color:${PAL.sky69};font-size:22px;line-height:22px;text-shadow:0 2px 4px ${alpha(PAL.black, .8)};}
.tp-mid::after{content:'◀';position:absolute;right:3%;top:-10px;color:${PAL.sky69};font-size:22px;line-height:22px;text-shadow:0 2px 4px ${alpha(PAL.black, .8)};}
`;
