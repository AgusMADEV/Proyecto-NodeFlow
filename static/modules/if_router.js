// static/modules/if_router.js
export default {
  type: "if_router",

  buildBody(el) {
    const body = el.querySelector(".body");
    body.innerHTML = `
      <div class="muted" style="font-size:12px">
        Entradas: <code>cond</code> (bool) y <code>payload</code> (cualquier dato).<br>
        Salidas: <code>true</code> y <code>false</code>.
      </div>
    `;

    window.NODE_API?.rebuildOutPorts?.(el, [
      { name: "true",  title: "Salida TRUE",  topPct: 35 },
      { name: "false", title: "Salida FALSE", topPct: 65 },
    ]);
  },

  readConfig(){ return {}; },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const pre = document.createElement("div");
    pre.className = "run-output";
    pre.style.font="12px ui-monospace";
    pre.textContent = `condición: ${data?.result === true ? "true" : "false"}`;
    body.appendChild(pre);
  }
};

