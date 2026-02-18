export default {
  type: "constante",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Nombre (opcional)</label>
      <input id="name_${nodeId}" name="name" placeholder="PI, IVA, etc." value="" />

      <label style="font:600 12px system-ui;opacity:.8">Valor</label>
      <input id="value_${nodeId}" name="value" placeholder="texto o número" value="1" />
    `;

    const titleEl = el.querySelector(".title");
    const nameEl = body.querySelector('input[name="name"]');
    const valueEl = body.querySelector('input[name="value"]');

    const refreshTitle = ()=>{
      const n = (nameEl.value || "").trim();
      const v = (valueEl.value || "").trim() || "¿?";
      titleEl.textContent = n ? `Constante ${n} = ${v}` : `Constante = ${v}`;
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

