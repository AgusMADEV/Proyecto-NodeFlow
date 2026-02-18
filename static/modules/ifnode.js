export default {
  type: "ifnode",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Expresión (usa <code>x</code>)</label>
      <input id="expr_${nodeId}" name="expr" value="bool(x)" />
      <div class="muted">Ej.: <code>x &gt; 10</code>, <code>'ok' in str(x)</code></div>
    `;

    // puertos: true/false
    window.NODE_API?.rebuildOutPorts?.(el, [
      { name:"true",  title:"Salida (true)",  topPct:35 },
      { name:"false", title:"Salida (false)", topPct:65 }
    ]);
  },

  readConfig(el){
    const inp = el.querySelector('input[name="expr"]');
    return { expr: (inp?.value || "bool(x)").trim() };
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const pre = document.createElement("pre");
    pre.className = "run-output";
    pre.textContent = JSON.stringify(data, null, 2).slice(0, 1000);
    body.appendChild(pre);
  }
};

