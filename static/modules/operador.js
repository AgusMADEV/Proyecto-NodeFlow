export default {
  type: "operador",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defOp = toolSpec?.config?.op?.default ?? "+";
    const defB  = toolSpec?.config?.b?.default ?? "0";
    body.innerHTML = `
      <div class="form-row">
        <label for="op_${nodeId}">Operador</label>
        <select id="op_${nodeId}">
          ${["+","-","*","/","%","==","!=","<",">","<=",">="].map(o=>`<option value="${o}" ${o===defOp?"selected":""}>${o}</option>`).join("")}
        </select>
      </div>
      <div class="form-row">
        <label for="b_${nodeId}">B (si no hay input1)</label>
        <input id="b_${nodeId}" type="text" value="${defB}" placeholder="0">
      </div>
      <div class="muted" style="font-size:11px">Entradas: A=input0, B=input1 (si existe) o constante.</div>
    `;
  },
  readConfig(el){
    const op = el.querySelector(".body select")?.value || "+";
    const b  = el.querySelectorAll(".body input")?.[0]?.value ?? "0";
    return { op, b };
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const d = document.createElement("div");
    d.style.font="12px ui-monospace";
    d.style.marginTop="6px";
    if(data?.type === "error"){
      d.className = "status-bad";
      d.textContent = `✖ ${data?.error || "Error"}`;
    }else{
      d.textContent = `→ ${String(data?.value)}`;
    }
    body.appendChild(d);
  }
};

