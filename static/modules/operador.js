export default {
  type: "operador",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defOp = toolSpec?.config?.op?.default ?? "+";
    const defB  = toolSpec?.config?.b?.default ?? "0";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Operador</label>
      <select data-config-key="op" style="font-size:12px">
        ${["+","-","*","/","%","==","!=","<",">","<=",">="].map(o=>`<option value="${o}" ${o===defOp?"selected":""}>${o}</option>`).join("")}
      </select>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">B (si no hay input1)</label>
      <input 
        data-config-key="b"
        type="text" 
        value="${defB}" 
        placeholder="0"
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        A = input0, B = input1 (o constante)
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const opSelect = body.querySelector('[data-config-key="op"]');
    
    const refreshTitle = () => {
      const op = opSelect.value;
      titleEl.textContent = `➕ Operador ${op}`;
    };

    opSelect.addEventListener("change", refreshTitle);
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
  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    if(data?.type === "error"){
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }else{
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">Resultado</div>
        <div style="color:#d1d5db;margin-top:4px">${String(data?.value)}</div>
      `;
    }

    body.appendChild(output);
  }
};

