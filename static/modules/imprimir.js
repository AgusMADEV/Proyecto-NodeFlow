export default {
  type: "imprimir",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.prefix?.default ?? "";
    body.innerHTML = `
      <div class="form-row">
        <label for="prefix_${nodeId}">Prefijo</label>
        <input id="prefix_${nodeId}" type="text" value="${def}" placeholder="ej: Resultado">
      </div>
      <div class="muted" style="font-size:11px">Imprime el input0 en la consola del editor.</div>
    `;
  },
  readConfig(el){
    const prefix = el.querySelector(".body input")?.value ?? "";
    return { prefix };
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const d = document.createElement("div");
    d.style.font="12px ui-monospace";
    d.style.marginTop="6px";
    d.textContent = `🖨 ${data?.message ?? ""}`;
    body.appendChild(d);
  }
};

