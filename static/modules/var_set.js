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

      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
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
      titleEl.textContent = v ? `💾 ${n} = ${v}` : `💾 Asignar ${n}`;
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px";

    if (data?.name) {
      output.innerHTML = `
        <div style="color:#4ec9b0;font-weight:600">✓ ${data.name}</div>
        <div style="color:#ddd;margin-top:4px">${String(data.value)}</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">✗ Error asignando variable</div>`;
    }

    body.appendChild(output);
  }
};

