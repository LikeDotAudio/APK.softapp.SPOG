// src/editors/audio-mixer/styles — verbatim port of the legacy
// addStyles('twist-editor-audio-mixer', …) CSS block so the console visuals match 1:1.

import { addStyles } from '../../ui/dom.js';
import { PAL, alpha } from '../../domain/palette.js';

export function injectAudioMixerStyles(): void {
  addStyles(
    'twist-editor-audio-mixer',
    `
        /* ===== Audio mixer — chunky, finger-friendly console ===== */
        /* LCARS layout: rounded left rail (layer switch + deco elbows) | strips */
        .am-console{display:flex;gap:14px;align-items:stretch;min-height:430px;}
        .am-rail{flex:0 0 158px;display:flex;flex-direction:column;gap:8px;padding:12px 10px;
            background:${PAL.blue09};border:2px solid ${PAL.blue27s36};border-radius:44px 10px 10px 44px;}
        .am-rail-h{color:var(--cyan,${PAL.cyan50});font-size:10px;letter-spacing:2px;font-weight:bold;
            text-align:center;text-transform:uppercase;margin-bottom:2px;}
        .am-layerbtn{padding:16px 10px;border-radius:24px 6px 6px 24px;background:${PAL.blue23s39};color:${PAL.blue89};
            font-weight:900;letter-spacing:1px;font-size:14px;text-align:center;cursor:pointer;
            white-space:nowrap;transition:filter .12s,box-shadow .12s,background .12s;}
        .am-layerbtn:hover{filter:brightness(1.12);}
        .am-layerbtn.sel{background:var(--ed-color,${PAL.orange69});color:${PAL.black};box-shadow:0 0 14px ${alpha(PAL.orange69, .55)};}
        .am-layerbtn.static{cursor:default;}
        /* Decorative LCARS elbow blocks down the rail */
        .am-elbow{flex:0 0 auto;height:30px;border-radius:24px 6px 6px 24px;}
        .am-elbow.a{background:${PAL.orange46};} .am-elbow.b{background:${PAL.blue60};} .am-elbow.c{background:${PAL.purple52};}
        .am-rail-foot{flex:1 1 auto;min-height:36px;border-radius:6px 6px 44px 6px;background:${PAL.blue15};}
        .am-strips{flex:1 1 auto;min-width:0;display:flex;gap:12px;overflow-x:auto;padding-bottom:10px;}
        .am-strip{flex:0 0 auto;width:128px;background:${PAL.blue09};border:1px solid ${PAL.blue23s39};
            border-radius:12px;padding:12px 10px;display:flex;flex-direction:column;align-items:center;gap:12px;}
        .am-strip.master{background:${PAL.indigo11};border-color:${PAL.indigo33};}
        .am-strip.group{border-width:2px;border-style:solid;}
        /* Three-line channel identity: parent / child small, the SOURCE leads. */
        .am-name .am-ln{display:block;line-height:1.2;}
        .am-name .am-ln.ctx{font-size:8px;font-weight:600;letter-spacing:.5px;opacity:.75;}
        .am-name .am-ln.src{font-size:12px;}
        .am-name{font-size:12px;font-weight:bold;letter-spacing:.5px;text-align:center;width:100%;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${PAL.blue89};}
        .am-spill{font-size:11px;font-weight:900;letter-spacing:1px;border:none;border-radius:8px;
            padding:6px 12px;cursor:pointer;background:${PAL.blue27s36};color:${PAL.blue89};}
        .am-spill:hover{filter:brightness(1.15);}
        .am-spill.on{background:var(--cyan,${PAL.cyan50});color:${PAL.black};box-shadow:0 0 10px ${alpha(PAL.cyan50, .5)};}
        .am-knob{width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 50% 35%,${PAL.blue32},${PAL.blue09s58});
            border:3px solid ${PAL.blue40};position:relative;cursor:ns-resize;box-shadow:0 2px 6px ${alpha(PAL.black, .5)};}
        .am-knob::after{content:'';position:absolute;left:50%;top:6px;width:3px;height:18px;background:var(--cyan,${PAL.cyan50});
            transform-origin:50% 25px;transform:translateX(-50%) rotate(var(--rot,0deg));border-radius:2px;}
        .am-klabel{font-size:9px;letter-spacing:1px;color:${PAL.blue60s27};margin-top:-6px;}
        /* Stage-box remote-preamp SENS control, revealed with a little magic. */
        .am-sens{position:relative;margin:4px auto 8px;padding:6px 4px 4px;border-radius:10px;
            background:${alpha(PAL.orange62, .1)};border:1px solid ${alpha(PAL.orange62, .5)};display:flex;flex-direction:column;align-items:center;}
        .am-sens-badge{font:bold 8px sans-serif;letter-spacing:1px;color:${PAL.orange62};margin-bottom:3px;}
        .am-sens-btn{margin-top:2px;width:100%;background:${PAL.orange62};color:${PAL.orange06};border:none;border-radius:6px;font:bold 9px sans-serif;letter-spacing:1px;padding:7px 6px;cursor:pointer;}
        .am-sens-btn:hover{filter:brightness(1.08);}
        .am-pregain{margin:4px auto 6px;padding:5px 4px;border-radius:9px;background:${alpha(PAL.orange62, .1)};border:1px solid ${alpha(PAL.orange62, .45)};display:flex;flex-direction:column;align-items:center;gap:4px;}
        .am-pregain .am-knob{--cyan:${PAL.orange62};width:42px;height:42px;border-color:${PAL.amber35};}
        .am-pregain .am-knob::after{height:12px;top:4px;transform-origin:50% 16px;}
        .am-pre-open{width:100%;background:${PAL.blue15};color:${PAL.orange62};border:1px solid ${PAL.amber35};border-radius:5px;font:bold 8px sans-serif;letter-spacing:.5px;padding:5px 4px;cursor:pointer;}
        .am-pre-open:hover{background:${PAL.blue23s39};}
        /* Wireless mic channel: the strip carries an RF accent so the operator can
           spot radio channels (battery/RF risk) at a glance; button opens telemetry. */
        .am-strip.wireless{border:1px solid ${alpha(PAL.cyan52, .55)};border-radius:8px;
            background:linear-gradient(180deg,${alpha(PAL.cyan52, .12)},${alpha(PAL.cyan52, .03)} 40%);
            box-shadow:0 0 10px ${alpha(PAL.cyan52, .18)} inset;}
        .am-strip.wireless .am-name::after{content:'RF';font:bold 7px sans-serif;letter-spacing:1px;color:${PAL.sky10};
            background:${PAL.cyan52};border-radius:3px;padding:1px 3px;margin-left:4px;vertical-align:middle;}
        .am-pre-open.wireless{background:${PAL.cyan12};color:${PAL.cyan52};border-color:${PAL.cyan37s55};}
        .am-pre-open.wireless:hover{background:${PAL.cyan18};}
        .am-sens-reveal{animation:amSens .85s cubic-bezier(.2,1.4,.4,1) both;}
        @keyframes amSens{0%{transform:scale(.15);opacity:0;filter:brightness(3)}55%{transform:scale(1.14)}100%{transform:scale(1);opacity:1;filter:none}}
        .am-sens-reveal::before{content:'';position:absolute;inset:-5px;border-radius:12px;border:2px solid ${PAL.orange62};
            animation:amRing .85s ease-out forwards;pointer-events:none;}
        @keyframes amRing{0%{transform:scale(.4);opacity:.95;box-shadow:0 0 18px ${PAL.orange62}}100%{transform:scale(1.9);opacity:0}}
        .am-sens-reveal::after{content:'✦';position:absolute;top:-8px;right:-4px;color:${PAL.amber85};font-size:13px;animation:amSpark 1s ease-out forwards;}
        @keyframes amSpark{0%{transform:scale(0) rotate(0);opacity:0}40%{transform:scale(1.4) rotate(90deg);opacity:1}100%{transform:scale(.6) rotate(180deg);opacity:0}}
        .am-eq{display:flex;gap:8px;}
        .am-eq .am-kw{display:flex;flex-direction:column;align-items:center;}
        .am-eq .am-knob{width:40px;height:40px;}
        .am-eq .am-knob::after{height:12px;top:4px;transform-origin:50% 16px;}
        .am-ms{display:flex;gap:8px;}
        .am-ms button{font-size:13px;font-weight:900;letter-spacing:1px;border:none;border-radius:8px;
            padding:8px 16px;cursor:pointer;background:${PAL.blue23s39};color:${PAL.blue89};}
        .am-ms button.mute.on{background:${PAL.red60};color:${PAL.white};box-shadow:0 0 12px ${alpha(PAL.red60, .6)};}
        .am-ms button.solo.on{background:${PAL.amber61};color:${PAL.black};box-shadow:0 0 12px ${alpha(PAL.amber61, .6)};}
        .am-fadarea{display:flex;gap:10px;align-items:flex-end;height:240px;}
        .am-fader{-webkit-appearance:none;appearance:none;writing-mode:vertical-lr;direction:rtl;
            width:46px;height:230px;border-radius:24px;border:2px solid ${PAL.blue34s39};cursor:grab;
            background:linear-gradient(${PAL.blue12_0c1730},${PAL.blue15});box-shadow:inset 0 0 14px ${alpha(PAL.black, .6)};}
        .am-fader:active{cursor:grabbing;}
        .am-fader::-webkit-slider-thumb{-webkit-appearance:none;width:60px;height:34px;border-radius:9px;
            background:linear-gradient(${PAL.sky96_eaf4ff},${PAL.blue80s50});border:2px solid ${PAL.white};cursor:grab;
            box-shadow:0 3px 6px ${alpha(PAL.black, .55)},0 0 8px ${alpha(PAL.blue89, .5)};}
        .am-fader::-moz-range-thumb{width:60px;height:34px;border-radius:9px;background:${PAL.blue89};border:2px solid ${PAL.white};cursor:grab;}
        .am-strip.master .am-fader::-webkit-slider-thumb{background:linear-gradient(${PAL.indigo92},${PAL.indigo83});}
        .am-vu{width:16px;height:230px;border-radius:5px;background:${PAL.blue09};overflow:hidden;display:flex;flex-direction:column-reverse;}
        .am-vu > i{display:block;width:100%;height:0%;background:linear-gradient(${PAL.green44},${PAL.yellow56} 70%,${PAL.red62});}
        .am-db{font-size:11px;font-weight:bold;color:${PAL.sky71};}
        /* EQ + PAN + sends bank — collapses ("tucks up") on spilled sub-strips */
        .am-rotaries{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;
            overflow:hidden;max-height:520px;opacity:1;transition:max-height .28s ease,opacity .2s ease;}
        .am-rotaries.tucked{max-height:0;opacity:0;gap:0;}
        /* Aux sends — two banks: MM (mix-minus) + MONITOR, 4 each */
        .am-aux{width:100%;}
        .am-aux-h{font-size:8px;letter-spacing:1px;color:${PAL.blue60s27};text-align:center;margin-bottom:5px;text-transform:uppercase;}
        .am-aux-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px 2px;justify-items:center;}
        .am-aux .am-knob{width:28px;height:28px;border-width:2px;}
        .am-aux .am-knob::after{height:9px;top:3px;transform-origin:50% 11px;}
        .am-aux .am-klabel{font-size:7px;margin-top:-3px;white-space:nowrap;}
        /* MASTER as its own always-visible tab pinned to the right of the console */
        .am-master-tab{flex:0 0 auto;align-self:stretch;display:flex;flex-direction:column;
            background:${PAL.indigo11};border:2px solid ${PAL.indigo33};border-radius:10px 44px 44px 10px;padding:12px 14px;}
        .am-master-h{color:${PAL.indigo89};font-size:11px;letter-spacing:2px;font-weight:900;text-align:center;
            text-transform:uppercase;margin-bottom:8px;}
        .am-master-tab .am-strip.master{border:none;background:transparent;padding:0;}
        .am-master-tab .am-strip.master .am-name{display:none;}
        /* Sub-mix breakout (a spilled group's individual channels) */
        .am-submix{margin-top:16px;background:${PAL.blue09};border:1px solid ${PAL.blue27s36};border-left:5px solid var(--cyan,${PAL.cyan50});
            border-radius:6px 14px 14px 6px;padding:12px 14px;}
        .am-submix-h{display:flex;justify-content:space-between;align-items:center;color:var(--cyan,${PAL.cyan50});
            font-size:12px;font-weight:bold;letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;}
        .am-submix-close{cursor:pointer;color:${PAL.sky71};font-size:11px;font-weight:900;}
        .am-submix-close:hover{color:${PAL.white};}
        .am-substrips .am-strip{background:${PAL.blue12_0c1730};}
    `,
  );
}
