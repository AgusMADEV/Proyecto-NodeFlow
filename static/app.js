// ====== Módulo principal (ESM) ======

const centro    = document.getElementById("centro");
const mundo     = document.getElementById("mundo");
const edgesSvg  = document.getElementById("edges");
const toolsList = document.getElementById("tools-list");
const playBtn   = document.getElementById("play");
const delBtn    = document.getElementById("deleteNode");
const saveBtn   = document.getElementById("saveBtn");
const loadBtn   = document.getElementById("loadBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const newBtn    = document.getElementById("newBtn");
const logEl     = document.getElementById("log");

const nodos  = [];      // {id,x,y,el,type,config}
const conexiones = [];  // {from,to,fromPort,pathBg,path,glow}
let nodoCounter = 1;
let TOOLS = [];
const frontModules = {};  // type -> módulo JS importado

// selección
let selectedNodeId = null;

// ==================== UNDO/REDO ====================
const undoStack = [];  // historial de estados previos
const redoStack = [];  // estados para rehacer
const MAX_HISTORY = 50;  // máximo de estados guardados
let isRestoring = false;  // flag para evitar guardar durante restauración

// ==================== COPY/PASTE ====================
let clipboard = null;  // {type, config, x, y}

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

  // Guardar estado antes de eliminar
  saveState();

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
  // Ctrl+S para guardar
  if(e.ctrlKey && e.key === "s"){
    e.preventDefault();
    saveBtn?.click();
  }
  // Ctrl+K o / para buscar herramientas
  if((e.ctrlKey && e.key === "k") || (e.key === "/" && !e.target.matches('input, textarea'))){
    e.preventDefault();
    const searchInput = document.getElementById("tools-search");
    if(searchInput){
      searchInput.focus();
      searchInput.select();
    }
  }
  // Ctrl+Z para deshacer
  if(e.ctrlKey && e.key === "z" && !e.shiftKey){
    e.preventDefault();
    undo();
  }
  // Ctrl+Y o Ctrl+Shift+Z para rehacer
  if((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "Z")){
    e.preventDefault();
    redo();
  }
  // Ctrl+C para copiar
  if(e.ctrlKey && e.key === "c"){
    const target = e.target;
    // Solo interceptar si no estamos en un input/textarea
    if(!target.matches('input, textarea')){
      e.preventDefault();
      copyNode();
    }
  }
  // Ctrl+V para pegar
  if(e.ctrlKey && e.key === "v"){
    const target = e.target;
    // Solo interceptar si no estamos en un input/textarea
    if(!target.matches('input, textarea')){
      e.preventDefault();
      pasteNode();
    }
  }
});

// -------------------- Event Listeners para Persistencia --------------------
saveBtn?.addEventListener("click", async () => {
  const name = prompt("Nombre del workflow:", currentWorkflowName || "mi-workflow");
  if (name) {
    const success = await saveWorkflow(name);
    if (success) currentWorkflowName = name;
  }
});

loadBtn?.addEventListener("click", async () => {
  const workflows = await listWorkflows();
  if (workflows.length === 0) {
    alert("No hay workflows guardados");
    return;
  }

  let message = "Workflows disponibles:\n\n";
  workflows.forEach((w, i) => {
    message += `${i + 1}. ${w.name} (${w.node_count} nodos, ${w.edge_count} conexiones)\n`;
  });
  message += "\nIngrese el número o nombre del workflow a cargar:";

  const input = prompt(message);
  if (!input) return;

  const num = parseInt(input);
  let name;
  if (!isNaN(num) && num > 0 && num <= workflows.length) {
    name = workflows[num - 1].name;
  } else {
    name = input;
  }

  await loadWorkflow(name);
});

exportBtn?.addEventListener("click", () => {
  exportWorkflow();
});

importBtn?.addEventListener("click", () => {
  importWorkflow();
});

