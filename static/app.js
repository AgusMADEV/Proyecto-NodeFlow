// ====== Módulo principal (ESM) ======

const centro    = document.getElementById("centro");
const mundo     = document.getElementById("mundo");
const edgesSvg  = document.getElementById("edges");
const toolsList = document.getElementById("tools-list");
const playBtn   = document.getElementById("play");
const delBtn    = document.getElementById("deleteNode");
const logEl     = document.getElementById("log");

const nodos  = [];      // {id,x,y,el,type,config}
const conexiones = [];  // {from,to,fromPort,pathBg,path,glow}
let nodoCounter = 1;
let TOOLS = [];
const frontModules = {};  // type -> módulo JS importado

// selección
let selectedNodeId = null;

// transform
let scale = 1, translateX = 0, translateY = 0;
function aplicarTransform(){ mundo.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function screenToWorld(x,y){
  const r=centro.getBoundingClientRect();
  return { x:(x-r.left-translateX)/scale, y:(y-r.top-translateY)/scale };
}
aplicarTransform();

function log(msg){
  const at=new Date().toLocaleTimeString();
  logEl.textContent = `[${at}] ${msg}\n` + logEl.textContent;
}

// -------------------- API para módulos front (puertos, etc.) --------------------
window.NODE_API = {
  rebuildOutPorts(nodeEl, ports){
    // ports: [{name,title,topPct}]
    nodeEl.querySelectorAll(".port.out").forEach(p=>p.remove());
    (ports || []).forEach(pdef=>{
      const p = document.createElement("div");
      p.className = "port out";
      p.dataset.port = pdef.name || "default";
      p.title = pdef.title || ("Salida: " + p.dataset.port);
      if(typeof pdef.topPct === "number") p.style.top = pdef.topPct + "%";
      nodeEl.appendChild(p);

      // IMPORTANT: Pointer Events (no mousedown)
      p.addEventListener("pointerdown",(e)=>{
        e.preventDefault();
        e.stopPropagation();
        iniciarConexionDesdeSalida(e, nodeEl, p);
      });
    });
  },
  rebuildInPorts(nodeEl, ports){
    // (opcional) por si lo necesitas en el futuro
    nodeEl.querySelectorAll(".port.in").forEach(p=>p.remove());
    (ports || []).forEach(pdef=>{
      const p = document.createElement("div");
      p.className = "port in";
      p.dataset.port = pdef.name || "in";
      p.title = pdef.title || "Entrada";
      if(typeof pdef.topPct === "number") p.style.top = pdef.topPct + "%";
      nodeEl.appendChild(p);
    });
  }
};

// -------------------- Selección / borrado --------------------
function setSelected(nodeId){
  selectedNodeId = nodeId;
  nodos.forEach(n=>{
    if(n.id === nodeId) n.el.classList.add("selected");
    else n.el.classList.remove("selected");
  });
}
function clearSelected(){ setSelected(null); }

function getSelectedNode(){
  if(!selectedNodeId) return null;
  return nodos.find(n=>n.id===selectedNodeId) || null;
}

function eliminarNodoSeleccionado(){
  const n = getSelectedNode();
  if(!n) return;

  const idx = nodos.indexOf(n);
  if(idx < 0) return;

  // borrar conexiones asociadas (y sus paths SVG)
  for(let i=conexiones.length-1; i>=0; i--){
    const c = conexiones[i];
    if(c.from===idx || c.to===idx){
      [c.pathBg, c.path, c.glow].forEach(el=> el && el.remove && el.remove());
      conexiones.splice(i,1);
    }
  }

  n.el.remove();
  nodos.splice(idx,1);

  // reindexar conexiones (porque guardas from/to por índice)
  conexiones.forEach(c=>{
    if(c.from > idx) c.from--;
    if(c.to   > idx) c.to--;
  });

  selectedNodeId = null;
  log("Nodo eliminado.");
}

delBtn?.addEventListener("click", eliminarNodoSeleccionado);
window.addEventListener("keydown",(e)=>{
  if(e.key === "Delete" || e.key === "Supr"){
    eliminarNodoSeleccionado();
  }
});

// click vacío para deseleccionar (si no estás conectando)
centro.addEventListener("pointerdown",(e)=>{
  if(conexionEnCurso) return;
  if(!e.target.closest("article.node")) clearSelected();
});

// -------------------- Tools: carga + UI compacta --------------------
(async function initTools(){
  const resp = await fetch("/api/tools").then(r=>r.json());
  TOOLS = resp.tools || [];
  if(!TOOLS.length){
    toolsList.innerHTML = '<div class="muted">No hay herramientas</div>';
    return;
  }
  toolsList.innerHTML = "";

  await Promise.all(TOOLS.map(async (t)=>{
    if(t.front_module){
      try{
        const mod = await import(t.front_module);
        if(mod?.default?.type === t.type){
          frontModules[t.type] = mod.default;
        }
      }catch(err){
        console.warn("Front module import failed:", t.type, err);
      }
    }
  }));

  // botones compactos: texto=label, tooltip=description
  TOOLS.forEach(t=>{
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.type = "button";
    btn.title = (t.description || "").trim();
    btn.textContent = (t.label || t.type || "Herramienta");
    btn.addEventListener("click", ()=> crearNodoTool(t));
    toolsList.appendChild(btn);
  });
})();

// -------------------- Crear nodos --------------------
function crearNodoBase(x, y, title){
  const el = document.createElement("article");
  el.className = "node";
  el.style.left = x + "px";
  el.style.top  = y + "px";
  el.innerHTML = `
    <div class="titlebar drag-handle"></div>
    <div class="title"></div>
    <div class="body"></div>
    <div class="port in"  title="Entrada"></div>
    <div class="port out" title="Salida"></div>
  `;
  el.querySelector(".title").textContent = title;
  mundo.appendChild(el);

  // selección: último clicado
  el.addEventListener("pointerdown",(e)=>{
    // no bloquear inputs/botones/select dentro del nodo
    const id = el.dataset.nodeId;
    if(id) setSelected(id);
  }, true);

  // conexiones: puerto salida por defecto (pointerdown)
  const defaultOut = el.querySelector(".port.out");
  defaultOut?.addEventListener("pointerdown",(e)=>{
    e.preventDefault();
    e.stopPropagation();
    iniciarConexionDesdeSalida(e, el, defaultOut);
  });

  return el;
}

function crearNodoTool(tool){
  const {x,y} = screenToWorld(140 + Math.random()*140, 140 + Math.random()*140);
  const el = crearNodoBase(x, y, tool.label || tool.type);

  const nodeId = "n" + (nodoCounter++);
  el.dataset.nodeId = nodeId;

  // cuerpo/config según módulo front (si existe)
  const mod = frontModules[tool.type];
  if(mod?.buildBody){
    mod.buildBody(el, tool, nodeId);
  }else{
    const body = el.querySelector(".body");
    body.innerHTML = `<div class="muted" style="font-size:12px">Sin UI de configuración.</div>`;
  }

  // si el front module ha creado puertos out extra, quita el out por defecto para no confundir
  const outs = el.querySelectorAll(".port.out");
  if(outs.length > 1){
    const first = outs[0];
    if(!first.dataset.port) first.remove();
  }

  // drag
  hacerDraggable(el);

  // registrar
  nodos.push({ id: nodeId, x, y, el, type: tool.type, config: {} });

  // seleccionar al crearlo
  setSelected(nodeId);
  actualizarConexiones();
}

// -------------------- Drag --------------------
function hacerDraggable(el){
  const handle = el.querySelector(".drag-handle") || el;
  let dragging=false, startX=0, startY=0, origX=0, origY=0;

  handle.addEventListener("pointerdown",(e)=>{
    if(conexionEnCurso) return;
    if(e.target.closest(".port")) return;
    if(e.target.closest("input,textarea,select,button")) return;

    dragging=true;
    handle.setPointerCapture(e.pointerId);
    startX=e.clientX; startY=e.clientY;
    origX=parseFloat(el.style.left||"0");
    origY=parseFloat(el.style.top||"0");
  });

  handle.addEventListener("pointermove",(e)=>{
    if(!dragging) return;
    const dx=(e.clientX-startX)/scale;
    const dy=(e.clientY-startY)/scale;
    el.style.left = (origX+dx) + "px";
    el.style.top  = (origY+dy) + "px";
    actualizarConexiones();
    if(conexionEnCurso) actualizarPreviewConexion(e);
  });

  handle.addEventListener("pointerup",()=>{ dragging=false; });
  handle.addEventListener("pointercancel",()=>{ dragging=false; });
}

// -------------------- Pan/Zoom --------------------
let panning=false, panStartX=0, panStartY=0, panOrigX=0, panOrigY=0;

centro.addEventListener("pointerdown",(e)=>{
  if(!e.ctrlKey) return;
  if(conexionEnCurso) return;
  panning=true;
  centro.setPointerCapture(e.pointerId);
  panStartX=e.clientX; panStartY=e.clientY;
  panOrigX=translateX; panOrigY=translateY;
});
centro.addEventListener("pointermove",(e)=>{
  if(panning){
    translateX = panOrigX + (e.clientX-panStartX);
    translateY = panOrigY + (e.clientY-panStartY);
    aplicarTransform();
    actualizarConexiones();
    if(conexionEnCurso) actualizarPreviewConexion(e);
  }
});
centro.addEventListener("pointerup",()=>{ panning=false; });
centro.addEventListener("pointercancel",()=>{ panning=false; });

centro.addEventListener("wheel",(e)=>{
  if(!e.ctrlKey) return;
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  const factor = (delta>0) ? 0.92 : 1.08;

  const oldScale = scale;
  scale = clamp(scale*factor, 0.25, 2.5);

  // zoom hacia el cursor (suave, sin ser perfecto)
  const rect = centro.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  translateX = cx - (cx - translateX) * (scale/oldScale);
  translateY = cy - (cy - translateY) * (scale/oldScale);

  aplicarTransform();
  actualizarConexiones();
},{passive:false});

// -------------------- Conexiones --------------------
function getPortCenterWorld(portEl){
  const pr = portEl.getBoundingClientRect();
  const cr = centro.getBoundingClientRect();
  const x = (pr.left + pr.width/2 - cr.left - translateX)/scale;
  const y = (pr.top  + pr.height/2- cr.top  - translateY)/scale;
  return {x,y};
}

function drawPaths(con, x1,y1,x2,y2){
  const dx = Math.max(80, Math.abs(x2-x1)*0.5);
  const d = `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;

  if(!con.pathBg){
    con.pathBg = document.createElementNS("http://www.w3.org/2000/svg","path");
    con.pathBg.classList.add("edge-path","bg");
    edgesSvg.appendChild(con.pathBg);

    con.glow = document.createElementNS("http://www.w3.org/2000/svg","path");
    con.glow.classList.add("edge-path","glow");
    edgesSvg.appendChild(con.glow);

    con.path = document.createElementNS("http://www.w3.org/2000/svg","path");
    con.path.classList.add("edge-path");
    edgesSvg.appendChild(con.path);
  }

  con.pathBg.setAttribute("d", d);
  con.glow.setAttribute("d", d);
  con.path.setAttribute("d", d);
}

function actualizarConexiones(){
  conexiones.forEach(con=>{
    const fromEl = nodos[con.from]?.el;
    const toEl   = nodos[con.to]?.el;
    if(!fromEl || !toEl) return;

    const out =
      fromEl.querySelector(`.port.out[data-port="${con.fromPort}"]`) ||
      fromEl.querySelector(".port.out");

    const inn = toEl.querySelector(".port.in");
    if(!out || !inn) return;

    const a = getPortCenterWorld(out);
    const b = getPortCenterWorld(inn);
    drawPaths(con, a.x,a.y,b.x,b.y);
  });
}

// ---- Conectar arrastrando desde salida a entrada (con preview)
let conexionEnCurso = null; // { fromIdx, fromPort, fromPortEl, preview:{bg,glow,path} }

function crearPreviewPaths(){
  const mk = (cls)=>{
    const p = document.createElementNS("http://www.w3.org/2000/svg","path");
    p.classList.add("edge-path", ...cls);
    edgesSvg.appendChild(p);
    return p;
  };
  return {
    bg: mk(["bg","preview"]),
    glow: mk(["glow","preview"]),
    path: mk(["preview"])
  };
}

function borrarPreview(pre){
  if(!pre) return;
  pre.bg?.remove(); pre.glow?.remove(); pre.path?.remove();
}

function drawPreview(pre, x1,y1,x2,y2){
  const dx = Math.max(80, Math.abs(x2-x1)*0.5);
  const d = `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
  pre.bg.setAttribute("d", d);
  pre.glow.setAttribute("d", d);
  pre.path.setAttribute("d", d);
}

function iniciarConexionDesdeSalida(e, nodeEl, portEl){
  const fromId = nodeEl.dataset.nodeId;
  const fromIdx = nodos.findIndex(n=>n.id===fromId);
  if(fromIdx < 0) return;

  const fromPort = portEl.dataset.port || "default";
  conexionEnCurso = {
    fromIdx,
    fromPort,
    fromPortEl: portEl,
    preview: crearPreviewPaths()
  };

  // capturar el puntero en el canvas para recibir move/up
  centro.setPointerCapture?.(e.pointerId);

  // highlight entradas
  document.querySelectorAll(".port.in").forEach(p=>p.classList.add("highlight"));

  // dibujar preview inicial
  actualizarPreviewConexion(e);
}

function actualizarPreviewConexion(e){
  if(!conexionEnCurso) return;
  const a = getPortCenterWorld(conexionEnCurso.fromPortEl);
  const pt = screenToWorld(e.clientX, e.clientY);
  drawPreview(conexionEnCurso.preview, a.x,a.y, pt.x,pt.y);
}

centro.addEventListener("pointermove",(e)=>{
  if(!conexionEnCurso) return;
  actualizarPreviewConexion(e);
});

centro.addEventListener("pointerup", (e) => {
  if (!conexionEnCurso) return;

  document.querySelectorAll(".port.in")
    .forEach(p => p.classList.remove("highlight"));

  // 👇 IMPORTANT FIX
  const elUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
  const targetIn = elUnderCursor?.closest(".port.in");

  if (!targetIn) {
    borrarPreview(conexionEnCurso.preview);
    conexionEnCurso = null;
    return;
  }

  const toNodeEl = targetIn.closest("article.node");
  const toId = toNodeEl?.dataset?.nodeId;
  const toIdx = nodos.findIndex(n => n.id === toId);

  if (toIdx < 0 || toIdx === conexionEnCurso.fromIdx) {
    borrarPreview(conexionEnCurso.preview);
    conexionEnCurso = null;
    return;
  }

  conexiones.push({
    from: conexionEnCurso.fromIdx,
    to: toIdx,
    fromPort: conexionEnCurso.fromPort,
    pathBg: null,
    path: null,
    glow: null
  });

  borrarPreview(conexionEnCurso.preview);
  conexionEnCurso = null;

  actualizarConexiones();
});


centro.addEventListener("pointercancel",()=>{
  if(!conexionEnCurso) return;
  document.querySelectorAll(".port.in").forEach(p=>p.classList.remove("highlight"));
  borrarPreview(conexionEnCurso.preview);
  conexionEnCurso = null;
});

// -------------------- Ejecutar grafo --------------------
playBtn.addEventListener("click", async ()=>{
  // limpiar renders anteriores
  nodos.forEach(n=>{
    const body = n.el.querySelector(".body");
    body.querySelectorAll(".run-output").forEach(x=>x.remove());
  });

  // leer config desde módulos front
  nodos.forEach(n=>{
    const mod = frontModules[n.type];
    if(mod?.readConfig){
      n.config = mod.readConfig(n.el) || {};
    }else{
      n.config = {};
      const inputs = n.el.querySelectorAll(".body input, .body textarea, .body select");
      inputs.forEach(inp=>{
        const key = (inp.name || inp.id || "").trim();
        if(!key) return;
        n.config[key] = (inp.value ?? "").toString().trim();
      });
    }
  });

  const nodesPayload = nodos.map(n=>({ id:n.id, type:n.type, config:n.config }));
  const edgesPayload = conexiones.map(c=>({
    from: nodos[c.from].id,
    to:   nodos[c.to].id,
    from_port: c.fromPort || "default"
  }));

  log("Ejecutando grafo…");
  const res = await fetch("/api/execute", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ nodes: nodesPayload, edges: edgesPayload })
  }).then(r=>r.json()).catch(err=>({error:String(err)}));

  if(res.error){ log("ERROR: "+res.error); return; }

  const results = res.results || {};
  Object.entries(results).forEach(([nid, r])=>{
    const node = nodos.find(n=>n.id===nid);
    if(!node) return;

    if(r.ok){
      log(`✔ ${node.type} (${nid}) OK`);

      const mod = frontModules[node.type];
      if(mod?.renderResult){
        mod.renderResult(node.el, r.data);
      }else{
        const body = node.el.querySelector(".body");
        const pre = document.createElement("pre");
        pre.className = "run-output";
        pre.textContent = JSON.stringify(r.data, null, 2).slice(0, 1000);
        body.appendChild(pre);
      }

      if(node.type === "imprimir"){
        const s = r?.data?.text;
        if(typeof s === "string") log(`🖨 ${s}`);
      }

    }else{
      log(`✖ ${node.type} (${nid}) ERROR: ${r.error}`);
    }
  });
});

