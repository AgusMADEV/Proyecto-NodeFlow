export default {
  type: "leer_csv",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">📁 Archivo CSV</label>
      <input 
        type="text" 
        data-config-key="archivo" 
        placeholder="datos.csv o ruta/datos.csv" 
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
          data-config-key="tiene_encabezado" 
          checked
        />
        Primera fila es encabezado
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
        titleEl.textContent = `📄 Leer: ${filename}`;
      } else {
        titleEl.textContent = "📄 Leer CSV";
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const preview = data.data?.slice(0, 3) || [];
      output.innerHTML = `
        <div style="color:#4ec9b0;font-weight:600;margin-bottom:4px">✓ Cargadas ${count} filas</div>
        <pre style="margin:0;color:#ddd;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 3 ? '<div style="color:#888;margin-top:4px">... y ' + (count - 3) + ' filas más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">✗ ${data.error || 'Error'}</div>`;
    }

    body.appendChild(output);
  }
};
