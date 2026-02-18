export default {
  type: "var_set",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Variable</label>
      <input 
        id="name_${nodeId}" 
        data-config-key="name"
        placeholder="nombre" 
        value="x"
        style="font-size:12px"
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor inicial (opcional)</label>
      <input 
        id="value_${nodeId}" 
        data-config-key="value"
        placeholder="(vacío = usar entrada si llega)" 
        value=""
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        Si recibe entrada, se usa como valor.<br>
        Si no, se usa el valor inicial.
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const nameEl = body.querySelector('[data-config-key="name"]');
    const valueEl = body.querySelector('[data-config-key="value"]');

    const refreshTitle = ()=>{
      const n = (nameEl.value || "").trim() || "¿?";
      const v = (valueEl.value || "").trim();
      titleEl.innerHTML = v ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>${n} = ${v}` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Asignar ${n}`;
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

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    if (data?.name) {
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          ${data.name}
        </div>
        <div style="color:#d1d5db;margin-top:4px">${String(data.value)}</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Error asignando variable
      </div>`;
    }

    body.appendChild(output);
  }
};

