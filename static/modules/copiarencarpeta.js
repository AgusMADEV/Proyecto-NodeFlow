import { openFolderPicker } from "/static/modules/folderpicker.js";

export default {
  type: "copiarencarpeta",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Carpeta destino</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <input 
          id="dest_${nodeId}" 
          data-config-key="dest"
          type="text" 
          value="" 
          placeholder="workflows/backup" 
          style="flex:1;font-size:12px"
        />
        <button type="button" class="btn btn-browse" style="font-size:11px;padding:4px 8px">📁</button>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        📄 Copia archivos desde entrada
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px";

    const skippedCount = (data.skipped || []).length;
    output.innerHTML = `
      <div style="color:#4ec9b0;font-weight:600">✓ ${data.copied} archivo${data.copied !== 1 ? 's' : ''} copiado${data.copied !== 1 ? 's' : ''}</div>
      <div style="color:#ddd;margin-top:4px">📁 ${data.dest}</div>
      ${skippedCount ? '<div style="color:#f48771;margin-top:4px">⚠ ' + skippedCount + ' omitidos</div>' : ''}
    `;

    body.appendChild(output);
  }
};

