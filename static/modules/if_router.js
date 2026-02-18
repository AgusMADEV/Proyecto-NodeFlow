// static/modules/if_router.js
export default {
  type: "if_router",

  buildBody(el) {
    const body = el.querySelector(".body");
    body.innerHTML = `
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M12 19V5M5 12l7 7 7-7"/>
        </svg>
        Entradas: <code>cond</code> (bool) y <code>payload</code><br>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        Salidas: <code>true</code> y <code>false</code>
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
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const result = data?.result === true;
    output.innerHTML = `
      <div style="color:${result ? '#4ade80' : '#f48771'};font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${result ? '3' : '2.5'}" style="vertical-align:-1px;margin-right:4px;">
          ${result ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
        </svg>
        Condición: ${result ? 'true' : 'false'}
      </div>
    `;

    body.appendChild(output);
  }
};

