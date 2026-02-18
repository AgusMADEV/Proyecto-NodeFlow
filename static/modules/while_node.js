// static/modules/while_node.js
export default {
  type: "while_node",

  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.max_iter?.default ?? 50;

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Máximo de iteraciones</label>
      <input 
        id="max_${nodeId}" 
        data-config-key="max_iter"
        type="number" 
        min="1" 
        max="100000" 
        value="${def}"
        style="font-size:12px"
      />
      
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
        </svg>
        Entrada: <code>{cond, payload}</code><br>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        Salidas: <code>loop</code> y <code>salir</code>
      </div>
    `;

    window.NODE_API?.rebuildOutPorts?.(el, [
      { name: "loop",  title: "Vuelve a iterar (loop)", topPct: 35 },
      { name: "salir", title: "Salida final (salir)",  topPct: 65 }
    ]);
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === 'number') {
        config[key] = parseInt(inp.value, 10);
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

    const r = data?.result || {};
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
        </svg>
        Iteración ${r.iter ?? '?'}/${r.max_iter ?? '?'}
      </div>
      <div style="color:#d1d5db;margin-top:4px">
        Condición: ${r.cond ? 'true' : 'false'}${r.fin ? ' (finalizado)' : ''}
      </div>
    `;

    body.appendChild(output);
  }
};