newBtn?.addEventListener("click", () => {
  if (nodos.length > 0) {
    if (!confirm("¿Crear nuevo workflow? Se perderá el trabajo actual si no está guardado.")) {
      return;
    }
  }
  clearWorkflow();
  currentWorkflowName = null;
  logEl.textContent = "";  // Limpiar la consola
  log("Workspace limpiado");
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

  // SVG Icons para categorías
  const categoryIcons = {
    data: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    variables: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8"/></svg>',
    logic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/><path d="M12 22V12M12 12L3 7M12 12l9-5"/></svg>',
    operators: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>',
    files: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    other: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };

  const chevronIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';

  // Categorizar herramientas
  const categories = {
    data: { title: "Datos", icon: categoryIcons.data, tools: [] },
    variables: { title: "Variables", icon: categoryIcons.variables, tools: [] },
    logic: { title: "Lógica", icon: categoryIcons.logic, tools: [] },
    operators: { title: "Operadores", icon: categoryIcons.operators, tools: [] },
    files: { title: "Archivos", icon: categoryIcons.files, tools: [] },
    other: { title: "Otros", icon: categoryIcons.other, tools: [] }
  };

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

  // Clasificar herramientas por categoría
  TOOLS.forEach(t => {
    const type = t.type.toLowerCase();
    const label = (t.label || "").toLowerCase();
    
    if (type.includes('csv') || type.includes('leer') || type.includes('escribir') || 
        type.includes('filtrar') || type.includes('mapear') || type.includes('extraer')) {
      categories.data.tools.push(t);
    } else if (type.includes('var_') || label.includes('variable')) {
      categories.variables.tools.push(t);
    } else if (type.includes('if') || type.includes('while') || type.includes('sequence') || 
               type.includes('router')) {
      categories.logic.tools.push(t);
    } else if (type.includes('operador') || type.includes('cmp_') || type.includes('comparar') || 
               type.includes('constante')) {
      categories.operators.tools.push(t);
    } else if (type.includes('carpeta') || type.includes('copiar') || type.includes('listar')) {
      categories.files.tools.push(t);
    } else {
      categories.other.tools.push(t);
    }
  });

  // Crear UI por categorías
  Object.entries(categories).forEach(([key, cat]) => {
    if (cat.tools.length === 0) return;

    const categoryDiv = document.createElement("div");
    categoryDiv.className = "tool-category";
    categoryDiv.dataset.category = key;

    const header = document.createElement("div");
    header.className = "tool-category-header";
    header.innerHTML = `
      <span class="tool-category-title">
        ${cat.icon}
        ${cat.title}
        <span class="tool-category-count">${cat.tools.length}</span>
      </span>
      <span class="tool-category-icon">${chevronIcon}</span>
    `;

    const itemsDiv = document.createElement("div");
    itemsDiv.className = "tool-category-items";

    cat.tools.forEach(t => {
      const btn = document.createElement("button");
      btn.className = "tool-btn";
      btn.type = "button";
      btn.title = (t.description || "").trim();
      
      // Label con badge para nodos nuevos
      const isNew = ['leer_csv', 'escribir_csv', 'filtrar', 'mapear', 'extraer_campo'].includes(t.type);
      const labelText = (t.label || t.type || "Herramienta");
      btn.innerHTML = isNew 
        ? `${labelText}<span class="tool-btn-badge">Nuevo</span>` 
        : labelText;
      
      btn.dataset.toolType = t.type;
      btn.dataset.toolLabel = (t.label || "").toLowerCase();
      btn.addEventListener("click", () => crearNodoTool(t));
      itemsDiv.appendChild(btn);
    });

    // Toggle categoría
    header.addEventListener("click", () => {
      header.classList.toggle("collapsed");
      itemsDiv.classList.toggle("collapsed");
    });

    categoryDiv.appendChild(header);
    categoryDiv.appendChild(itemsDiv);
    toolsList.appendChild(categoryDiv);
  });

  // Búsqueda de herramientas
  const searchInput = document.getElementById("tools-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      document.querySelectorAll(".tool-btn").forEach(btn => {
        const label = btn.dataset.toolLabel || "";
        const type = btn.dataset.toolType || "";
        const matches = label.includes(query) || type.includes(query);
        
        if (matches || query === "") {
          btn.classList.remove("hidden");
        } else {
          btn.classList.add("hidden");
        }
      });

      // Mostrar/ocultar categorías vacías
      document.querySelectorAll(".tool-category").forEach(cat => {
        const visibleTools = cat.querySelectorAll(".tool-btn:not(.hidden)").length;
        if (visibleTools > 0) {
          cat.style.display = "block";
          // Expandir automáticamente si hay búsqueda activa
          if (query) {
            cat.querySelector(".tool-category-header").classList.remove("collapsed");
            cat.querySelector(".tool-category-items").classList.remove("collapsed");
          }
        } else {
          cat.style.display = "none";
        }
      });
    });
  }

  // Toggle todas las categorías
  const toggleAllBtn = document.getElementById("toggle-all-categories");
  if (toggleAllBtn) {
    let allCollapsed = false;
    const expandIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 13l5 5 5-5M7 7l5 5 5-5"/></svg>';
    const collapseIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 11l-5-5-5 5M17 17l-5-5-5 5"/></svg>';
    
    toggleAllBtn.addEventListener("click", () => {
      allCollapsed = !allCollapsed;
      document.querySelectorAll(".tool-category-header").forEach(header => {
        const items = header.nextElementSibling;
        if (allCollapsed) {
          header.classList.add("collapsed");
          items.classList.add("collapsed");
        } else {
          header.classList.remove("collapsed");
          items.classList.remove("collapsed");
        }
      });
      toggleAllBtn.innerHTML = allCollapsed ? expandIcon : collapseIcon;
      toggleAllBtn.title = allCollapsed ? "Expandir todas" : "Colapsar todas";
    });
  }
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
  // Guardar estado antes de crear nodo
  saveState();

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
  let dragging=false, startX=0, startY=0, origX=0, origY=0, hasMoved=false;

  handle.addEventListener("pointerdown",(e)=>{
    if(conexionEnCurso) return;
    if(e.target.closest(".port")) return;
    if(e.target.closest("input,textarea,select,button")) return;

    dragging=true;
    hasMoved=false;
    handle.setPointerCapture(e.pointerId);
    startX=e.clientX; startY=e.clientY;
    origX=parseFloat(el.style.left||"0");
    origY=parseFloat(el.style.top||"0");
    
    // Guardar estado ANTES de mover el nodo
    saveState();
  });

  handle.addEventListener("pointermove",(e)=>{
    if(!dragging) return;
    hasMoved=true;
    const dx=(e.clientX-startX)/scale;
    const dy=(e.clientY-startY)/scale;
    el.style.left = (origX+dx) + "px";
    el.style.top  = (origY+dy) + "px";
    actualizarConexiones();
    if(conexionEnCurso) actualizarPreviewConexion(e);
  });

  handle.addEventListener("pointerup",()=>{ 
    dragging=false; 
  });
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

  // Guardar estado antes de crear conexión
  saveState();

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
      log(`[OK] ${node.type} (${nid})`);

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
        if(typeof s === "string") log(`[PRINT] ${s}`);
      }

    }else{
      log(`[ERROR] ${node.type} (${nid}): ${r.error}`);
    }
  });
});

