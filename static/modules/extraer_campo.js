export default {
  type: "extraer_campo",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Campo a extraer</label>
      <input 
        type="text" 
        data-config-key="campo" 
        placeholder="nombre, id, email..." 
        style="font-size:12px" 
      />
      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        Convierte [{"name":"Ana"},{"name":"Bob"}]<br>en ["Ana", "Bob"]
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const campoInput = body.querySelector('[data-config-key="campo"]');
    
    const refreshTitle = () => {
      const campo = campoInput.value.trim();
      if (campo) {
        titleEl.textContent = `📌 Extraer: ${campo}`;
      } else {
        titleEl.textContent = "📌 Extraer Campo";
      }
    };

    campoInput.addEventListener("input", refreshTitle);
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
      const campo = data.campo || '';
      const preview = data.data?.slice(0, 10) || [];
      
      output.innerHTML = `
        <div style="color:#4ec9b0;font-weight:600;margin-bottom:4px">✓ ${count} valores extraídos</div>
        <div style="color:#888;margin-bottom:4px">Campo: ${campo}</div>
        <pre style="margin:0;color:#ddd;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 10 ? '<div style="color:#888;margin-top:4px">... y ' + (count - 10) + ' valores más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">✗ ${data.error || 'Error'}</div>`;
    }

    body.appendChild(output);
  }
};
