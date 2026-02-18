export default {
  type: "var_get",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defN = toolSpec?.config?.name?.default ?? "x";
    const defD = toolSpec?.config?.default?.default ?? "";
    body.innerHTML = `
      <div class="form-row">
        <label for="name_${nodeId}">Nombre de variable</label>
        <input id="name_${nodeId}" type="text" value="${defN}" placeholder="x">
      </div>
      <div class="form-row">
        <label for="default_${nodeId}">Valor por defecto</label>
        <input id="default_${nodeId}" type="text" value="${defD}" placeholder="">
      </div>
    `;
  },
  readConfig(el){
    const inputs = el.querySelectorAll(".body input");
    const name = inputs?.[0]?.value?.trim() || "x";
    const def  = inputs?.[1]?.value ?? "";
    return { name, default: def };
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const d = document.createElement("div");
    d.style.font="12px ui-monospace";
    d.style.marginTop="6px";
    d.textContent = `→ ${data?.name}: ${String(data?.value)}`;
    body.appendChild(d);
  }
};

