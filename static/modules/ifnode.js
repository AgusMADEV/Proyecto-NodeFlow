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
      
      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px;max-height:150px;overflow:auto";

    if (data.error) {
      output.innerHTML = `<div style="color:#f48771">✗ ${data.error}</div>`;
    } else {
      output.innerHTML = `
        <div style="color:#4ec9b0;font-weight:600">✓ Evaluado</div>
        <pre style="margin:4px 0 0 0;color:#ddd;white-space:pre-wrap">${JSON.stringify(data, null, 2).slice(0, 300)}</pre>
      `;
    }

    body.appendChild(output);
  }
};

