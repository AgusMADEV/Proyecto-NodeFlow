export default {
  type: "imprimir",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.prefix?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Prefijo (opcional)</label>
      <input 
        data-config-key="prefix"
        type="text" 
        value="${def}" 
        placeholder="ej: Resultado"
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        📋 Imprime datos en la consola
      </div>
    `;
  },
  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    output.innerHTML = `
      <div style="color:#4ec9b0;font-weight:600;margin-bottom:4px">🖨️ ${data?.message || 'Impreso'}</div>
      <pre style="margin:0;color:#ddd;white-space:pre-wrap">${JSON.stringify(data?.value, null, 2).slice(0, 500)}</pre>
    `;

    body.appendChild(output);
  }
};

