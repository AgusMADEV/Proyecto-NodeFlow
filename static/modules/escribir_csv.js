export default {
  type: "escribir_csv",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8;display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <path d="M17 21v-8H7v8M7 3v5h8"/>
        </svg>
        Archivo destino
      </label>
      <input 
        type="text" 
        data-config-key="archivo" 
        placeholder="salida.csv" 
        style="font-size:12px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Delimitador</label>
      <input 
        type="text" 
        data-config-key="delimiter" 
        value="," 
        maxlength="1"
        style="font-size:12px;width:40px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">
        <input 
          type="checkbox" 
          data-config-key="incluir_encabezado" 
          checked
        />
        Incluir encabezado
      </label>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Codificación</label>
      <select data-config-key="encoding" style="font-size:12px">
        <option value="utf-8">UTF-8</option>
        <option value="latin-1">Latin-1</option>
        <option value="cp1252">Windows-1252</option>
      </select>
    `;

    const titleEl = el.querySelector(".title");
    const archivoInput = body.querySelector('[data-config-key="archivo"]');
    
    const refreshTitle = () => {
      const archivo = archivoInput.value.trim();
      if (archivo) {
        const filename = archivo.split(/[/\\]/).pop();
        titleEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Guardar: ${filename}`;
      } else {
        titleEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Escribir CSV';
      }
    };

    archivoInput.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === "checkbox") {
        config[key] = inp.checked;
      } else {
        config[key] = inp.value;
      }
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

    if (data.ok) {
      const filas = data.filas_escritas || 0;
      const archivo = data.archivo || '';
      const filename = archivo.split(/[/\\]/).pop();
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          CSV guardado
        </div>
        <div style="color:#d1d5db;margin-top:4px">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          ${filename}
        </div>
        <div style="color:#6b7280;margin-top:2px">${filas} filas escritas</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }

    body.appendChild(output);
  }
};
