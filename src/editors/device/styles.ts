// src/editors/device/styles.ts — LCARS styling for the Universal Device Editor.

export const CSS_ID = 'spog-device-editor-styles';

export const CSS = `
.dev-ed {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #030712;
  color: #e5e7eb;
  font-family: var(--lcars-font, "Ubuntu Condensed", monospace, sans-serif);
  overflow: hidden;
  box-sizing: border-box;
}

.dev-top-rail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #0b1329;
  border-bottom: 2px solid var(--lcars-accent, #ff9900);
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
  background: var(--lcars-accent, #ff9900);
  color: #000;
  text-transform: uppercase;
}

.dev-title {
  font-size: 18px;
  letter-spacing: 1.5px;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
}

.dev-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.dev-tab-btn {
  background: #111e38;
  color: #94a3b8;
  border: 1px solid #1e293b;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.15s ease;
}

.dev-tab-btn:hover {
  background: #1e293b;
  color: #f1f5f9;
}

.dev-tab-btn.active {
  background: var(--lcars-accent, #ff9900);
  color: #000;
  border-color: var(--lcars-accent, #ff9900);
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
  background: #090f1d;
  border: 1px solid #1e293b;
  border-top: 4px solid var(--group-accent, #38bdf8);
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
  border-bottom: 1px solid #1e293b;
}

.dev-group-title {
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--group-accent, #38bdf8);
  text-transform: uppercase;
}

.dev-subgroup-title {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1.5px;
  color: #64748b;
  margin: 10px 0 6px 0;
  text-transform: uppercase;
  border-left: 2px solid #64748b;
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
  background: #0f172a;
  border-radius: 4px;
  border: 1px solid #1e293b;
}

.dev-strip-name {
  font-size: 9px;
  letter-spacing: 0.5px;
  color: #94a3b8;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.dev-strip-val {
  font-size: 9px;
  color: #f8fafc;
  font-family: monospace;
}

.dev-toggle-btn {
  padding: 6px 10px;
  border-radius: 4px;
  background: #1e293b;
  color: #64748b;
  border: none;
  font-size: 10px;
  letter-spacing: 1px;
  cursor: pointer;
  text-transform: uppercase;
  width: 100%;
}

.dev-toggle-btn.active {
  background: var(--lcars-accent, #ff9900);
  color: #000;
  font-weight: bold;
  box-shadow: 0 0 8px var(--lcars-accent, #ff9900);
}

.dev-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  gap: 12px;
}
`;
