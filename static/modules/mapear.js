export default {
  type: "mapear",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Operación</label>
      <select data-config-key="operacion" id="op_${nodeId}" style="font-size:12px">
        <option value="extraer_campos">Extraer campos específicos</option>
        <option value="renombrar_campo">Renombrar un campo</option>
        <option value="agregar_campo">Agregar campo nuevo</option>
      </select>

      <div id="campos_container_${nodeId}" style="margin-top:8px">
        <label style="font:600 12px system-ui;opacity:.8">Campos (separados por coma)</label>
        <input 
          type="text" 
          data-config-key="campos" 
          placeholder="nombre, edad, ciudad" 
          style="font-size:12px" 
        />
      </div>

      <div id="renombrar_container_${nodeId}" style="margin-top:8px;display:none">
        <label style="font:600 12px system-ui;opacity:.8">Campo origen</label>
        <input 
          type="text" 
          data-config-key="campo_origen" 
          placeholder="nombre_viejo" 
          style="font-size:12px" 
        />
        <label style="font:600 12px system-ui;opacity:.8;margin-top:4px">Campo destino</label>
        <input 
          type="text" 
          data-config-key="campo_destino" 
          placeholder="nombre_nuevo" 
          style="font-size:12px" 
        />
      </div>

      <div id="agregar_container_${nodeId}" style="margin-top:8px;display:none">
        <label style="font:600 12px system-ui;opacity:.8">Nombre del nuevo campo</label>
        <input 
          type="text" 
          data-config-key="campo_destino" 
          placeholder="nuevo_campo" 
          style="font-size:12px" 
        />
        <label style="font:600 12px system-ui;opacity:.8;margin-top:4px">Valor</label>
        <input 
          type="text" 
          data-config-key="valor_nuevo" 
          placeholder="valor constante" 
          style="font-size:12px" 
        />
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const opSelect = body.querySelector(`#op_${nodeId}`);
    const camposContainer = body.querySelector(`#campos_container_${nodeId}`);
    const renombrarContainer = body.querySelector(`#renombrar_container_${nodeId}`);
    const agregarContainer = body.querySelector(`#agregar_container_${nodeId}`);
    
    const updateVisibility = () => {
      const op = opSelect.value;
      camposContainer.style.display = op === "extraer_campos" ? "block" : "none";
      renombrarContainer.style.display = op === "renombrar_campo" ? "block" : "none";
      agregarContainer.style.display = op === "agregar_campo" ? "block" : "none";
      
      const labels = {
        "extraer_campos": "🔄 Extraer campos",
        "renombrar_campo": "🔄 Renombrar",
        "agregar_campo": "🔄 Agregar campo"
      };
      titleEl.textContent = labels[op] || "🔄 Mapear";
    };

    opSelect.addEventListener("change", updateVisibility);
    updateVisibility();
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const preview = data.data?.slice(0, 3) || [];
      
      output.innerHTML = `
        <div style="color:#4ec9b0;font-weight:600;margin-bottom:4px">✓ ${count} elementos transformados</div>
        <pre style="margin:0;color:#ddd;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 3 ? '<div style="color:#888;margin-top:4px">... y ' + (count - 3) + ' elementos más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">✗ ${data.error || 'Error'}</div>`;
    }

    body.appendChild(output);
  }
};