// ==================== PERSISTENCIA DE WORKFLOWS ====================

/**
 * Serializa el estado actual (nodos + conexiones) a un objeto JSON
 */
function serializeWorkflow() {
  const nodes = nodos.map(n => ({
    id: n.id,
    x: parseFloat(n.el.style.left || "0"),
    y: parseFloat(n.el.style.top || "0"),
    type: n.type,
    config: n.config || {}
  }));

  const edges = conexiones.map(c => ({
    from: nodos[c.from]?.id,
    to: nodos[c.to]?.id,
    from_port: c.fromPort || "default"
  })).filter(e => e.from && e.to);

  return {
    nodes,
    edges,
    viewport: {
      scale,
      translateX,
      translateY
    }
  };
}

/**
 * Carga un workflow desde un objeto JSON
 */
async function deserializeWorkflow(data) {
  // Detectar si estamos en modo undo/redo
  const wasRestoring = isRestoring;
  
  // Marcar que estamos restaurando para no guardar en el historial
  isRestoring = true;
  
  // Limpiar estado actual (preservar historial solo si viene de undo/redo)
  clearWorkflow(wasRestoring);

  // Restaurar viewport
  if (data.viewport) {
    scale = data.viewport.scale || 1;
    translateX = data.viewport.translateX || 0;
    translateY = data.viewport.translateY || 0;
    aplicarTransform();
  }

  // Restaurar nodos
  const nodeIdMap = {}; // viejo ID -> nuevo índice
  for (const nodeData of (data.nodes || [])) {
    const tool = TOOLS.find(t => t.type === nodeData.type);
    if (!tool) {
      log(`[WARN] Herramienta '${nodeData.type}' no encontrada, omitiendo nodo`);
      continue;
    }

    const el = crearNodoBase(nodeData.x, nodeData.y, tool.label || tool.type);
    const nodeId = nodeData.id || ("n" + nodoCounter++);
    el.dataset.nodeId = nodeId;

    // Aplicar configuración
    const mod = frontModules[tool.type];
    if (mod?.buildBody) {
      mod.buildBody(el, tool, nodeId);
      // Restaurar valores de config
      if (nodeData.config) {
        Object.entries(nodeData.config).forEach(([key, value]) => {
          const input = el.querySelector(`[data-config-key="${key}"]`);
          if (input) {
            if (input.type === "checkbox") {
              input.checked = !!value;
            } else {
              input.value = value;
            }
          }
        });
      }
    } else {
      const body = el.querySelector(".body");
      body.innerHTML = `<div class="muted" style="font-size:12px">Sin UI de configuración.</div>`;
    }

    // Quitar puerto out por defecto si hay múltiples
    const outs = el.querySelectorAll(".port.out");
    if (outs.length > 1 && !outs[0].dataset.port) {
      outs[0].remove();
    }

    hacerDraggable(el);

    const newIdx = nodos.length;
    nodos.push({ id: nodeId, x: nodeData.x, y: nodeData.y, el, type: tool.type, config: nodeData.config || {} });
    nodeIdMap[nodeData.id] = newIdx;
  }

  // Restaurar conexiones
  for (const edgeData of (data.edges || [])) {
    const fromNode = nodos.find(n => n.id === edgeData.from);
    const toNode = nodos.find(n => n.id === edgeData.to);

    if (!fromNode || !toNode) continue;

    const fromIdx = nodos.indexOf(fromNode);
    const toIdx = nodos.indexOf(toNode);

    conexiones.push({
      from: fromIdx,
      to: toIdx,
      fromPort: edgeData.from_port || "default",
      pathBg: null,
      path: null,
      glow: null
    });
  }

  actualizarConexiones();
  log("Workflow cargado exitosamente");
  
  isRestoring = false;
}

