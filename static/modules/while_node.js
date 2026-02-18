// static/modules/while_node.js
export default {
  type: "while_node",

  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.max_iter?.default ?? 50;

    body.innerHTML = `
      <div class="form-row">
        <label for="max_${nodeId}">Máximo de iteraciones</label>
        <input id="max_${nodeId}" type="number" min="1" max="100000" value="${def}">
      </div>
      <div class="muted" style="font-size:11px">
        Entrada: puede ser <code>{cond, payload}</code> o dos entradas (condición y payload).<br>
        Salidas: <code>loop</code> (continúa) y <code>salir</code> (finaliza).
      </div>
    `;

    window.NODE_API?.rebuildOutPorts?.(el, [
      { name: "loop",  title: "Vuelve a iterar (loop)", topPct: 35 },
      { name: "salir", title: "Salida final (salir)",  topPct: 65 }
    ]);
  },

  readConfig(el){
    const max_iter = parseInt(el.querySelector(".body input[type='number']")?.value || "50", 10);
    return { max_iter };
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const d = document.createElement("div");
    d.className = "run-output";
    d.style.font="12px ui-monospace";
    const r = data?.result || {};
    // sin símbolo "·" para evitar problemas si copias/pegas en entornos raros
    d.textContent = `iter: ${r.iter ?? "?"}/${r.max_iter ?? "?"} | cond: ${r.cond ? "true" : "false"}` + (r.fin ? " (fin)" : "");
    body.appendChild(d);
  }
};

