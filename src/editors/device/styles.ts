// src/editors/device/styles.ts — LCARS styling for the Universal Device Editor.
import { PAL } from '../../domain/palette.js';
export const CSS_ID = 'spog-device-editor-styles';

export const CSS = `
.dev-ed {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: ${PAL.blue04s71};
  color: ${PAL.blue91s13};
  font-family: var(--lcars-font, "Ubuntu Condensed", monospace, sans-serif);
  overflow: hidden;
  box-sizing: border-box;
}

.dev-top-rail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: ${PAL.blue10s58};
  border-bottom: 2px solid var(--lcars-accent, ${PAL.orange50});
  gap: 12px;
}

.dev-meta-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dev-badge {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.5px;
  padding: 3px 8px;
  border-radius: 12px;
  background: var(--lcars-accent, ${PAL.orange50});
  color: ${PAL.black};
  text-transform: uppercase;
}

.dev-title {
  font-size: 18px;
  letter-spacing: 1.5px;
  color: ${PAL.white};
  font-weight: 600;
  text-transform: uppercase;
}

.dev-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.dev-tab-btn {
  background: ${PAL.blue14};
  color: ${PAL.blue65s20};
  border: 1px solid ${PAL.blue17};
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.15s ease;
}

.dev-tab-btn:hover {
  background: ${PAL.blue17};
  color: ${PAL.sky96s40};
}

.dev-tab-btn.active {
  background: var(--lcars-accent, ${PAL.orange50});
  color: ${PAL.black};
  border-color: var(--lcars-accent, ${PAL.orange50});
  font-weight: bold;
}

.dev-body {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16px;
  gap: 16px;
}

.dev-group-card {
  display: flex;
  flex-direction: column;
  min-width: 260px;
  max-width: 380px;
  background: ${PAL.blue07s53};
  border: 1px solid ${PAL.blue17};
  border-top: 4px solid var(--group-accent, ${PAL.sky60});
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  overflow-y: auto;
}

.dev-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${PAL.blue17};
}

.dev-group-title {
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--group-accent, ${PAL.sky60});
  text-transform: uppercase;
}

.dev-subgroup-title {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1.5px;
  color: ${PAL.blue47};
  margin: 10px 0 6px 0;
  text-transform: uppercase;
  border-left: 2px solid ${PAL.blue47};
  padding-left: 6px;
}

.dev-io-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
  align-items: flex-end;
}

.dev-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  background: ${PAL.blue11};
  border-radius: 4px;
  border: 1px solid ${PAL.blue17};
}

.dev-strip-name {
  font-size: 9px;
  letter-spacing: 0.5px;
  color: ${PAL.blue65s20};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.dev-strip-val {
  font-size: 9px;
  color: ${PAL.sky98};
  font-family: monospace;
}

.dev-toggle-btn {
  padding: 6px 10px;
  border-radius: 4px;
  background: ${PAL.blue17};
  color: ${PAL.blue47};
  border: none;
  font-size: 10px;
  letter-spacing: 1px;
  cursor: pointer;
  text-transform: uppercase;
  width: 100%;
}

.dev-toggle-btn.active {
  background: var(--lcars-accent, ${PAL.orange50});
  color: ${PAL.black};
  font-weight: bold;
  box-shadow: 0 0 8px var(--lcars-accent, ${PAL.orange50});
}

.dev-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${PAL.blue47};
  gap: 12px;
}
`;
