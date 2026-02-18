import { openFolderPicker } from "/static/modules/folderpicker.js";

export default {
  type: "copiarencarpeta",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    body.innerHTML = `
      <div class="form-row">
        <label for="dest_${nodeId}">Carpeta destino</label>
        <div style="display:flex; gap:6px;">
          <input id="dest_${nodeId}" type="text" value="" placeholder="p. ej.: /tmp/salida" style="flex:1">
          <button type="button" class="btn btn-browse">Examinar…</button>
        </div>
      </div>
      <div class="muted" style="font-size:11px">Conecta un nodo anterior que devuelva una lista de ficheros.</div>
    `;
    body.querySelector(".btn-browse").addEventListener("click", async ()=>{
      const current = body.querySelector("input").value.trim();
      const chosen = await openFolderPicker(current);
      if (chosen) body.querySelector("input").value = chosen;
    });
  },

  readConfig(el) {
    const dest = el.querySelector(".body input")?.value?.trim() || "";
    return { dest };
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const div = document.createElement("div");
    div.style.font = "12px ui-monospace";
    div.style.marginTop = "6px";
    const skippedCount = (data.skipped || []).length;
    div.textContent = `Copiados: ${data.copied} → ${data.dest}` + (skippedCount ? ` | Omitidos: ${skippedCount}` : "");
    body.appendChild(div);
  }
};

