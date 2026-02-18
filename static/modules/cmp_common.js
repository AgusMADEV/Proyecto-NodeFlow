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
    <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
      🔎 Compara entrada vs constante
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
  output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px";

  const ok = data?.result === true;
  output.innerHTML = `
    <div style="color:${ok ? '#4ec9b0' : '#f48771'};font-weight:600">
      ${ok ? '✓ true' : '✗ false'}
    </div>
  `;

  body.appendChild(output);
}

