export default {
  type: "constante",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Nombre (opcional)</label>
      <input 
        id="name_${nodeId}" 
        data-config-key="name"
        placeholder="PI, IVA, etc." 
        value="" 
        style="font-size:12px"
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor</label>
      <input 
        id="value_${nodeId}" 
        data-config-key="value"
        placeholder="texto o número" 
        value="1" 
        style="font-size:12px"
      />
    `;

    const titleEl = el.querySelector(".title");
    const nameEl = body.querySelector('[data-config-key="name"]');
    const valueEl = body.querySelector('[data-config-key="value"]');

    const refreshTitle = ()=>{
      const n = (nameEl.value || "").trim();
      const v = (valueEl.value || "").trim() || "¿?";
      titleEl.innerHTML = n ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/></svg>${n} = ${v}` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/></svg>Constante = ${v}`;
    };

    nameEl.addEventListener("input", refreshTitle);
    valueEl.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">Tipo: ${data.type || 'unknown'}</div>
      <div style="color:#d1d5db;margin-top:4px">${String(data.value)}</div>
    `;

    body.appendChild(output);
  }
};

