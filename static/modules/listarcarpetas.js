import { openFolderPicker } from "/static/modules/folderpicker.js";

export default {
  type: "listarcarpetas",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.path?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Ruta de carpeta</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <input 
          id="path_${nodeId}" 
          data-config-key="path"
          type="text" 
          value="${def}" 
          placeholder="workflows" 
          style="flex:1;font-size:12px"
        />
        <button type="button" class="btn btn-browse" style="font-size:11px;padding:4px 8px">📁</button>
      </div>
    `;
    body.querySelector(".btn-browse").addEventListener("click", async ()=>{
      const current = body.querySelector("input").value.trim();
      const chosen = await openFolderPicker(current);
      if (chosen) body.querySelector("input").value = chosen;
    });
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px;max-height:150px;overflow:auto";

    const files = (data.files || []);
    const names = files.slice(0, 8).map(f => (f.is_dir ? "📁 " : "📄 ") + f.name);
    
    output.innerHTML = `
      <div style="color:#4ec9b0;font-weight:600;margin-bottom:4px">✓ ${files.length} elementos</div>
      <pre style="margin:0;color:#ddd;white-space:pre-wrap">${names.join('\n')}</pre>
      ${files.length > 8 ? '<div style="color:#888;margin-top:4px">... y ' + (files.length - 8) + ' más</div>' : ''}
    `;

    body.appendChild(output);
  }
};

