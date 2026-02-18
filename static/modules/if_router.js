// static/modules/if_router.js
export default {
  type: "if_router",

  buildBody(el) {
    const body = el.querySelector(".body");
    body.innerHTML = `
      <div style="margin-top:6px;font-size:10px;color:#888;line-height:1.4">
        📥 Entradas: <code>cond</code> (bool) y <code>payload</code><br>
        📤 Salidas: <code>true</code> y <code>false</code>
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
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#1e1e1e;border-radius:4px;font-size:11px";

    const result = data?.result === true;
    output.innerHTML = `
      <div style="color:${result ? '#4ec9b0' : '#f48771'};font-weight:600">
        Condición: ${result ? '✓ true' : '✗ false'}
      </div>
    `;

    body.appendChild(output);
  }
};

