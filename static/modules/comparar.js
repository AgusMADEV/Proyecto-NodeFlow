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

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const result = !!data?.data;
    output.innerHTML = `
      <div style="color:${result ? '#4ade80' : '#f48771'};font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${result ? '3' : '2.5'}" style="vertical-align:-1px;margin-right:4px;">
          ${result ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
        </svg>
        ${result ? 'true' : 'false'}
      </div>
    `;

    body.appendChild(output);
  }
};

