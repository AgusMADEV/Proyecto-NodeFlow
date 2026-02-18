export default {
  type: "sequence",

  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defPasos = toolSpec?.config?.pasos?.default ?? 2;
    const defCic   = toolSpec?.config?.ciclico?.default ?? false;

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Pasos (salidas 1..N)</label>
      <input 
        id="pasos_${nodeId}" 
        data-config-key="pasos"
        type="number" 
        min="1" 
        max="12" 
        value="${defPasos}"
        style="font-size:12px"
      />
      
      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px;display:flex;align-items:center;gap:8px;">
        <input 
          id="ciclico_${nodeId}" 
          data-config-key="ciclico"
          type="checkbox" 
          ${defCic ? "checked":""}
        />
        Cíclico
      </label>
      
      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        📊 Ejecuta pasos en secuencia
      </div>
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
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === 'checkbox') {
        config[key] = inp.checked;
      } else if (inp.type === 'number') {
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
        📊 Paso ${r.paso ?? '?'}/${r.pasos ?? '?'}
      </div>
      ${r.fin ? '<div style="color:#888;margin-top:4px">✓ Finalizado</div>' : ''}
    `;

    body.appendChild(output);
  }
};

