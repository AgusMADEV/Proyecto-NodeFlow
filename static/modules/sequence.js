export default {
  type: "sequence",

  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defPasos = toolSpec?.config?.pasos?.default ?? 2;
    const defCic   = toolSpec?.config?.ciclico?.default ?? false;

    body.innerHTML = `
      <div class="form-row">
        <label for="pasos_${nodeId}">Pasos (salidas 1..N)</label>
        <input id="pasos_${nodeId}" type="number" min="1" max="12" value="${defPasos}">
      </div>
      <div class="form-row">
        <label style="display:flex; align-items:center; gap:8px;">
          <input id="ciclico_${nodeId}" type="checkbox" ${defCic ? "checked":""}>
          Cíclico
        </label>
      </div>
      <div class="muted" style="font-size:11px">Conecta la salida del paso 1 al primer nodo, etc.</div>
    `;

    // puertos: eliminamos out existentes y creamos 1..N
    el.querySelectorAll(".port.out").forEach(p=>p.remove());

    const pasos = Math.max(1, Math.min(12, parseInt(defPasos,10) || 2));
    for(let i=1;i<=pasos;i++){
      const p = document.createElement("div");
      p.className = "port out";
      p.dataset.port = String(i);
      p.title = `Salida paso ${i}`;
      p.style.top = `${(i/(pasos+1))*100}%`;
      el.appendChild(p);
      p.addEventListener("mousedown",(e)=>{
        e.stopPropagation();
        // usa la función global del editor
        iniciarConexionDesdeSalida(e, el, p);
      });
    }
    return true;
  },

  readConfig(el){
    const pasos = parseInt(el.querySelector(".body input[type='number']")?.value || "2", 10);
    const ciclico = !!el.querySelector(".body input[type='checkbox']")?.checked;
    return { pasos, ciclico };
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const d = document.createElement("div");
    d.className = "run-output";
    d.style.font = "12px ui-monospace";
    d.style.marginTop = "6px";
    const r = data?.result || {};
    d.textContent = `paso: ${r.paso ?? "?"}/${r.pasos ?? "?"}` + (r.fin ? " (fin)" : "");
    body.appendChild(d);
  }
};

