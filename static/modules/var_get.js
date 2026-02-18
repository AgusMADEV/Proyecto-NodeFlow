export default {
  type: "var_get",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defN = toolSpec?.config?.name?.default ?? "x";
    const defD = toolSpec?.config?.default?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Nombre de variable</label>
      <input 
        id="name_${nodeId}" 
        data-config-key="name"
        type="text" 
        value="${defN}" 
        placeholder="x"
        style="font-size:12px"
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor por defecto</label>
      <input 
        id="default_${nodeId}" 
        data-config-key="default"
        type="text" 
        value="${defD}" 
        placeholder="(si no existe)"
        style="font-size:12px"
      />
    `;

    const titleEl = el.querySelector(".title");
    const nameInput = body.querySelector('[data-config-key="name"]');
    
    const refreshTitle = () => {
      const name = nameInput.value.trim() || "x";
      titleEl.textContent = `Obtener: ${name}`;
    };

    nameInput.addEventListener("input", refreshTitle);
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

    if (data?.name) {
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">${data.name}</div>
        <div style="color:#d1d5db;margin-top:4px">${String(data.value)}</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Variable no encontrada
      </div>`;
    }

    body.appendChild(output);
  }
};

