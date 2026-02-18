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
        <button type="button" class="btn btn-browse" style="font-size:11px;padding:4px 8px;display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
        </svg>
        Copia archivos desde entrada
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const skippedCount = (data.skipped || []).length;
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        ${data.copied} archivo${data.copied !== 1 ? 's' : ''} copiado${data.copied !== 1 ? 's' : ''}
      </div>
      <div style="color:#d1d5db;margin-top:4px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        ${data.dest}
      </div>
      ${skippedCount ? '<div style="color:#f48771;margin-top:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' + skippedCount + ' omitidos</div>' : ''}
    `;

    body.appendChild(output);
  }
};

