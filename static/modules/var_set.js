export default {
  type: "var_set",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Variable</label>
      <input id="name_${nodeId}" name="name" placeholder="nombre" value="x" />

      <label style="font:600 12px system-ui;opacity:.8">Valor inicial (opcional)</label>
      <input id="value_${nodeId}" name="value" placeholder="(vacío = usar entrada si llega)" value="" />

      <div class="muted">Si llega una entrada al nodo, se usa como valor. Si no, se usa “Valor inicial”.</div>
    `;

    const titleEl = el.querySelector(".title");
    const nameEl = body.querySelector('input[name="name"]');
    const valueEl = body.querySelector('input[name="value"]');

    const refreshTitle = ()=>{
      const n = (nameEl.value || "").trim() || "¿?";
      const v = (valueEl.value || "").trim();
      titleEl.textContent = v ? `Asignar ${n} = ${v}` : `Asignar ${n}`;
    };

    nameEl.addEventListener("input", refreshTitle);
    valueEl.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const name = (el.querySelector('input[name="name"]')?.value || "").trim();
    const value = (el.querySelector('input[name="value"]')?.value || "").trim();
    return { name, value };
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const pre = document.createElement("pre");
    pre.className = "run-output";
    pre.textContent = JSON.stringify(data, null, 2).slice(0, 1000);
    body.appendChild(pre);
  }
};

