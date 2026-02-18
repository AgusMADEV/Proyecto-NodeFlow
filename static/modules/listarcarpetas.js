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
        <button type="button" class="btn btn-browse" style="font-size:11px;padding:4px 8px;display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:150px;overflow:auto";

    const files = (data.files || []);
    const names = files.slice(0, 8).map(f => {
      const icon = f.is_dir 
        ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
        : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>';
      return icon + f.name;
    });
    
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600;margin-bottom:4px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        ${files.length} elementos
      </div>
      <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${names.join('\n')}</pre>
      ${files.length > 8 ? '<div style="color:#6b7280;margin-top:4px">... y ' + (files.length - 8) + ' más</div>' : ''}
    `;

    body.appendChild(output);
  }
};

