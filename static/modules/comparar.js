// static/modules/comparar.js
export default {
  type: "comparar",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    const defOp  = toolSpec?.config?.op?.default  ?? "==";
    const defRhs = toolSpec?.config?.rhs?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Operador</label>
      <select data-config-key="op" style="font-size:12px">
        ${["<", ">", "==", "!=", "contains"].map(o => 
          `<option value="${o}" ${o===defOp?"selected":""}>${o}</option>`
        ).join("")}
      </select>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor a comparar</label>
      <input 
        data-config-key="rhs"
        type="text" 
        value="${defRhs}" 
        placeholder="comparar contra..."
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        Compara input0 con el valor especificado
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const opSelect = body.querySelector('[data-config-key="op"]');
    
    const refreshTitle = () => {
      const op = opSelect.value;
      titleEl.textContent = `⚖️ Comparar ${op}`;
    };

    opSelect.addEventListener("change", refreshTitle);
    refreshTitle();
    return true;
  },

  readConfig(el) {
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px";

    const result = !!data?.data;
    output.innerHTML = `
      <div style="color:${result ? '#4ec9b0' : '#f48771'};font-weight:600">
        ${result ? '✓ true' : '✗ false'}
      </div>
    `;

    body.appendChild(output);
  }
};

