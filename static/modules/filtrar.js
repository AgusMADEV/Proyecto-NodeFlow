export default {
  type: "filtrar",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Campo a evaluar</label>
      <input 
        type="text" 
        data-config-key="campo" 
        placeholder="nombre, edad, precio..." 
        style="font-size:12px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Operador</label>
      <select data-config-key="operador" style="font-size:12px">
        <option value="==">== (igual)</option>
        <option value="!=">!= (diferente)</option>
        <option value=">">> (mayor que)</option>
        <option value="<">< (menor que)</option>
        <option value=">=">>= (mayor o igual)</option>
        <option value="<="><= (menor o igual)</option>
        <option value="contains">contiene (texto)</option>
        <option value="not_contains">no contiene (texto)</option>
      </select>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor</label>
      <input 
        type="text" 
        data-config-key="valor" 
        placeholder="valor a comparar" 
        style="font-size:12px" 
      />
    `;

    const titleEl = el.querySelector(".title");
    const campoInput = body.querySelector('[data-config-key="campo"]');
    const operadorSelect = body.querySelector('[data-config-key="operador"]');
    const valorInput = body.querySelector('[data-config-key="valor"]');
    
    const refreshTitle = () => {
      const campo = campoInput.value.trim();
      const operador = operadorSelect.value;
      const valor = valorInput.value.trim();
      
      if (campo && valor) {
        titleEl.textContent = `🔍 ${campo} ${operador} ${valor}`;
      } else if (campo) {
        titleEl.textContent = `🔍 Filtrar ${campo}`;
      } else {
        titleEl.textContent = "🔍 Filtrar";
      }
    };

    campoInput.addEventListener("input", refreshTitle);
    operadorSelect.addEventListener("change", refreshTitle);
    valorInput.addEventListener("input", refreshTitle);
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const original = data.original_count || 0;
      const filtrado = data.filtrado || 0;
      const preview = data.data?.slice(0, 3) || [];
      
      output.innerHTML = `
        <div style="color:#4ec9b0;font-weight:600;margin-bottom:4px">
          ✓ ${count} de ${original} elementos
          ${filtrado > 0 ? `<span style="color:#888">(${filtrado} filtrados)</span>` : ''}
        </div>
        <pre style="margin:0;color:#ddd;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 3 ? '<div style="color:#888;margin-top:4px">... y ' + (count - 3) + ' elementos más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">✗ ${data.error || 'Error'}</div>`;
    }

    body.appendChild(output);
  }
};
