export default {
  type: "ifnode",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Expresión (usa <code>x</code>)</label>
      <input 
        id="expr_${nodeId}" 
        data-config-key="expr"
        value="bool(x)" 
        style="font-size:12px"
      />
      
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        Ejemplos: <code>x > 10</code>, <code>'ok' in str(x)</code>
      </div>
    `;

    // puertos: true/false
    window.NODE_API?.rebuildOutPorts?.(el, [
      { name:"true",  title:"Salida (true)",  topPct:35 },
      { name:"false", title:"Salida (false)", topPct:65 }
    ]);
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:150px;overflow:auto";

    if (data.error) {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error}
      </div>`;
    } else {
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Evaluado
        </div>
        <pre style="margin:4px 0 0 0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(data, null, 2).slice(0, 300)}</pre>
      `;
    }

    body.appendChild(output);
  }
};

