import { PAL } from '../../domain/palette.js';

export const CSS = `
.tsg-ed{display:flex;flex-direction:column;gap:12px;padding:10px;color:${PAL.blue92};
  font-family:var(--lcars-font,'Antonio',sans-serif);}
.tsg-ed-top{display:flex;gap:14px;align-items:stretch;flex-wrap:wrap;}
.tsg-ed-preview{flex:1 1 340px;min-width:300px;border:2px solid var(--lcars-color,${PAL.orange63});
  border-radius:10px;overflow:hidden;background:${PAL.black};position:relative;}
.tsg-ed-preview canvas{display:block;width:100%;aspect-ratio:16/9;background:${PAL.black};}
.tsg-ed-meta{flex:1 1 260px;display:flex;flex-direction:column;gap:8px;justify-content:center;}
.tsg-ed-name{font:700 22px/1.1 var(--lcars-font,'Antonio',sans-serif);letter-spacing:1px;
  color:var(--lcars-color,${PAL.orange63});}
.tsg-ed-badge{align-self:flex-start;font:700 10px/1 sans-serif;letter-spacing:1.5px;
  padding:4px 9px;border-radius:12px;background:${PAL.blue15};color:${PAL.sky75s60};border:1px solid ${PAL.sky30};}
.tsg-ed-desc{font:400 13px/1.5 sans-serif;color:${PAL.sky84s40};}
.tsg-ed-link{align-self:flex-start;font:600 12px/1 sans-serif;color:${PAL.sky75s100};text-decoration:none;
  padding:6px 10px;border:1px solid ${PAL.blue34s39};border-radius:6px;}
.tsg-ed-link:hover{background:var(--lcars-color,${PAL.orange63});color:${PAL.blue04};border-color:var(--lcars-color,${PAL.orange63});}
.tsg-ed-h{font:700 12px/1 var(--lcars-font,'Antonio',sans-serif);letter-spacing:2px;
  color:${PAL.sky67};text-transform:uppercase;margin:2px;}
`;