/**
 * Limpia el workspace completamente
 */
function clearWorkflow(preserveHistory = false) {
  // Eliminar todos los nodos del DOM
  nodos.forEach(n => n.el.remove());
  nodos.length = 0;

  // Eliminar todas las conexiones SVG
  conexiones.forEach(c => {
    [c.pathBg, c.path, c.glow].forEach(el => el && el.remove && el.remove());
  });
  conexiones.length = 0;

  selectedNodeId = null;
  nodoCounter = 1;

  // Limpiar outputs
  document.querySelectorAll(".run-output").forEach(el => el.remove());
  
  // Limpiar historial solo si no estamos restaurando
  if (!preserveHistory) {
    undoStack.length = 0;
    redoStack.length = 0;
  }
}

/**
 * Guarda el workflow actual en el servidor
 */
async function saveWorkflow(name) {
  if (!name || !name.trim()) {
    log("[ERROR] Nombre de workflow requerido");
    return false;
  }

  const data = serializeWorkflow();
  
  try {
    const res = await fetch(`/api/workflows/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(r => r.json());

    if (res.ok) {
      log(`[SAVED] Workflow '${name}' guardado`);
      return true;
    } else {
      log(`[ERROR] Guardando: ${res.error}`);
      return false;
    }
  } catch (error) {
    log(`[ERROR] ${error.message}`);
    return false;
  }
}

/**
 * Carga un workflow desde el servidor
 */
async function loadWorkflow(name) {
  if (!name || !name.trim()) {
    log("[ERROR] Nombre de workflow requerido");
    return false;
  }

  try {
    const res = await fetch(`/api/workflows/${encodeURIComponent(name)}`).then(r => r.json());

    if (res.error) {
      log(`[ERROR] Cargando: ${res.error}`);
      return false;
    }

    await deserializeWorkflow(res);
    currentWorkflowName = name;
    return true;
  } catch (error) {
    log(`[ERROR] ${error.message}`);
    return false;
  }
}

/**
 * Lista workflows disponibles
 */
async function listWorkflows() {
  try {
    const res = await fetch("/api/workflows").then(r => r.json());
    return res.workflows || [];
  } catch (error) {
    log(`[ERROR] Listando workflows: ${error.message}`);
    return [];
  }
}

/**
 * Exporta el workflow actual como archivo JSON
 */
function exportWorkflow() {
  const data = serializeWorkflow();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workflow-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  log("[EXPORTED] Workflow exportado");
}

/**
 * Importa un workflow desde archivo JSON
 */
function importWorkflow() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await deserializeWorkflow(data);
      currentWorkflowName = null; // imported, not saved yet
    } catch (error) {
      log(`[ERROR] Importando: ${error.message}`);
    }
  };
  input.click();
}

// Variable para trackear el workflow actual
let currentWorkflowName = null;

// ==================== FUNCIONES DE UNDO/REDO ====================

/**
 * Guarda el estado actual del workflow en el historial
 */
function saveState() {
  // No guardar si estamos restaurando
  if (isRestoring) return;

  const state = serializeWorkflow();
  undoStack.push(JSON.stringify(state));

  // Limitar tamaño del historial
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }

  // Limpiar redo stack cuando se hace una nueva acción
  redoStack.length = 0;
}

/**
 * Deshace la última acción
 */
async function undo() {
  if (undoStack.length === 0) {
    log("[UNDO] No hay acciones para deshacer");
    return;
  }

  // Guardar estado actual en redo stack
  const currentState = serializeWorkflow();
  redoStack.push(JSON.stringify(currentState));

  // Restaurar estado anterior
  const previousState = undoStack.pop();
  const data = JSON.parse(previousState);

  isRestoring = true;
  await deserializeWorkflow(data);
  isRestoring = false;

  log("[UNDO] Deshecho");
}

/**
 * Rehace la última acción deshecha
 */
async function redo() {
  if (redoStack.length === 0) {
    log("[REDO] No hay acciones para rehacer");
    return;
  }

  // Guardar estado actual en undo stack
  const currentState = serializeWorkflow();
  undoStack.push(JSON.stringify(currentState));

  // Restaurar estado siguiente
  const nextState = redoStack.pop();
  const data = JSON.parse(nextState);

  isRestoring = true;
  await deserializeWorkflow(data);
  isRestoring = false;

  log("[REDO] Rehecho");
}

// ==================== FUNCIONES DE COPY/PASTE ====================

/**
 * Copia el nodo seleccionado al portapapeles
 */
function copyNode() {
  const node = getSelectedNode();
  if (!node) {
    log("[COPY] No hay nodo seleccionado");
    return;
  }

  // Leer configuración actual del nodo
  const mod = frontModules[node.type];
  let config = {};
  
  if (mod?.readConfig) {
    config = mod.readConfig(node.el) || {};
  } else {
    const inputs = node.el.querySelectorAll(".body input, .body textarea, .body select");
    inputs.forEach(inp => {
      const key = (inp.name || inp.id || inp.dataset.configKey || "").trim();
      if (!key) return;
      if (inp.type === "checkbox") {
        config[key] = inp.checked;
      } else {
        config[key] = inp.value;
      }
    });
  }

  clipboard = {
    type: node.type,
    config: config,
    x: parseFloat(node.el.style.left || "0"),
    y: parseFloat(node.el.style.top || "0")
  };

  log(`[COPY] Nodo '${node.type}' copiado`);
}

/**
 * Pega el nodo del portapapeles
 */
function pasteNode() {
  if (!clipboard) {
    log("[PASTE] No hay nodo en el portapapeles");
    return;
  }

  const tool = TOOLS.find(t => t.type === clipboard.type);
  if (!tool) {
    log(`[PASTE] Herramienta '${clipboard.type}' no encontrada`);
    return;
  }

  // Guardar estado antes de pegar
  saveState();

  // Crear nodo con offset para que no se superponga
  const offsetX = 50;
  const offsetY = 50;
  const el = crearNodoBase(clipboard.x + offsetX, clipboard.y + offsetY, tool.label || tool.type);

  const nodeId = "n" + (nodoCounter++);
  el.dataset.nodeId = nodeId;

  // Construir el cuerpo según módulo front
  const mod = frontModules[tool.type];
  if (mod?.buildBody) {
    mod.buildBody(el, tool, nodeId);
    
    // Restaurar configuración copiada
    if (clipboard.config) {
      Object.entries(clipboard.config).forEach(([key, value]) => {
        const input = el.querySelector(`[data-config-key="${key}"]`);
        if (input) {
          if (input.type === "checkbox") {
            input.checked = !!value;
          } else {
            input.value = value;
          }
        }
      });
    }
  } else {
    const body = el.querySelector(".body");
    body.innerHTML = `<div class="muted" style="font-size:12px">Sin UI de configuración.</div>`;
  }

  // Si hay múltiples puertos, quitar el default
  const outs = el.querySelectorAll(".port.out");
  if (outs.length > 1) {
    const first = outs[0];
    if (!first.dataset.port) first.remove();
  }

  // Hacer draggable
  hacerDraggable(el);

  // Registrar nodo
  nodos.push({ 
    id: nodeId, 
    x: clipboard.x + offsetX, 
    y: clipboard.y + offsetY, 
    el, 
    type: tool.type, 
    config: clipboard.config || {} 
  });

  actualizarConexiones();
  
  // Seleccionar el nodo pegado con un pequeño delay para evitar conflictos
  setTimeout(() => {
    setSelected(nodeId);
  }, 10);

  log(`[PASTE] Nodo '${tool.type}' pegado`);
}

// Exportar funciones globalmente para que puedan ser usadas desde los botones
window.WORKFLOW_API = {
  save: saveWorkflow,
  load: loadWorkflow,
  list: listWorkflows,
  export: exportWorkflow,
  import: importWorkflow,
  clear: clearWorkflow,
  serialize: serializeWorkflow,
  deserialize: deserializeWorkflow,
  undo: undo,
  redo: redo,
  copy: copyNode,
  paste: pasteNode
};

