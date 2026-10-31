import { addStyles } from '../../ui/dom.js';
import { PAL } from '../../domain/palette.js';

export function injectWirelessStyles(): void {
  addStyles('wireless-editor', `
    .wl-editor { display: flex; flex-direction: column; gap: 20px; color: ${PAL.white}; }
    .wl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .wl-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; }
    .wl-card h4 { margin: 0 0 15px 0; color: ${PAL.sky69s20}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .wl-stat { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; }
    .wl-stat-val { font-weight: bold; font-family: monospace; }
    .wl-meter-bg { width: 100px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-left: 10px; }
    .wl-meter-fg { height: 100%; transition: width 0.1s; }
    
    .wl-knobs { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
    .wl-knob { display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: ${PAL.sky69s20}; align-items: center; }
    .wl-knob input { width: 80px; }
    .wl-knob span.val { font-weight: bold; color: ${PAL.white}; font-family: monospace; }
    
    .wl-btn-row { display: flex; gap: 10px; margin-top: 15px; }
    .wl-btn { background: rgba(255,255,255,0.1); border: none; color: ${PAL.white}; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: background 0.2s; }
    .wl-btn:hover { background: rgba(255,255,255,0.2); }
    .wl-btn.panic { background: rgba(220, 53, 69, 0.2); border: 1px solid rgba(220, 53, 69, 0.5); color: ${PAL.red71s100}; }
    .wl-btn.panic:hover { background: rgba(220, 53, 69, 0.4); }
    
    .wl-spectrum { width: 100%; height: 120px; background: ${PAL.black}; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; position: relative; }
    .wl-spectrum canvas { width: 100%; height: 100%; display: block; }
    
    .wl-traffic { width: 12px; height: 12px; border-radius: 50%; display: inline-block; box-shadow: 0 0 5px currentColor; margin-right: 8px; }
    .status-ok { color: var(--state-good); background: ${PAL.green53}; }
    .status-warn { color: var(--state-kinda); background: ${PAL.yellow65}; }
    .status-err { color: var(--state-dead); background: ${PAL.red71s100}; }

    .wl-iem-section { margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
  `);
}
