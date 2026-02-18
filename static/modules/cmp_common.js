export function buildSimpleCompareBody(el, label, def=""){
  const body = el.querySelector(".body");
  body.innerHTML = `
    <label style="font:600 12px system-ui;opacity:.8">${label}</label>
    <input 
      data-config-key="value"
      type="text" 
      value="${def}" 
      placeholder="${label}"
      style="font-size:12px"
    />
    <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      Compara entrada vs constante
    </div>
  `;
}
export function readSimple(el){
  const config = {};
  el.querySelectorAll("[data-config-key]").forEach(inp => {
    const key = inp.dataset.configKey;
    config[key] = inp.value;
  });
  return config;
}
export function renderBool(el, data){
  const body = el.querySelector(".body");
  const existing = body.querySelector(".run-output");
  if (existing) existing.remove();

  const output = document.createElement("div");
  output.className = "run-output";
  output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

  const ok = data?.result === true;
  output.innerHTML = `
    <div style="color:${ok ? '#4ade80' : '#f48771'};font-weight:600">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${ok ? '3' : '2.5'}" style="vertical-align:-1px;margin-right:4px;">
        ${ok ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
      </svg>
      ${ok ? 'true' : 'false'}
    </div>
  `;

  body.appendChild(output);
}

