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
      
      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        🔁 Entrada: <code>{cond, payload}</code><br>
        📤 Salidas: <code>loop</code> y <code>salir</code>
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px";

    const r = data?.result || {};
    output.innerHTML = `
      <div style="color:#4ec9b0;font-weight:600">
        🔁 Iteración ${r.iter ?? '?'}/${r.max_iter ?? '?'}
      </div>
      <div style="color:#ddd;margin-top:4px">
        Condición: ${r.cond ? 'true' : 'false'}${r.fin ? ' (finalizado)' : ''}
      </div>
    `;

    body.appendChild(output);
  }
};

