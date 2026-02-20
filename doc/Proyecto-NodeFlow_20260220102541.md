# Reporte de proyecto

## Estructura del proyecto

```
C:\xampp\htdocs\GitHub\Proyecto-NodeFlow
├── .gitignore
├── README.md
├── app.py
├── modules
│   ├── __init__.py
│   ├── cmp_contains.py
│   ├── cmp_eq.py
│   ├── cmp_gt.py
│   ├── cmp_lt.py
│   ├── cmp_neq.py
│   ├── comparar.py
│   ├── constante.py
│   ├── copiarencarpeta.py
│   ├── escribir_csv.py
│   ├── extraer_campo.py
│   ├── filtrar.py
│   ├── ifnode.py
│   ├── ifrouter.py
│   ├── imprimir.py
│   ├── leer_csv.py
│   ├── listarcarpetas.py
│   ├── mapear.py
│   ├── operador.py
│   ├── sequence.py
│   ├── var_get.py
│   ├── var_set.py
│   └── while_node.py
├── static
│   ├── app.js
│   ├── modules
│   │   ├── cmp_common.js
│   │   ├── cmp_contains.js
│   │   ├── cmp_eq.js
│   │   ├── cmp_gt.js
│   │   ├── cmp_lt.js
│   │   ├── cmp_neq.js
│   │   ├── comparar.js
│   │   ├── constante.js
│   │   ├── copiarencarpeta.js
│   │   ├── escribir_csv.js
│   │   ├── extraer_campo.js
│   │   ├── filtrar.js
│   │   ├── folderpicker.js
│   │   ├── if_router.js
│   │   ├── ifnode.js
│   │   ├── imprimir.js
│   │   ├── leer_csv.js
│   │   ├── listarcarpetas.js
│   │   ├── mapear.js
│   │   ├── operador.js
│   │   ├── sequence.js
│   │   ├── var_get.js
│   │   ├── var_set.js
│   │   └── while_node.js
│   └── styles.css
├── templates
│   └── index.html
└── workflows
    ├── datos_ejemplo.csv
    └── resultado.csv
```

## Código (intercalado)

# Proyecto-NodeFlow
**README.md**
```markdown
# Proyecto-NodeFlow 🔄

**Editor visual de workflows para procesamiento de datos**

Crea flujos de trabajo arrastrando y conectando nodos para automatizar tareas de procesamiento de datos sin escribir código.

## 🚀 Inicio Rápido

1. Ejecuta el servidor Flask:
   ```bash
   python app.py
   ```

2. Se abrirá automáticamente en tu navegador

3. Arrastra nodos desde la barra lateral y conéctalos

4. Presiona ▶️ Play para ejecutar el workflow

## ⌨️ Atajos de Teclado

- **Ctrl + Z**: Deshacer
- **Ctrl + Y**: Rehacer  
- **Ctrl + C**: Copiar nodo seleccionado
- **Ctrl + V**: Pegar nodo
- **Ctrl + S**: Guardar workflow
- **Delete/Supr**: Eliminar nodo seleccionado
- **Ctrl + Rueda**: Zoom
- **Ctrl + Arrastrar**: Mover canvas (pan)

## 📦 Nodos Disponibles

### 📊 Entrada/Salida de Datos
- **📄 Leer CSV**: Carga archivos CSV como tabla de datos
- **💾 Escribir CSV**: Exporta datos a archivo CSV
- **📁 Listar Carpetas**: Lista archivos en un directorio

### 🔄 Transformación de Datos
- **🔍 Filtrar**: Filtra elementos por condición (campo == valor, >, <, contains, etc.)
- **🔄 Mapear**: Transforma datos (extraer campos, renombrar, agregar campos)
- **📌 Extraer Campo**: Extrae un campo específico a lista simple

### 🧮 Operaciones
- **➕ Operador**: Operaciones matemáticas (+, -, ×, ÷)
- **Comparar**: Comparaciones (==, !=, >, <, >=, <=, contains)

### 🔀 Control de Flujo
- **If Node**: Bifurcación simple (true/false)
- **If Router**: Múltiples salidas según condiciones
- **While**: Bucle mientras condición sea verdadera
- **Sequence**: Ejecuta nodos en secuencia

### 💾 Variables
- **Asignar Variable**: Guarda valor en variable
- **Obtener Variable**: Recupera valor de variable
- **Constante**: Define un valor constante

### 📋 Debug
- **Imprimir**: Muestra datos en consola

## 📝 Ejemplo de Uso

### Caso 1: Filtrar datos de CSV

1. **Leer CSV** (`workflows/datos_ejemplo.csv`)
   ↓
2. **Filtrar** (edad > 30)
   ↓
3. **Escribir CSV** (`resultados.csv`)

### Caso 2: Extraer y transformar

1. **Leer CSV** (con datos de empleados)
   ↓
2. **Mapear** (extraer solo: nombre, salario)
   ↓
3. **Filtrar** (salario > 45000)
   ↓
4. **Extraer Campo** (nombre)
   ↓
5. **Imprimir** (ver lista de nombres)

## 🎯 Archivo de Ejemplo

Se incluye `workflows/datos_ejemplo.csv` con datos de prueba listos para usar.

## 💡 Tips

- Los workflows se guardan en la carpeta `workflows/`
- Puedes exportar/importar workflows como JSON
- Usa **Imprimir** para debug durante el desarrollo
- Los nodos muestran preview de resultados al ejecutar
```
**app.py**
```python
from flask import Flask, request, jsonify, render_template
import os
import json
import webbrowser
from threading import Timer
from collections import defaultdict, deque
from typing import Dict, Any, List, Tuple
from datetime import datetime

from modules import load_backend_modules

app = Flask(__name__, static_folder="static", template_folder="templates")

# ===== Config (hardcoded, acceso total) =====
BASE_DIR = os.path.dirname(__file__)  # directorio del proyecto
ALLOW_ANY_PATH = True   # permite rutas absolutas en todo el FS
WORKFLOWS_DIR = os.path.join(os.path.dirname(__file__), "workflows")

# Crear directorio de workflows si no existe
if not os.path.exists(WORKFLOWS_DIR):
    os.makedirs(WORKFLOWS_DIR)

BACKEND_MODULES = load_backend_modules()


def static_front_module_exists(tool_type: str) -> bool:
    path = os.path.join(app.static_folder, "modules", f"{tool_type}.js")
    return os.path.isfile(path)


def safe_join(base: str, target: str, allow_abs: bool = False) -> str:
    """
    Si allow_abs=True y target es absoluto, se permite (normalizado).
    Si no, se une base+target y se asegura de no salir de base.
    """
    if allow_abs and os.path.isabs(target):
        return os.path.abspath(target)

    p = os.path.abspath(os.path.join(base, target))
    # Si base es "/" (unix), cualquier abs path empieza por "/" -> OK
    # Si no, se confina a base
    if base != os.path.sep and not p.startswith(base):
        raise ValueError("Path escapes BASE_DIR")
    return p


@app.route("/")
def index():
    return render_template("index.html", base_dir=BASE_DIR)


@app.route("/api/tools", methods=["GET"])
def api_tools():
    tools = []
    for t, mod in BACKEND_MODULES.items():
        tool = dict(mod["TOOL"])
        if static_front_module_exists(t):
            tool["front_module"] = f"/static/modules/{t}.js"
        tools.append(tool)
    # (opcional) ordenar por label para que la barra quede limpia
    tools.sort(key=lambda x: (str(x.get("label","")).lower(), str(x.get("type","")).lower()))
    return jsonify({
        "tools": tools,
        "base_dir": BASE_DIR,
        "allow_any_path": ALLOW_ANY_PATH
    })


@app.route("/api/fs/list", methods=["GET"])
def api_fs_list():
    path = request.args.get("path", "").strip()
    try:
        root = safe_join(BASE_DIR, path, allow_abs=ALLOW_ANY_PATH)
        if not os.path.isdir(root):
            return jsonify({"error": f"No es un directorio: {path}"}), 400

        items = []
        for name in os.listdir(root):
            full = os.path.join(root, name)
            items.append({
                "name": name,
                "path": full if ALLOW_ANY_PATH else os.path.relpath(full, BASE_DIR),
                "is_dir": os.path.isdir(full)
            })

        items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
        parent = os.path.abspath(os.path.join(root, os.pardir))
        parent_allowed = True
        if not ALLOW_ANY_PATH and BASE_DIR != os.path.sep and not parent.startswith(BASE_DIR):
            parent_allowed = False

        return jsonify({
            "cwd": root,
            "parent": parent if parent_allowed else None,
            "items": items
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/workflows", methods=["GET"])
def api_list_workflows():
    """Lista todos los workflows guardados"""
    try:
        workflows = []
        for filename in os.listdir(WORKFLOWS_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(WORKFLOWS_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        workflows.append({
                            "name": filename[:-5],  # sin .json
                            "filename": filename,
                            "saved_at": data.get("saved_at", "Desconocido"),
                            "node_count": len(data.get("nodes", [])),
                            "edge_count": len(data.get("edges", []))
                        })
                except Exception as e:
                    print(f"Error leyendo {filename}: {e}")
        workflows.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
        return jsonify({"workflows": workflows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/workflows/<name>", methods=["GET"])
def api_load_workflow(name):
    """Carga un workflow específico"""
    try:
        filename = f"{name}.json" if not name.endswith(".json") else name
        filepath = os.path.join(WORKFLOWS_DIR, filename)
        
        if not os.path.isfile(filepath):
            return jsonify({"error": f"Workflow '{name}' no encontrado"}), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/workflows/<name>", methods=["POST"])
def api_save_workflow(name):
    """Guarda un workflow"""
    try:
        payload = request.get_json(silent=True) or {}
        
        # Agregar metadata
        payload["saved_at"] = datetime.now().isoformat()
        payload["name"] = name
        
        filename = f"{name}.json" if not name.endswith(".json") else name
        filepath = os.path.join(WORKFLOWS_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        
        return jsonify({"ok": True, "message": f"Workflow '{name}' guardado exitosamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/workflows/<name>", methods=["DELETE"])
def api_delete_workflow(name):
    """Elimina un workflow"""
    try:
        filename = f"{name}.json" if not name.endswith(".json") else name
        filepath = os.path.join(WORKFLOWS_DIR, filename)
        
        if not os.path.isfile(filepath):
            return jsonify({"error": f"Workflow '{name}' no encontrado"}), 404
        
        os.remove(filepath)
        return jsonify({"ok": True, "message": f"Workflow '{name}' eliminado"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/execute", methods=["POST"])
def api_execute():
    """
    Ejecución tipo "dataflow" con cola (permite ciclos).
    - Cada arista conserva from_port.
    - Si un nodo devuelve {"routes": {...}}, se enruta por from_port.
    - Si no hay routes, solo se propaga por 'default'.
    Cortes de seguridad:
      - MAX_STEPS global
      - Nodos while deben limitar iteraciones por config
    """
    payload = request.get_json(silent=True) or {}
    nodes: List[Dict[str, Any]] = payload.get("nodes", [])
    edges: List[Dict[str, Any]] = payload.get("edges", [])

    node_by_id: Dict[str, Dict[str, Any]] = {n.get("id"): n for n in nodes if n.get("id")}
    if not node_by_id:
        return jsonify({"results": {}, "error": "No hay nodos para ejecutar"}), 400

    # adj[src] = lista de (to_id, from_port)
    adj: Dict[str, List[Tuple[str, str]]] = defaultdict(list)
    indeg: Dict[str, int] = defaultdict(int)
    for nid in node_by_id:
        indeg[nid] = 0

    for e in edges:
        f = e.get("from")
        t = e.get("to")
        fp = e.get("from_port") or "default"
        if f in node_by_id and t in node_by_id:
            adj[f].append((t, fp))
            indeg[t] += 1

    # Buffer de entradas por nodo
    inbox: Dict[str, List[Any]] = defaultdict(list)

    # Cola de ejecución (iniciamos con fuentes)
    q = deque([nid for nid, d in indeg.items() if d == 0])
    # Si todo está en ciclo (indeg>0), arrancamos con todos para no quedarnos a cero.
    if not q:
        q = deque(list(node_by_id.keys()))

    # Control de cortes
    MAX_STEPS = int(payload.get("max_steps") or 2000)

    # Results persisten por nodo, y _state permite estado entre iteraciones (while/sequence)
    results: Dict[str, Dict[str, Any]] = {}

    def execute_node(nid: str) -> Dict[str, Any]:
        spec = node_by_id[nid]
        t = spec.get("type")
        cfg = spec.get("config") or {}
        if t not in BACKEND_MODULES:
            raise ValueError(f"Tool no registrado: {t}")

        context = {
            "BASE_DIR": BASE_DIR,
            "safe_join": lambda b, p: safe_join(b, p, allow_abs=ALLOW_ANY_PATH),
            "inputs": list(inbox.get(nid, [])),
            "state": results.get(nid, {}).get("_state", {}),
        }

        out = BACKEND_MODULES[t]["execute"](cfg, context)

        # Guardamos estado si el tool lo devuelve (opcional)
        st = {}
        if isinstance(out, dict) and "_state" in out and isinstance(out["_state"], dict):
            st = out["_state"]
            out = dict(out)
            out.pop("_state", None)

        return {"ok": True, "data": out, "_state": st}

    def propagate(src_id: str, out_payload: Any):
        for (to_id, from_port) in adj.get(src_id, []):
            val = None

            if isinstance(out_payload, dict) and "routes" in out_payload and isinstance(out_payload["routes"], dict):
                val = out_payload["routes"].get(from_port)
            else:
                # sin routes: solo propaga por 'default'
                if from_port == "default":
                    val = out_payload

            if val is None:
                continue

            inbox[to_id].append(val)
            q.append(to_id)

    steps = 0
    ran_without_inputs = set()

    while q and steps < MAX_STEPS:
        nid = q.popleft()
        steps += 1

        # Si no hay entradas nuevas y es fuente ya ejecutada sin inputs, saltamos
        if not inbox.get(nid) and nid in ran_without_inputs:
            continue

        try:
            res = execute_node(nid)
            results[nid] = res
        except Exception as e:
            results[nid] = {"ok": False, "error": str(e)}
            inbox[nid].clear()
            continue

        out_data = results[nid].get("data")

        if not inbox.get(nid):
            ran_without_inputs.add(nid)

        inbox[nid].clear()

        if results[nid]["ok"]:
            propagate(nid, out_data)

    if steps >= MAX_STEPS:
        return jsonify({"results": results, "error": f"Corte de seguridad: máximo de pasos alcanzado ({MAX_STEPS})."}), 400

    return jsonify({"results": results})


def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")


if __name__ == "__main__":
    # Solo abrir navegador en el proceso del reloader, no en el proceso principal
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        Timer(0.75, open_browser).start()
    app.run(debug=True)


```
## modules
**__init__.py**
```python
import importlib.util
import os
from typing import Dict, Any

def _import_module_from_path(module_name: str, file_path: str):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if not spec or not spec.loader:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore
    return mod

def load_backend_modules() -> Dict[str, Dict[str, Any]]:
    """
    Escanea el directorio actual (modules/) buscando archivos *.py (excepto __init__.py),
    importa cada uno y registra módulos que expongan:
      - TOOL: dict con {type,label,description,config}
      - execute(config:dict, context:dict) -> dict (resultado)
    Devuelve: dict[type] = {"TOOL":..., "execute":callable}
    """
    registry: Dict[str, Dict[str, Any]] = {}
    base_dir = os.path.dirname(__file__)

    for filename in os.listdir(base_dir):
        if not filename.endswith(".py"): 
            continue
        if filename == "__init__.py":
            continue

        path = os.path.join(base_dir, filename)
        mod_name = f"modules.{filename[:-3]}"
        mod = _import_module_from_path(mod_name, path)
        if not mod:
            continue

        tool = getattr(mod, "TOOL", None)
        execute = getattr(mod, "execute", None)

        if not isinstance(tool, dict) or not callable(execute):
            # No cumple el contrato mínimo
            continue

        tool_type = tool.get("type")
        if not tool_type:
            continue

        registry[tool_type] = {"TOOL": tool, "execute": execute}

    return registry


```
**cmp_contains.py**
```python
# modules/cmp_contains.py
TOOL = {
    "type": "cmp_contains",
    "label": "contains (substring)",
    "description": "Devuelve true si input contiene la subcadena.",
    "config": {
        "value": {"type":"string","label":"Subcadena","default":""}
    }
}

def execute(config, context):
    sub = str(config.get("value",""))
    ins = context.get("inputs",[])
    x = "" if not ins else str(ins[0])
    return {"result": (sub in x)}


```
**cmp_eq.py**
```python
# modules/cmp_eq.py
TOOL = {
    "type": "cmp_eq",
    "label": "== (equals)",
    "description": "Compara texto/num con una constante y devuelve true/false.",
    "config": {
        "value": {"type":"string","label":"Constante","default":""}
    }
}

def _coerce(a, b):
    try:
        return float(a), float(b), True
    except Exception:
        return str(a), str(b), False

def execute(config, context):
    target = config.get("value","")
    ins = context.get("inputs",[])
    x = ins[0] if ins else ""
    a,b,_ = _coerce(x, target)
    return {"result": a == b}


```
**cmp_gt.py**
```python
# modules/cmp_gt.py
TOOL = {
    "type": "cmp_gt",
    "label": "> (greater than)",
    "description": "Devuelve true si input > constante (numérico si ambos números, si no lexicográfico).",
    "config": {
        "value": {"type":"string","label":"Constante","default":"0"}
    }
}

def _coerce(a, b):
    try:
        return float(a), float(b), True
    except Exception:
        return str(a), str(b), False

def execute(config, context):
    target = config.get("value","0")
    ins = context.get("inputs",[])
    x = ins[0] if ins else ""
    a,b,_ = _coerce(x, target)
    return {"result": a > b}


```
**cmp_lt.py**
```python
# modules/cmp_lt.py
TOOL = {
    "type": "cmp_lt",
    "label": "< (less than)",
    "description": "Devuelve true si input < constante (numérico si ambos números, si no lexicográfico).",
    "config": {
        "value": {"type":"string","label":"Constante","default":"0"}
    }
}

def _coerce(a, b):
    try:
        return float(a), float(b), True
    except Exception:
        return str(a), str(b), False

def execute(config, context):
    target = config.get("value","0")
    ins = context.get("inputs",[])
    x = ins[0] if ins else ""
    a,b,_ = _coerce(x, target)
    return {"result": a < b}


```
**cmp_neq.py**
```python
# modules/cmp_neq.py
TOOL = {
    "type": "cmp_neq",
    "label": "!= (not equals)",
    "description": "Devuelve true si input != constante.",
    "config": {
        "value": {"type":"string","label":"Constante","default":""}
    }
}

def _coerce(a, b):
    try:
        return float(a), float(b), True
    except Exception:
        return str(a), str(b), False

def execute(config, context):
    target = config.get("value","")
    ins = context.get("inputs",[])
    x = ins[0] if ins else ""
    a,b,_ = _coerce(x, target)
    return {"result": a != b}


```
**comparar.py**
```python
# modules/comparar.py
from typing import Dict, Any

TOOL = {
    "type": "comparar",
    "label": "Comparar",
    "description": "Compara la entrada con un valor (rhs). Devuelve true/false.",
    "config": {
        "op":  {"type": "string", "label": "Operador", "default": "=="},
        "rhs": {"type": "string", "label": "Valor (rhs)", "default": ""}
    }
}

def _coerce_number(s: str):
    try:
        if "." in s:
            return float(s)
        return int(s)
    except Exception:
        return None

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    op   = (config.get("op") or "==").strip()
    rhs  = str(config.get("rhs") if config.get("rhs") is not None else "")
    ins  = context.get("inputs", [])

    # toma el primer input simple/escalares (si llega un dict/list, lo convertimos a str)
    x = None
    for it in ins or []:
        x = it
        break

    # Soporta comparar string/num. Para < y > intentamos numérico.
    if op in ("<", ">",):
        x_num   = None
        rhs_num = _coerce_number(rhs)
        if isinstance(x, (int, float)): x_num = x
        else:
            try:
                x_num = _coerce_number(str(x))
            except Exception:
                x_num = None
        if x_num is None or rhs_num is None:
            result = False
        else:
            result = (x_num < rhs_num) if op == "<" else (x_num > rhs_num)

    elif op in ("==", "!="):
        result = (str(x) == rhs) if op == "==" else (str(x) != rhs)

    elif op in ("contains", "substr", "includes"):
        result = (rhs in str(x))

    else:
        # Operador no reconocido: false
        result = False

    return {"data": bool(result)}


```
**constante.py**
```python
# modules/constante.py
TOOL = {
    "type": "constante",
    "label": "Constante",
    "description": "Emite un valor literal (texto o número).",
    "config": {
        "value": {"type": "string", "label": "Valor", "default": ""}
    }
}

def execute(config, context):
    v = config.get("value", "")
    s = str(v).strip()
    # intenta numérico si procede
    try:
        if s.lower() in ("true", "false"):
            return {"value": (s.lower() == "true"), "type": "bool"}
        if "." in s:
            return {"value": float(s), "type": "number"}
        return {"value": int(s), "type": "number"}
    except Exception:
        return {"value": v, "type": "string"}


```
**copiarencarpeta.py**
```python
# modules/copiarencarpeta.py
import os
import shutil
from typing import Dict, Any, List

TOOL = {
    "type": "copiarencarpeta",
    "label": "Copy into folder",
    "description": "Copies an input list of files into the destination folder (within BASE_DIR).",
    "config": {
        "dest": {"type": "string", "label": "Destination folder (within BASE_DIR)", "default": ""}
    }
}

def _normalize_items_from_inputs(inputs: List[Dict[str, Any]], base_dir: str, safe_join):
    """
    Accepts inputs in several shapes and returns a list of ABSOLUTE file paths within BASE_DIR:

    A) Output from listarcarpetas:
       {"files":[{"name": "...", "is_dir": bool, "size": int|None}, ...], "path":"subdir"}
    B) Plain list of strings:
       ["a.txt", "sub/b.png"]
    C) Dict with 'items':
       {"items": ["a.txt", "sub/b.png"]}

    NOTE: Only files are considered (directories are ignored).
    """
    items: List[str] = []

    for inp in inputs or []:
        # A) listarcarpetas output
        if isinstance(inp, dict) and "files" in inp and "path" in inp:
            src_dir = safe_join(base_dir, inp.get("path", "") or "")
            for f in inp.get("files", []):
                if not isinstance(f, dict):
                    continue
                name = f.get("name")
                if not name:
                    continue
                full = safe_join(src_dir, name)
                if os.path.isfile(full):
                    items.append(full)

        # C) dict with 'items'
        elif isinstance(inp, dict) and "items" in inp:
            for p in (inp["items"] or []):
                if not isinstance(p, str):
                    continue
                full = safe_join(base_dir, p)
                if os.path.isfile(full):
                    items.append(full)

        # B) plain list of strings
        elif isinstance(inp, list):
            for p in inp:
                if not isinstance(p, str):
                    continue
                full = safe_join(base_dir, p)
                if os.path.isfile(full):
                    items.append(full)

        # other shapes ignored

    # deduplicate preserving order
    seen = set()
    dedup: List[str] = []
    for p in items:
        if p not in seen:
            seen.add(p)
            dedup.append(p)
    return dedup

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Copies files provided via upstream inputs into a destination folder under BASE_DIR.

    config:  {"dest": "<relative folder>"}
    context: {"BASE_DIR": str, "safe_join": callable, "inputs": list}
    """
    base_dir  = context["BASE_DIR"]
    safe_join = context["safe_join"]
    inputs    = context.get("inputs", [])

    dest_rel = (config.get("dest") or "").strip()
    if not dest_rel:
        raise ValueError("Destination folder (dest) is required")

    dest_abs = safe_join(base_dir, dest_rel)
    os.makedirs(dest_abs, exist_ok=True)

    items = _normalize_items_from_inputs(inputs, base_dir, safe_join)
    if not items:
        return {
            "copied": 0,
            "dest": dest_rel,
            "skipped": [],
            "note": "No input files to copy."
        }

    copied = 0
    skipped = []
    for src in items:
        try:
            fname = os.path.basename(src)
            dst = safe_join(dest_abs, fname)
            shutil.copy2(src, dst)
            copied += 1
        except Exception as e:
            skipped.append({"file": src, "error": str(e)})

    return {"copied": copied, "dest": dest_rel, "skipped": skipped}


```
**escribir_csv.py**
```python
# modules/escribir_csv.py
import csv
import os

TOOL = {
    "type": "escribir_csv",
    "label": "Escribir CSV",
    "description": "Escribe una lista de datos en un archivo CSV.",
    "config": {
        "archivo": {"type": "string", "label": "Ruta del archivo CSV", "default": "salida.csv"},
        "delimiter": {"type": "string", "label": "Delimitador", "default": ","},
        "encoding": {"type": "string", "label": "Codificación", "default": "utf-8"},
        "incluir_encabezado": {"type": "boolean", "label": "Incluir encabezado", "default": True}
    }
}

def execute(config, context):
    """
    Escribe datos en un archivo CSV.
    Acepta una lista de diccionarios o una lista de listas.
    """
    archivo = (config.get("archivo") or "").strip()
    if not archivo:
        return {"ok": False, "error": "No se especificó archivo"}
    
    delimiter = config.get("delimiter", ",") or ","
    encoding = config.get("encoding", "utf-8") or "utf-8"
    incluir_encabezado = config.get("incluir_encabezado", True)
    
    # Obtener datos de entrada
    inputs = context.get("inputs", [])
    if not inputs:
        return {"ok": False, "error": "No hay datos para escribir"}
    
    # Obtener datos: puede venir como {"data": [...]}, {"ok": True, "data": [...]}, o lista directa
    first_input = inputs[0]
    
    if isinstance(first_input, dict):
        # Si tiene campo 'data', usar ese
        if "data" in first_input:
            data = first_input["data"]
        # Si no, verificar si es un dict con estructura de listarcarpetas
        elif "files" in first_input:
            # Convertir formato de listarcarpetas a lista de dicts
            data = first_input["files"]
        # Si no, asumir que el dict completo es un item
        else:
            data = [first_input]
    else:
        data = first_input
    
    # Verificar que sea una lista
    if not isinstance(data, list):
        return {"ok": False, "error": "Los datos deben ser una lista"}
    
    if not data:
        return {"ok": False, "error": "La lista de datos está vacía"}
    
    # Usar safe_join del contexto para manejar rutas correctamente
    safe_join = context.get("safe_join")
    base_dir = context.get("BASE_DIR", "/")
    
    try:
        archivo = safe_join(base_dir, archivo)
    except Exception as e:
        return {"ok": False, "error": f"Ruta inválida: {str(e)}"}
    
    try:
        # Crear directorio si no existe
        dir_path = os.path.dirname(archivo)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        with open(archivo, 'w', encoding=encoding, newline='') as f:
            # Determinar si son diccionarios o listas
            if isinstance(data[0], dict):
                # Lista de diccionarios
                headers = list(data[0].keys())
                writer = csv.DictWriter(f, fieldnames=headers, delimiter=delimiter)
                
                if incluir_encabezado:
                    writer.writeheader()
                
                writer.writerows(data)
                
            elif isinstance(data[0], (list, tuple)):
                # Lista de listas
                writer = csv.writer(f, delimiter=delimiter)
                writer.writerows(data)
                
            else:
                return {"ok": False, "error": "Los datos deben ser una lista de diccionarios o listas"}
        
        return {
            "ok": True,
            "archivo": archivo,
            "filas_escritas": len(data)
        }
    
    except Exception as e:
        return {"ok": False, "error": f"Error escribiendo CSV: {str(e)}"}

```
**extraer_campo.py**
```python
# modules/extraer_campo.py
TOOL = {
    "type": "extraer_campo",
    "label": "Extraer Campo",
    "description": "Extrae un campo específico de cada elemento y retorna una lista simple de valores.",
    "config": {
        "campo": {"type": "string", "label": "Campo a extraer", "default": ""}
    }
}

def execute(config, context):
    """
    Extrae un campo específico de una lista de diccionarios.
    Retorna una lista simple de valores.
    Ejemplo: [{"name": "Ana", "age": 25}, {"name": "Bob", "age": 30}]
             con campo="name" → ["Ana", "Bob"]
    """
    inputs = context.get("inputs", [])
    if not inputs:
        return {"ok": False, "error": "No hay datos de entrada"}
    
    # Obtener datos: puede venir como {"data": [...]}, {"ok": True, "data": [...]}, o lista directa
    first_input = inputs[0]
    
    if isinstance(first_input, dict):
        # Si tiene campo 'data', usar ese
        if "data" in first_input:
            data = first_input["data"]
        # Si no, asumir que el dict completo es el dato
        else:
            data = first_input
    else:
        data = first_input
    
    if not isinstance(data, list):
        return {"ok": False, "error": "Los datos deben ser una lista"}
    
    campo = (config.get("campo") or "").strip()
    if not campo:
        return {"ok": False, "error": "Especifica el campo a extraer"}
    
    resultado = []
    
    for item in data:
        if isinstance(item, dict):
            valor = item.get(campo)
            resultado.append(valor)
        else:
            # Si no es dict, intentar acceder como atributo o usar None
            try:
                valor = getattr(item, campo, None)
                resultado.append(valor)
            except:
                resultado.append(None)
    
    return {
        "ok": True,
        "data": resultado,
        "count": len(resultado),
        "campo": campo
    }

```
**filtrar.py**
```python
# modules/filtrar.py
TOOL = {
    "type": "filtrar",
    "label": "Filtrar",
    "description": "Filtra elementos de una lista según una condición (campo, operador, valor).",
    "config": {
        "campo": {"type": "string", "label": "Campo a evaluar", "default": ""},
        "operador": {"type": "select", "label": "Operador", "options": ["==", "!=", ">", "<", ">=", "<=", "contains", "not_contains"], "default": "=="},
        "valor": {"type": "string", "label": "Valor a comparar", "default": ""}
    }
}

def execute(config, context):
    """
    Filtra una lista según la condición especificada.
    Si los elementos son diccionarios, evalúa el campo especificado.
    Si son valores simples, evalúa el valor directamente.
    """
    inputs = context.get("inputs", [])
    if not inputs:
        return {"ok": False, "error": "No hay datos para filtrar"}
    
    # Obtener datos: puede venir como {"data": [...]}, {"ok": True, "data": [...]}, o lista directa
    first_input = inputs[0]
    
    if isinstance(first_input, dict):
        # Si tiene campo 'data', usar ese
        if "data" in first_input:
            data = first_input["data"]
        # Si no, asumir que el dict completo es el dato
        else:
            data = first_input
    else:
        data = first_input
    
    if not isinstance(data, list):
        return {"ok": False, "error": "Los datos deben ser una lista"}
    
    campo = (config.get("campo") or "").strip()
    operador = config.get("operador", "==")
    valor_cmp = config.get("valor", "")
    
    # Intentar convertir valor a número si es posible
    try:
        valor_num = float(valor_cmp)
        es_numero = True
    except:
        valor_num = None
        es_numero = False
    
    resultado = []
    
    for item in data:
        # Obtener el valor a evaluar
        if isinstance(item, dict):
            if not campo:
                continue  # Si es dict pero no hay campo, saltar
            valor_item = item.get(campo)
        else:
            valor_item = item
        
        # Normalizar valores para comparación
        if valor_item is None:
            valor_item_str = ""
            valor_item_num = None
        else:
            valor_item_str = str(valor_item)
            try:
                valor_item_num = float(valor_item)
            except:
                valor_item_num = None
        
        # Evaluar condición
        cumple = False
        
        try:
            if operador == "==":
                if es_numero and valor_item_num is not None:
                    cumple = valor_item_num == valor_num
                else:
                    cumple = valor_item_str == valor_cmp
            
            elif operador == "!=":
                if es_numero and valor_item_num is not None:
                    cumple = valor_item_num != valor_num
                else:
                    cumple = valor_item_str != valor_cmp
            
            elif operador == ">":
                if valor_item_num is not None and valor_num is not None:
                    cumple = valor_item_num > valor_num
            
            elif operador == "<":
                if valor_item_num is not None and valor_num is not None:
                    cumple = valor_item_num < valor_num
            
            elif operador == ">=":
                if valor_item_num is not None and valor_num is not None:
                    cumple = valor_item_num >= valor_num
            
            elif operador == "<=":
                if valor_item_num is not None and valor_num is not None:
                    cumple = valor_item_num <= valor_num
            
            elif operador == "contains":
                cumple = valor_cmp.lower() in valor_item_str.lower()
            
            elif operador == "not_contains":
                cumple = valor_cmp.lower() not in valor_item_str.lower()
        
        except:
            cumple = False
        
        if cumple:
            resultado.append(item)
    
    return {
        "ok": True,
        "data": resultado,
        "count": len(resultado),
        "original_count": len(data),
        "filtrado": len(data) - len(resultado)
    }

```
**ifnode.py**
```python
# modules/ifnode.py
from typing import Dict, Any, List

TOOL = {
    "type": "ifnode",
    "label": "IF (expresión)",
    "description": "Evalúa una expresión sobre la entrada (x) y ramifica por true/false.",
    "config": {
        "expr": {"type": "string", "label": "Expresión (Python) con x", "default": "bool(x)"}
    }
}

def _first_input(inputs: List[Any]):
    for it in inputs or []:
        if it is not None:
            return it
    return None

def _safe_eval(expr: str, x):
    safe_globals = {"__builtins__": {}}
    safe_locals  = {"x": x, "len": len, "str": str, "int": int, "float": float, "bool": bool}
    return bool(eval(expr, safe_globals, safe_locals))

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    expr   = (config.get("expr") or "bool(x)").strip()
    inputs = context.get("inputs", [])
    x      = _first_input(inputs)

    try:
        is_true = _safe_eval(expr, x)
        branch = "true" if is_true else "false"
        return {
            "routes": {
                "true": x if is_true else None,
                "false": x if not is_true else None
            },
            "result": is_true,
            "meta": {"branch": branch}
        }
    except Exception as e:
        # en error: false + reporta
        return {
            "routes": {"true": None, "false": x},
            "result": False,
            "meta": {"branch": "false", "error": str(e)}
        }


```
**ifrouter.py**
```python
# modules/if_router.py
from typing import Dict, Any, List

TOOL = {
    "type": "if_router",
    "label": "IF (cond → true/false)",
    "description": "Recibe entradas: una booleana (cond) y otra payload. Enruta payload por 'true' o 'false'.",
    "config": {}
}

def _flatten_inputs(inputs: List[Any]):
    # Toma la primera booleana que encuentre, y el último payload no booleano (o cualquiera)
    cond = None
    payload = None
    for it in inputs or []:
        if isinstance(it, dict) and "result" in it and isinstance(it["result"], bool):
            cond = it["result"]
        elif isinstance(it, bool) and cond is None:
            cond = it
        else:
            payload = it
    return cond, payload

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    inputs = context.get("inputs", [])
    cond, payload = _flatten_inputs(inputs)

    # Por defecto, si no hay cond, tratamos como False y pasamos payload tal cual por 'false'
    cond_bool = bool(cond) if cond is not None else False

    return {
        "routes": {
            "true": payload if cond_bool else None,
            "false": payload if not cond_bool else None,
        },
        "result": cond_bool  # útil para debug/render
    }


```
**imprimir.py**
```python
# modules/imprimir.py
TOOL = {
    "type": "imprimir",
    "label": "Imprimir (consola)",
    "description": "Envía el primer input como texto a la consola (log del editor).",
    "config": {
        "prefix": {"type": "string", "label": "Prefijo", "default": ""}
    }
}

def execute(config, context):
    prefix = str(config.get("prefix", "") or "")
    ins = context.get("inputs", [])
    val = ins[0] if ins else None
    msg = (prefix + " " if prefix else "") + (str(val))
    # No imprime en stdout para no mezclar, solo devuelve para UI
    return {"message": msg, "value": val}


```
**leer_csv.py**
```python
# modules/leer_csv.py
import csv
import os

TOOL = {
    "type": "leer_csv",
    "label": "Leer CSV",
    "description": "Lee un archivo CSV y lo convierte en una lista de diccionarios (tabla de datos).",
    "config": {
        "archivo": {"type": "string", "label": "Ruta del archivo CSV", "default": ""},
        "delimiter": {"type": "string", "label": "Delimitador", "default": ","},
        "encoding": {"type": "string", "label": "Codificación", "default": "utf-8"},
        "tiene_encabezado": {"type": "boolean", "label": "Primera fila es encabezado", "default": True}
    }
}

def execute(config, context):
    """
    Lee un archivo CSV y retorna una lista de diccionarios.
    Si tiene_encabezado=True, usa la primera fila como claves.
    Si tiene_encabezado=False, usa col0, col1, col2, etc. como nombres.
    """
    archivo = (config.get("archivo") or "").strip()
    if not archivo:
        return {"ok": False, "error": "No se especificó archivo"}
    
    delimiter = config.get("delimiter", ",") or ","
    encoding = config.get("encoding", "utf-8") or "utf-8"
    tiene_encabezado = config.get("tiene_encabezado", True)
    
    # Usar safe_join del contexto para manejar rutas correctamente
    safe_join = context.get("safe_join")
    base_dir = context.get("BASE_DIR", "/")
    
    try:
        archivo = safe_join(base_dir, archivo)
    except Exception as e:
        return {"ok": False, "error": f"Ruta inválida: {str(e)}"}
    
    if not os.path.isfile(archivo):
        return {"ok": False, "error": f"Archivo no encontrado: {archivo}"}
    
    try:
        with open(archivo, 'r', encoding=encoding, newline='') as f:
            reader = csv.reader(f, delimiter=delimiter)
            rows = list(reader)
        
        if not rows:
            return {"ok": True, "data": [], "count": 0}
        
        if tiene_encabezado and len(rows) > 0:
            headers = rows[0]
            data_rows = rows[1:]
            # Convertir a lista de diccionarios
            data = [
                {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
                for row in data_rows
            ]
        else:
            # Sin encabezado, usar col0, col1, etc.
            max_cols = max(len(row) for row in rows) if rows else 0
            headers = [f"col{i}" for i in range(max_cols)]
            data = [
                {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
                for row in rows
            ]
        
        return {
            "ok": True,
            "data": data,
            "count": len(data),
            "headers": headers if tiene_encabezado else None
        }
    
    except Exception as e:
        return {"ok": False, "error": f"Error leyendo CSV: {str(e)}"}

```
**listarcarpetas.py**
```python
import os
from typing import Dict, Any

TOOL = {
    "type": "listarcarpetas",
    "label": "List files in folder",
    "description": "List immediate files inside a folder (non-recursive).",
    "config": {
        "path": {"type": "string", "label": "Folder path (within BASE_DIR)", "default": ""}
    }
}

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Lógica del tool.
    config: {"path": "..."}
    context: {"BASE_DIR": str, "safe_join": callable}
    """
    path = config.get("path", "") or ""
    safe_join = context["safe_join"]
    base_dir = context["BASE_DIR"]

    target_dir = safe_join(base_dir, path)
    if not os.path.isdir(target_dir):
        raise FileNotFoundError(f"Not a directory: {path}")

    entries = []
    for name in os.listdir(target_dir):
        full = os.path.join(target_dir, name)
        entries.append({
            "name": name,
            "is_dir": os.path.isdir(full),
            "size": os.path.getsize(full) if os.path.isfile(full) else None
        })
    return {"files": entries, "path": path}


```
**mapear.py**
```python
# modules/mapear.py
TOOL = {
    "type": "mapear",
    "label": "Mapear",
    "description": "Transforma cada elemento de una lista (renombrar campos, calcular nuevos valores).",
    "config": {
        "operacion": {"type": "select", "label": "Operación", "options": ["extraer_campos", "renombrar_campo", "agregar_campo"], "default": "extraer_campos"},
        "campos": {"type": "string", "label": "Campos (separados por coma)", "default": ""},
        "campo_origen": {"type": "string", "label": "Campo origen", "default": ""},
        "campo_destino": {"type": "string", "label": "Campo destino/nuevo", "default": ""},
        "valor_nuevo": {"type": "string", "label": "Valor para nuevo campo", "default": ""}
    }
}

def execute(config, context):
    """
    Transforma elementos de una lista según la operación seleccionada:
    - extraer_campos: Mantiene solo los campos especificados
    - renombrar_campo: Renombra un campo
    - agregar_campo: Agrega un nuevo campo con valor constante
    """
    inputs = context.get("inputs", [])
    if not inputs:
        return {"ok": False, "error": "No hay datos para mapear"}
    
    # Obtener datos: puede venir como {"data": [...]}, {"ok": True, "data": [...]}, o lista directa
    first_input = inputs[0]
    
    if isinstance(first_input, dict):
        # Si tiene campo 'data', usar ese
        if "data" in first_input:
            data = first_input["data"]
        # Si no, asumir que el dict completo es el dato
        else:
            data = first_input
    else:
        data = first_input
    
    if not isinstance(data, list):
        return {"ok": False, "error": "Los datos deben ser una lista"}
    
    if not data:
        return {"ok": True, "data": [], "count": 0}
    
    operacion = config.get("operacion", "extraer_campos")
    resultado = []
    
    try:
        if operacion == "extraer_campos":
            # Extraer solo campos específicos
            campos_str = (config.get("campos") or "").strip()
            if not campos_str:
                return {"ok": False, "error": "Especifica los campos a extraer (separados por coma)"}
            
            campos = [c.strip() for c in campos_str.split(",") if c.strip()]
            
            for item in data:
                if isinstance(item, dict):
                    nuevo_item = {campo: item.get(campo) for campo in campos}
                    resultado.append(nuevo_item)
                else:
                    resultado.append(item)  # Si no es dict, mantener original
        
        elif operacion == "renombrar_campo":
            # Renombrar un campo
            campo_origen = (config.get("campo_origen") or "").strip()
            campo_destino = (config.get("campo_destino") or "").strip()
            
            if not campo_origen or not campo_destino:
                return {"ok": False, "error": "Especifica campo origen y destino"}
            
            for item in data:
                if isinstance(item, dict):
                    nuevo_item = item.copy()
                    if campo_origen in nuevo_item:
                        nuevo_item[campo_destino] = nuevo_item.pop(campo_origen)
                    resultado.append(nuevo_item)
                else:
                    resultado.append(item)
        
        elif operacion == "agregar_campo":
            # Agregar nuevo campo con valor constante
            campo_destino = (config.get("campo_destino") or "").strip()
            valor_nuevo = config.get("valor_nuevo", "")
            
            if not campo_destino:
                return {"ok": False, "error": "Especifica el nombre del nuevo campo"}
            
            # Intentar convertir valor a número si es posible
            try:
                if "." in str(valor_nuevo):
                    valor_nuevo = float(valor_nuevo)
                else:
                    valor_nuevo = int(valor_nuevo)
            except:
                pass  # Mantener como string
            
            for item in data:
                if isinstance(item, dict):
                    nuevo_item = item.copy()
                    nuevo_item[campo_destino] = valor_nuevo
                    resultado.append(nuevo_item)
                else:
                    resultado.append(item)
        
        return {
            "ok": True,
            "data": resultado,
            "count": len(resultado)
        }
    
    except Exception as e:
        return {"ok": False, "error": f"Error mapeando datos: {str(e)}"}

```
**operador.py**
```python
# modules/operador.py
TOOL = {
    "type": "operador",
    "label": "Operador",
    "description": "Aplica un operador binario entre A (input0) y B (input1 o constante).",
    "config": {
        "op": {"type": "string", "label": "Operador", "default": "+"},
        "b":  {"type": "string", "label": "B (si no hay input1)", "default": "0"}
    }
}

def _to_number(x):
    try:
        if isinstance(x, (int, float)): return float(x)
        s = str(x).strip()
        return float(s) if "." in s else float(int(s))
    except Exception:
        return None

def execute(config, context):
    op = (config.get("op") or "+").strip()
    b_cfg = config.get("b", "0")

    ins = context.get("inputs", [])
    a = ins[0] if len(ins) > 0 else None
    b = ins[1] if len(ins) > 1 else b_cfg

    # soporte numérico
    a_num = _to_number(a)
    b_num = _to_number(b)

    if op in ("+", "-", "*", "/", "%"):
        if a_num is None or b_num is None:
            # si no es numérico, + hace concatenación
            if op == "+":
                return {"value": str(a) + str(b), "type": "string"}
            return {"value": None, "type": "error", "error": "Operación numérica con datos no numéricos"}
        if op == "+":  return {"value": a_num + b_num, "type": "number"}
        if op == "-":  return {"value": a_num - b_num, "type": "number"}
        if op == "*":  return {"value": a_num * b_num, "type": "number"}
        if op == "/":  return {"value": (a_num / b_num) if b_num != 0 else None, "type": "number"}
        if op == "%":  return {"value": (a_num % b_num) if b_num != 0 else None, "type": "number"}

    # comparaciones básicas
    if op in ("==", "!=", "<", ">", "<=", ">="):
        if a_num is not None and b_num is not None:
            av, bv = a_num, b_num
        else:
            av, bv = str(a), str(b)
        if op == "==": return {"value": av == bv, "type": "bool"}
        if op == "!=": return {"value": av != bv, "type": "bool"}
        if op == "<":  return {"value": av <  bv, "type": "bool"}
        if op == ">":  return {"value": av >  bv, "type": "bool"}
        if op == "<=": return {"value": av <= bv, "type": "bool"}
        if op == ">=": return {"value": av >= bv, "type": "bool"}

    return {"value": None, "type": "error", "error": f"Operador no soportado: {op}"}


```
**sequence.py**
```python
# modules/sequence.py
from typing import Dict, Any, List

TOOL = {
    "type": "sequence",
    "label": "Secuencia",
    "description": "Envía el payload por pasos (1..N). Cada activación avanza al siguiente paso.",
    "config": {
        "pasos": {"type": "number", "label": "Pasos", "default": 2},
        "ciclico": {"type": "boolean", "label": "Cíclico", "default": False},
    }
}

def _pick_payload(inputs: List[Any]):
    # último elemento no None
    payload = None
    for it in inputs or []:
        if it is not None:
            payload = it
    return payload

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    pasos = int(config.get("pasos") or 2)
    pasos = max(1, min(pasos, 12))  # límite práctico
    ciclico = bool(config.get("ciclico") or False)

    state = context.get("state") or {}
    i = int(state.get("i") or 0)

    payload = _pick_payload(context.get("inputs", []))

    # Si no hay payload, no hacemos nada (evita que fuentes se auto-repitan)
    if payload is None:
        return {"routes": {}, "result": {"paso": i+1, "pasos": pasos}, "_state": {"i": i}}

    if i >= pasos:
        if ciclico:
            i = 0
        else:
            # fuera de rango: no enruta nada
            return {"routes": {}, "result": {"paso": pasos, "pasos": pasos, "fin": True}, "_state": {"i": i}}

    port = str(i+1)
    routes = {port: payload}

    i2 = i + 1
    # si termina y es cíclico, volvemos a 0 para la próxima
    if i2 >= pasos and ciclico:
        i2 = 0

    return {
        "routes": routes,
        "result": {"paso": int(port), "pasos": pasos, "ciclico": ciclico},
        "_state": {"i": i2}
    }


```
**var_get.py**
```python
# modules/var_get.py
TOOL = {
    "type": "var_get",
    "label": "Leer variable",
    "description": "Devuelve el contenido de una variable por nombre.",
    "config": {
        "name": {"type": "string", "label": "Nombre de variable", "default": "x"},
        "default": {"type": "string", "label": "Valor por defecto", "default": ""}
    }
}

def execute(config, context):
    name = (config.get("name") or "x").strip()
    default = config.get("default", "")
    vars_ = context.get("vars", {})
    return {"name": name, "value": vars_.get(name, default)}


```
**var_set.py**
```python
# modules/var_set.py
TOOL = {
    "type": "var_set",
    "label": "Asignar variable",
    "description": "Guarda el primer input en una variable con nombre.",
    "config": {
        "name": {"type": "string", "label": "Nombre de variable", "default": "x"}
    }
}

def execute(config, context):
    name = (config.get("name") or "x").strip()
    inputs = context.get("inputs", [])
    val = inputs[0] if inputs else None
    vars_ = context.get("vars", {})
    vars_[name] = val
    return {"ok": True, "name": name, "value": val}


```
**while_node.py**
```python
# modules/while_node.py
from typing import Dict, Any, List, Tuple

TOOL = {
    "type": "while_node",
    "label": "Mientras (while)",
    "description": "Bucle while con corte por máximo de iteraciones. Entradas: cond (bool) y payload. Salidas: loop / exit.",
    "config": {
        "max_iter": {"type": "int", "label": "Máx. iteraciones", "default": 10}
    }
}

def _flatten_inputs(inputs: List[Any]) -> Tuple[bool, Any]:
    """
    cond: primera booleana encontrada (o dict{'result':bool})
    payload: último elemento no booleano (o cualquiera si no hay)
    """
    cond = None
    payload = None

    for it in inputs or []:
        if isinstance(it, dict) and isinstance(it.get("result"), bool) and cond is None:
            cond = it["result"]
        elif isinstance(it, bool) and cond is None:
            cond = it
        else:
            payload = it

    cond_bool = bool(cond) if cond is not None else False
    return cond_bool, payload

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    inputs = context.get("inputs", []) or []
    state  = context.get("state", {}) or {}

    max_iter = config.get("max_iter", 10)
    try:
        max_iter = int(max_iter)
    except Exception:
        max_iter = 10
    if max_iter < 0:
        max_iter = 0

    iter_n = int(state.get("iter", 0) or 0)

    cond, payload = _flatten_inputs(inputs)

    # Si ya alcanzó max_iter, forzamos salida
    if iter_n >= max_iter:
        fin = True
        out_routes = {"loop": None, "exit": payload}
        dbg = {"cond": cond, "iter": iter_n, "max_iter": max_iter, "fin": fin}
        return {"routes": out_routes, "debug": dbg, "_state": {"iter": iter_n}}

    # Condición
    if cond:
        # seguimos en loop: incrementa iter
        iter_n += 1
        fin = False
        out_routes = {"loop": payload, "exit": None}
    else:
        # salimos
        fin = True
        out_routes = {"loop": None, "exit": payload}

    dbg = {"cond": cond, "iter": iter_n, "max_iter": max_iter, "fin": fin}
    return {"routes": out_routes, "debug": dbg, "_state": {"iter": iter_n}}


```
## static
**app.js**
```js
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
    const newX = origX+dx;
    const newY = origY+dy;
    el.style.left = newX + "px";
    el.style.top  = newY + "px";
    
    // Actualizar también las propiedades x,y del nodo
    const nodeId = el.dataset.nodeId;
    const node = nodos.find(n => n.id === nodeId);
    if (node) {
      node.x = newX;
      node.y = newY;
    }
    
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

// ==================== MINI-MAPA ====================
const minimapCanvas = document.getElementById("minimap");
const minimapCtx = minimapCanvas ? minimapCanvas.getContext("2d") : null;

// Constantes del mundo (deben coincidir con #mundo en CSS)
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 3000;

// Throttle para el renderizado del mini-mapa
let minimapRenderScheduled = false;

/**
 * Renderiza el mini-mapa con vista general del grafo
 */
function renderMinimap() {
  if (!minimapCtx || !minimapCanvas) return;

  // Si ya hay un render programado, salir
  if (minimapRenderScheduled) return;
  
  minimapRenderScheduled = true;
  requestAnimationFrame(() => {
    minimapRenderScheduled = false;
    
    const canvas = minimapCanvas;
    const ctx = minimapCtx;

    // Ajustar la resolución del canvas para que sea nítido
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Calcular escala para que el mundo entero quepa en el mini-mapa
    const scaleX = rect.width / WORLD_WIDTH;
    const scaleY = rect.height / WORLD_HEIGHT;
    const minimapScale = Math.min(scaleX, scaleY);

    // Limpiar canvas
    ctx.fillStyle = "#EAEFEF";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Dibujar grid suave
    ctx.strokeStyle = "rgba(37, 52, 63, 0.05)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < WORLD_WIDTH; x += 200) {
      const sx = x * minimapScale;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 200) {
      const sy = y * minimapScale;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(rect.width, sy);
      ctx.stroke();
    }

    // Dibujar conexiones
    ctx.strokeStyle = "#FF9B51";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";

    conexiones.forEach(con => {
      const fromNode = nodos[con.from];
      const toNode = nodos[con.to];
      if (!fromNode || !toNode) return;

      // Obtener posiciones reales de los nodos
      const fromX = parseFloat(fromNode.el.style.left || "0");
      const fromY = parseFloat(fromNode.el.style.top || "0");
      const toX = parseFloat(toNode.el.style.left || "0");
      const toY = parseFloat(toNode.el.style.top || "0");
      
      // Usar dimensiones aproximadas (centro del nodo)
      const centerOffsetX = 110; // mitad de ancho mínimo (220px)
      const centerOffsetY = 65;  // mitad de alto mínimo (130px)

      const x1 = (fromX + centerOffsetX) * minimapScale;
      const y1 = (fromY + centerOffsetY) * minimapScale;
      const x2 = (toX + centerOffsetX) * minimapScale;
      const y2 = (toY + centerOffsetY) * minimapScale;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Dibujar nodos - obtener posiciones reales desde los elementos
    nodos.forEach(n => {
      // Leer posición real del elemento
      const nodeX = parseFloat(n.el.style.left || "0");
      const nodeY = parseFloat(n.el.style.top || "0");
      
      // Usar dimensiones aproximadas basadas en offsetWidth/offsetHeight
      const nodeWidth = n.el.offsetWidth || 220;
      const nodeHeight = n.el.offsetHeight || 130;
      
      const x = nodeX * minimapScale;
      const y = nodeY * minimapScale;
      const w = nodeWidth * minimapScale;
      const h = nodeHeight * minimapScale;

      // Nodo seleccionado con highlight
      if (n.id === selectedNodeId) {
        ctx.fillStyle = "#FF9B51";
        ctx.strokeStyle = "#25343F";
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#BFC9D1";
        ctx.lineWidth = 1;
      }

      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    });

    // Calcular y dibujar viewport actual
    const centroRect = centro.getBoundingClientRect();
    const viewportWidth = centroRect.width / scale;
    const viewportHeight = centroRect.height / scale;
    const viewportX = -translateX / scale;
    const viewportY = -translateY / scale;

    const vx = viewportX * minimapScale;
    const vy = viewportY * minimapScale;
    const vw = viewportWidth * minimapScale;
    const vh = viewportHeight * minimapScale;

    // Viewport semi-transparente
    ctx.fillStyle = "rgba(255, 155, 81, 0.15)";
    ctx.fillRect(vx, vy, vw, vh);

    // Borde del viewport
    ctx.strokeStyle = "#FF9B51";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.setLineDash([]);
  });
}

/**
 * Navega al punto clickeado en el mini-mapa
 */
function handleMinimapClick(e) {
  if (!minimapCanvas) return;

  const rect = minimapCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Convertir coordenadas del mini-mapa a coordenadas del mundo
  const scaleX = rect.width / WORLD_WIDTH;
  const scaleY = rect.height / WORLD_HEIGHT;
  const minimapScale = Math.min(scaleX, scaleY);

  const worldX = x / minimapScale;
  const worldY = y / minimapScale;

  // Calcular viewport
  const centroRect = centro.getBoundingClientRect();
  const viewportWidth = centroRect.width / scale;
  const viewportHeight = centroRect.height / scale;

  // Centrar el viewport en el punto clickeado
  translateX = -(worldX - viewportWidth / 2) * scale;
  translateY = -(worldY - viewportHeight / 2) * scale;

  aplicarTransform();
  actualizarConexiones();
  renderMinimap();
}

// Event listener para clicks en el mini-mapa
if (minimapCanvas) {
  minimapCanvas.addEventListener("click", handleMinimapClick);
}

// Llamar renderMinimap después de operaciones que cambian el grafo/viewport
const originalAplicarTransform = aplicarTransform;
aplicarTransform = function() {
  originalAplicarTransform();
  renderMinimap();
};

const originalActualizarConexiones = actualizarConexiones;
actualizarConexiones = function() {
  originalActualizarConexiones();
  renderMinimap();
};

// Renderizar mini-mapa inicial
requestAnimationFrame(() => {
  renderMinimap();
});


```
**styles.css**
```css
:root{
  --sidebar: 280px;
  --console: 340px;
  --gap: 12px;

  --nodo-min-w: 220px;
  --nodo-min-h: 130px;
  --port: 16px;

  /* Paleta corporativa */
  --primary: #25343F;
  --accent: #FF9B51;
  --border: #BFC9D1;
  --bg-light: #EAEFEF;
  --text-dark: #25343F;
  --text-light: #FFFFFF;
}

html,body{height:100%;}
body{
  margin:0;
  min-height:100vh;
  padding:12px;
  box-sizing:border-box;
  background:linear-gradient(135deg, #EAEFEF, #d5dfe3);
  color: var(--text-dark);

  /* MUY robusto ante resets: */
  display:grid !important;
  grid-template-columns: var(--sidebar) 1fr var(--console);
  grid-template-rows: auto 1fr;
  gap: var(--gap);
}

/* Header arriba ocupando todo */
header{
  grid-column: 1 / -1;
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;

  background: var(--primary);
  border:1px solid rgba(0,0,0,.15);
  border-radius:12px;
  padding:12px 16px;
  box-shadow:0 8px 32px rgba(37,52,63,.30), 0 2px 8px rgba(0,0,0,.15);
}

.btn{
  padding:8px 12px;
  border-radius:10px;
  border:1px solid var(--border);
  background:#fff;
  color: var(--text-dark);
  cursor:pointer;
  font:600 13px/1.2 system-ui;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow:0 2px 4px rgba(0,0,0,.08);
}
.btn svg {
  flex-shrink: 0;
}
.btn:hover{
  background: var(--accent);
  color: var(--text-light);
  border-color: var(--accent);
  box-shadow:0 4px 12px rgba(255,155,81,.35);
  transform:translateY(-1px);
}
.btn:active{
  transform:translateY(0px);
}

#play{
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:10px 18px;
  border-radius:12px;
  border:none;
  background: var(--accent);
  color: var(--text-light);
  cursor:pointer;
  font:700 14px/1.2 system-ui;
  box-shadow:0 4px 16px rgba(255,155,81,.45), 0 2px 4px rgba(0,0,0,.1);
  transition: all 0.2s ease;
}
#play svg {
  flex-shrink: 0;
}
#play:hover{
  background: #ff8a36;
  box-shadow:0 6px 24px rgba(255,155,81,.55), 0 4px 8px rgba(0,0,0,.15);
  transform:translateY(-2px);
}
#play:active{transform:translateY(0px)}

.btn-danger{
  padding:8px 12px;
  border-radius:10px;
  border:1px solid #f1b4b4;
  background:#fff1f2;
  color:#7f1d1d;
  cursor:pointer;
}

.muted{
  opacity:.75;
  font: 12px/1.3 system-ui;
  color: var(--bg-light);
}
code{
  font: 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: rgba(255,255,255,.1);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--accent);
}

/* ===== Panels ===== */
#tools,#console{
  background:#fff;
  border:1px solid var(--border);
  border-radius:14px;
  box-shadow:0 8px 24px rgba(37,52,63,.12);
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:12px;
  min-height:0;
  overflow:hidden;
}
#tools h3,#console h3{
  margin:0 0 6px 0;
  font:700 15px/1.2 system-ui;
  color: var(--primary);
  letter-spacing: 0.3px;
}

#tools h3 svg {
  stroke: var(--accent);
}

/* ===== Search Box ===== */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: var(--bg-light);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255,155,81,.15);
  background: #fff;
}

.search-box svg {
  flex-shrink: 0;
  color: var(--primary);
  stroke: var(--primary);
  transition: all 0.2s ease;
}

.search-box:focus-within svg {
  stroke: var(--accent);
  opacity: 1;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 9px 0;
  font: 12px/1.3 system-ui;
  color: var(--text-dark);
  outline: none;
}

.search-box input::placeholder {
  color: #9ca3af;
}

/* ===== Tools list compact ===== */
#tools-list{
  display:flex;
  flex-direction:column;
  gap:0;
  overflow:auto;
  padding-right:4px;
  position: relative;
}

#tools-list::-webkit-scrollbar {
  width: 6px;
}

#tools-list::-webkit-scrollbar-track {
  background: transparent;
}

#tools-list::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 3px;
  opacity: 0.5;
}

#tools-list::-webkit-scrollbar-thumb:hover {
  background: #ff8a36;
}

/* ===== Tool Category ===== */
.tool-category {
  margin-bottom: 8px;
}

.tool-category:not(:last-child)::after {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(90deg, transparent 10%, var(--border) 50%, transparent 90%);
  margin-top: 12px;
  opacity: 0.6;
}

.tool-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: linear-gradient(135deg, var(--bg-light), #f3f5f6);
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  user-select: none;
}

.tool-category-header:hover {
  background: var(--accent);
  color: var(--text-light);
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(255,155,81,.2);
}

.tool-category-header:hover svg {
  stroke: var(--text-light);
  opacity: 1;
}

.tool-category-header:active {
  transform: scale(0.98);
}

.tool-category-header.collapsed {
  margin-bottom: 0;
}

.tool-category-title {
  font: 600 11px/1.2 system-ui;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-category-title svg {
  flex-shrink: 0;
  opacity: 0.8;
  stroke: var(--primary);
  transition: all 0.2s ease;
}

.tool-category-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: rgba(255,155,81,.15);
  color: var(--accent);
  border-radius: 9px;
  font: 600 10px/1 system-ui;
  margin-left: auto;
}

.tool-category-header:hover .tool-category-count {
  background: rgba(255,255,255,.25);
  color: var(--text-light);
}

.tool-category-icon {
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-category-icon svg {
  stroke: var(--primary);
  transition: all 0.2s ease;
}

.tool-category-header:hover .tool-category-icon svg {
  stroke: var(--text-light);
}

.tool-category-header.collapsed .tool-category-icon {
  transform: rotate(-90deg);
}

.tool-category-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.tool-category-items.collapsed {
  max-height: 0;
  opacity: 0;
  visibility: hidden;
}

.tool-btn{
  width:100%;
  text-align:left;
  padding: 10px 12px;
  border-radius:8px;
  border:1px solid transparent;
  background: #fff;
  cursor:pointer;
  font:600 12px/1.3 system-ui;
  color: var(--primary);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  transition: all 0.2s ease;
  position: relative;
}

.tool-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
  border-radius: 8px 0 0 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tool-btn:hover{
  background: linear-gradient(135deg, #fff5ed, #fff);
  color: var(--accent);
  border-color: var(--accent);
  box-shadow:0 2px 8px rgba(255,155,81,.15);
  transform:translateX(4px);
  padding-left: 16px;
}

.tool-btn:hover::before {
  opacity: 1;
}

.tool-btn:active{
  transform:translateX(2px) translateY(1px);
}

.tool-btn.hidden {
  display: none;
}

.tool-btn-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  background: linear-gradient(135deg, var(--accent), #ff8a36);
  color: var(--text-light);
  border-radius: 6px;
  font: 600 9px/1 system-ui;
  margin-left: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 4px rgba(255,155,81,.3);
}

#toggle-all-categories:hover {
  background: var(--accent) !important;
  color: var(--text-light) !important;
  border-color: var(--accent) !important;
  transform: scale(1.1);
}

#toggle-all-categories:hover svg {
  stroke: var(--text-light);
}

#toggle-all-categories svg {
  transition: transform 0.2s ease;
}

/* ===== Console ===== */
#console pre{
  flex:1;
  background: var(--primary);
  color: var(--bg-light);
  border-radius:10px;
  padding:12px;
  overflow:auto;
  margin:0;
  font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
  box-shadow: inset 0 2px 8px rgba(0,0,0,.3);
  min-height: 200px;
}

/* ===== Mini-mapa ===== */
#minimap-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

#minimap-container h4 {
  margin: 0;
  font: 600 13px/1.2 system-ui;
  color: var(--primary);
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

#minimap-container h4 svg {
  stroke: var(--accent);
  flex-shrink: 0;
}

#minimap {
  width: 100%;
  height: 180px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-light);
  cursor: pointer;
  box-shadow: inset 0 1px 4px rgba(0,0,0,.1);
  transition: all 0.2s ease;
}

#minimap:hover {
  border-color: var(--accent);
  box-shadow: 
    inset 0 1px 4px rgba(0,0,0,.1),
    0 0 0 3px rgba(255,155,81,.15);
}

/* ===== Canvas ===== */
#centro{
  position:relative;
  overflow:hidden;
  border-radius:16px;
  box-shadow:0 8px 32px rgba(37,52,63,.18), inset 0 1px 0 rgba(255,255,255,.6);
  background: var(--bg-light);
  user-select:none;
  touch-action:none;
  border:1px solid var(--border);
  min-height:70vh;
}
#mundo{
  position:absolute;
  left:0; top:0;
  width:4000px; height:3000px;
  background-image: radial-gradient(circle at 1px 1px, rgba(37,52,63,0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  transform-origin: 0 0;
}
#edges{ position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; }

#hint{
  position:absolute;
  left:16px; bottom:16px;
  background: rgba(255,255,255,.92);
  border:1px solid var(--border);
  border-radius:12px;
  padding:10px 14px;
  font: 12px/1.3 system-ui;
  color: var(--primary);
  box-shadow:0 8px 24px rgba(37,52,63,.15);
  pointer-events:none;
}

/* ===== Nodes ===== */
article.node{
  position:absolute;
  left:0; top:0;

  /* CLAVE: no fijo; mínimo y crece con contenido */
  min-width: var(--nodo-min-w);
  min-height: var(--nodo-min-h);
  width: max-content;
  max-width: 520px;
  height: auto;

  border-radius:16px;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border:1px solid var(--border);
  box-shadow: 0 8px 24px rgba(37,52,63,0.15), inset 0 1px 0 rgba(255,255,255,.8);
  user-select:none;
  color: var(--text-dark);
  transition: box-shadow 0.2s ease;
}

article.node.dragging{ 
  opacity:.98;
  box-shadow: 0 16px 48px rgba(37,52,63,0.25), inset 0 1px 0 rgba(255,255,255,.8);
}

/* Selección */
article.node.selected{
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  box-shadow:
    0 12px 32px rgba(37,52,63,0.20),
    0 0 0 6px rgba(255, 155, 81, 0.20),
    inset 0 1px 0 rgba(255,255,255,.8);
}

.titlebar{
  position:absolute; left:0; top:0; right:0;
  height:36px;
  border-radius:16px 16px 12px 12px;
  background: linear-gradient(135deg, var(--primary), #344858);
  box-shadow:inset 0 -1px 0 rgba(255,255,255,.12), 0 2px 8px rgba(37,52,63,.15);
  cursor:grab;
}
.titlebar:active{ cursor:grabbing; }

.title{
  position:absolute;
  top:10px; left:14px; right:14px;
  font:700 13px/1 ui-sans-serif, system-ui;
  color: var(--text-light);
  text-shadow:0 1px 3px rgba(0,0,0,.35);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title svg {
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.3));
}

.body{
  position:relative;
  margin-top:36px;
  padding:12px 14px 14px 14px;
  display:flex;
  flex-direction:column;
  gap:8px;
  align-items:stretch;
}

/* Inputs / textos dentro del nodo */
.body input,
.body textarea,
.body select{
  width:100%;
  max-width:100%;
  min-width:0;
  box-sizing:border-box;
  padding:9px 11px;
  border-radius:10px;
  border:1px solid var(--border);
  background:#fff;
  font: 12px/1.3 system-ui;
  color: var(--text-dark);
  transition: all 0.2s ease;
}
.body input:focus,
.body textarea:focus,
.body select:focus{
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255,155,81,.15);
}
.body textarea{resize:vertical; min-height:60px;}
.body .muted{font-size:12px; color: #6b7280;}

/* Output render */
.run-output{
  margin:0;
  padding:10px 12px;
  border-radius:10px;
  border:1px solid var(--border);
  background: var(--primary);
  color: var(--bg-light);
  overflow:auto;
  max-height:140px;
  font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  box-shadow: inset 0 2px 6px rgba(0,0,0,.2);
}

/* Ports */
.port{
  position:absolute;
  width:var(--port); height:var(--port);
  border-radius:50%;
  background: radial-gradient(circle at 30% 30%, #fff, #ffcda9);
  border:2px solid var(--accent);
  box-shadow: 0 0 0 2px rgba(255,255,255,.9), 0 4px 12px rgba(255,155,81,.4);
  display:grid; place-items:center;
  touch-action:none;
  transition: all 0.2s ease;
}
.port::after{
  content:""; 
  width:6px; 
  height:6px; 
  border-radius:50%; 
  background: var(--accent);
  box-shadow:0 0 8px var(--accent);
}

.port.in{
  left: calc(-.5 * var(--port));
  top: 50%;
  transform: translateY(-50%);
}
.port.out{
  right: calc(-.5 * var(--port));
  top: 50%;               /* puede ser sobreescrito por style.top via NODE_API */
  transform: translateY(-50%);
}

.port:hover{
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 0 0 3px rgba(255,255,255,.9), 0 6px 16px rgba(255,155,81,.5);
}

.port.highlight{
  border-color: #4ade80;
  box-shadow:0 0 0 3px rgba(255,255,255,.9), 0 0 24px rgba(74,222,128,.7);
}
.port.highlight::after{
  background: #4ade80;
  box-shadow:0 0 12px #4ade80;
}

/* Edge paths */
.edge-path{ 
  fill:none; 
  stroke: var(--accent); 
  stroke-width:3.5; 
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.15)); 
}
.edge-path.bg{ 
  stroke: #ffcda9; 
  stroke-width:8; 
  opacity:.6; 
}
.edge-path.preview{ 
  stroke-dasharray:10 8; 
  opacity:.75; 
}
.edge-path.glow{ 
  stroke: var(--accent); 
  stroke-width:10; 
  filter: blur(10px); 
  opacity:.35; 
}

/* ===== Scrollbars personalizadas ===== */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--bg-light);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 5px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

/* Firefox scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--border) var(--bg-light);
}

/* ===== Animaciones suaves ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tool-btn,
.btn,
article.node {
  animation: fadeIn 0.3s ease-out;
}

/* ===== Mejoras de accesibilidad ===== */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Utilidades ===== */
.status-ok {
  color: #4ade80;
  font-weight: 600;
}

.status-bad {
  color: #f48771;
  font-weight: 600;
}

/* ===== Responsive (tablet y móvil) ===== */
@media (max-width: 1024px) {
  body {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
  }
  
  #tools, #console {
    min-height: 200px;
  }
}

```
### modules
**cmp_common.js**
```js
export function buildSimpleCompareBody(el, label, def=""){
  const body = el.querySelector(".body");
  body.innerHTML = `
    <label style="font:600 12px system-ui;opacity:.8">${label}</label>
    <input 
      data-config-key="value"
      type="text" 
      value="${def}" 
      placeholder="${label}"
      style="font-size:12px"
    />
    <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      Compara entrada vs constante
    </div>
  `;
}
export function readSimple(el){
  const config = {};
  el.querySelectorAll("[data-config-key]").forEach(inp => {
    const key = inp.dataset.configKey;
    config[key] = inp.value;
  });
  return config;
}
export function renderBool(el, data){
  const body = el.querySelector(".body");
  const existing = body.querySelector(".run-output");
  if (existing) existing.remove();

  const output = document.createElement("div");
  output.className = "run-output";
  output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

  const ok = data?.result === true;
  output.innerHTML = `
    <div style="color:${ok ? '#4ade80' : '#f48771'};font-weight:600">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${ok ? '3' : '2.5'}" style="vertical-align:-1px;margin-right:4px;">
        ${ok ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
      </svg>
      ${ok ? 'true' : 'false'}
    </div>
  `;

  body.appendChild(output);
}


```
**cmp_contains.js**
```js
import { buildSimpleCompareBody, readSimple, renderBool } from "/static/modules/cmp_common.js";
export default {
  type: "cmp_contains",
  buildBody(el){ buildSimpleCompareBody(el, "Subcadena (contains)", ""); },
  readConfig: readSimple,
  renderResult: renderBool
};


```
**cmp_eq.js**
```js
import { buildSimpleCompareBody, readSimple, renderBool } from "/static/modules/cmp_common.js";
export default {
  type: "cmp_eq",
  buildBody(el){ buildSimpleCompareBody(el, "Constante (==)", ""); },
  readConfig: readSimple,
  renderResult: renderBool
};


```
**cmp_gt.js**
```js
import { buildSimpleCompareBody, readSimple, renderBool } from "/static/modules/cmp_common.js";
export default {
  type: "cmp_gt",
  buildBody(el){ buildSimpleCompareBody(el, "Constante (>)", "0"); },
  readConfig: readSimple,
  renderResult: renderBool
};


```
**cmp_lt.js**
```js
import { buildSimpleCompareBody, readSimple, renderBool } from "/static/modules/cmp_common.js";
export default {
  type: "cmp_lt",
  buildBody(el){ buildSimpleCompareBody(el, "Constante (<)", "0"); },
  readConfig: readSimple,
  renderResult: renderBool
};


```
**cmp_neq.js**
```js
import { buildSimpleCompareBody, readSimple, renderBool } from "/static/modules/cmp_common.js";
export default {
  type: "cmp_neq",
  buildBody(el){ buildSimpleCompareBody(el, "Constante (!=)", ""); },
  readConfig: readSimple,
  renderResult: renderBool
};


```
**comparar.js**
```js
// static/modules/comparar.js
export default {
  type: "comparar",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    const defOp  = toolSpec?.config?.op?.default  ?? "==";
    const defRhs = toolSpec?.config?.rhs?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Operador</label>
      <select data-config-key="op" style="font-size:12px">
        ${["<", ">", "==", "!=", "contains"].map(o => 
          `<option value="${o}" ${o===defOp?"selected":""}>${o}</option>`
        ).join("")}
      </select>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor a comparar</label>
      <input 
        data-config-key="rhs"
        type="text" 
        value="${defRhs}" 
        placeholder="comparar contra..."
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        Compara input0 con el valor especificado
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const opSelect = body.querySelector('[data-config-key="op"]');
    
    const refreshTitle = () => {
      const op = opSelect.value;
      titleEl.textContent = `⚖️ Comparar ${op}`;
    };

    opSelect.addEventListener("change", refreshTitle);
    refreshTitle();
    return true;
  },

  readConfig(el) {
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const result = !!data?.data;
    output.innerHTML = `
      <div style="color:${result ? '#4ade80' : '#f48771'};font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${result ? '3' : '2.5'}" style="vertical-align:-1px;margin-right:4px;">
          ${result ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
        </svg>
        ${result ? 'true' : 'false'}
      </div>
    `;

    body.appendChild(output);
  }
};


```
**constante.js**
```js
export default {
  type: "constante",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Nombre (opcional)</label>
      <input 
        id="name_${nodeId}" 
        data-config-key="name"
        placeholder="PI, IVA, etc." 
        value="" 
        style="font-size:12px"
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor</label>
      <input 
        id="value_${nodeId}" 
        data-config-key="value"
        placeholder="texto o número" 
        value="1" 
        style="font-size:12px"
      />
    `;

    const titleEl = el.querySelector(".title");
    const nameEl = body.querySelector('[data-config-key="name"]');
    const valueEl = body.querySelector('[data-config-key="value"]');

    const refreshTitle = ()=>{
      const n = (nameEl.value || "").trim();
      const v = (valueEl.value || "").trim() || "¿?";
      titleEl.innerHTML = n ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/></svg>${n} = ${v}` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/></svg>Constante = ${v}`;
    };

    nameEl.addEventListener("input", refreshTitle);
    valueEl.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">Tipo: ${data.type || 'unknown'}</div>
      <div style="color:#d1d5db;margin-top:4px">${String(data.value)}</div>
    `;

    body.appendChild(output);
  }
};


```
**copiarencarpeta.js**
```js
import { openFolderPicker } from "/static/modules/folderpicker.js";

export default {
  type: "copiarencarpeta",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Carpeta destino</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <input 
          id="dest_${nodeId}" 
          data-config-key="dest"
          type="text" 
          value="" 
          placeholder="workflows/backup" 
          style="flex:1;font-size:12px"
        />
        <button type="button" class="btn btn-browse" style="font-size:11px;padding:4px 8px;display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
        </svg>
        Copia archivos desde entrada
      </div>
    `;
    body.querySelector(".btn-browse").addEventListener("click", async ()=>{
      const current = body.querySelector("input").value.trim();
      const chosen = await openFolderPicker(current);
      if (chosen) body.querySelector("input").value = chosen;
    });
  },

  readConfig(el) {
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const skippedCount = (data.skipped || []).length;
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        ${data.copied} archivo${data.copied !== 1 ? 's' : ''} copiado${data.copied !== 1 ? 's' : ''}
      </div>
      <div style="color:#d1d5db;margin-top:4px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        ${data.dest}
      </div>
      ${skippedCount ? '<div style="color:#f48771;margin-top:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' + skippedCount + ' omitidos</div>' : ''}
    `;

    body.appendChild(output);
  }
};


```
**escribir_csv.js**
```js
export default {
  type: "escribir_csv",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8;display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <path d="M17 21v-8H7v8M7 3v5h8"/>
        </svg>
        Archivo destino
      </label>
      <input 
        type="text" 
        data-config-key="archivo" 
        placeholder="salida.csv" 
        style="font-size:12px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Delimitador</label>
      <input 
        type="text" 
        data-config-key="delimiter" 
        value="," 
        maxlength="1"
        style="font-size:12px;width:40px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">
        <input 
          type="checkbox" 
          data-config-key="incluir_encabezado" 
          checked
        />
        Incluir encabezado
      </label>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Codificación</label>
      <select data-config-key="encoding" style="font-size:12px">
        <option value="utf-8">UTF-8</option>
        <option value="latin-1">Latin-1</option>
        <option value="cp1252">Windows-1252</option>
      </select>
    `;

    const titleEl = el.querySelector(".title");
    const archivoInput = body.querySelector('[data-config-key="archivo"]');
    
    const refreshTitle = () => {
      const archivo = archivoInput.value.trim();
      if (archivo) {
        const filename = archivo.split(/[/\\]/).pop();
        titleEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Guardar: ${filename}`;
      } else {
        titleEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Escribir CSV';
      }
    };

    archivoInput.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === "checkbox") {
        config[key] = inp.checked;
      } else {
        config[key] = inp.value;
      }
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    if (data.ok) {
      const filas = data.filas_escritas || 0;
      const archivo = data.archivo || '';
      const filename = archivo.split(/[/\\]/).pop();
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          CSV guardado
        </div>
        <div style="color:#d1d5db;margin-top:4px">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          ${filename}
        </div>
        <div style="color:#6b7280;margin-top:2px">${filas} filas escritas</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }

    body.appendChild(output);
  }
};

```
**extraer_campo.js**
```js
export default {
  type: "extraer_campo",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Campo a extraer</label>
      <input 
        type="text" 
        data-config-key="campo" 
        placeholder="nombre, id, email..." 
        style="font-size:12px" 
      />
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        Convierte [{"name":"Ana"},{"name":"Bob"}]<br>en ["Ana", "Bob"]
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const campoInput = body.querySelector('[data-config-key="campo"]');
    
    const refreshTitle = () => {
      const campo = campoInput.value.trim();
      if (campo) {
        titleEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Extraer: ${campo}`;
      } else {
        titleEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Extraer Campo';
      }
    };

    campoInput.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const campo = data.campo || '';
      const preview = data.data?.slice(0, 10) || [];
      
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600;margin-bottom:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          ${count} valores extraídos
        </div>
        <div style="color:#6b7280;margin-bottom:4px">Campo: ${campo}</div>
        <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 10 ? '<div style="color:#6b7280;margin-top:4px">... y ' + (count - 10) + ' valores más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }

    body.appendChild(output);
  }
};

```
**filtrar.js**
```js
export default {
  type: "filtrar",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Campo a evaluar</label>
      <input 
        type="text" 
        data-config-key="campo" 
        placeholder="nombre, edad, precio..." 
        style="font-size:12px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Operador</label>
      <select data-config-key="operador" style="font-size:12px">
        <option value="==">== (igual)</option>
        <option value="!=">!= (diferente)</option>
        <option value=">">> (mayor que)</option>
        <option value="<">< (menor que)</option>
        <option value=">=">>= (mayor o igual)</option>
        <option value="<="><= (menor o igual)</option>
        <option value="contains">contiene (texto)</option>
        <option value="not_contains">no contiene (texto)</option>
      </select>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor</label>
      <input 
        type="text" 
        data-config-key="valor" 
        placeholder="valor a comparar" 
        style="font-size:12px" 
      />
    `;

    const titleEl = el.querySelector(".title");
    const campoInput = body.querySelector('[data-config-key="campo"]');
    const operadorSelect = body.querySelector('[data-config-key="operador"]');
    const valorInput = body.querySelector('[data-config-key="valor"]');
    
    const refreshTitle = () => {
      const campo = campoInput.value.trim();
      const operador = operadorSelect.value;
      const valor = valorInput.value.trim();
      
      if (campo && valor) {
        titleEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>${campo} ${operador} ${valor}`;
      } else if (campo) {
        titleEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Filtrar ${campo}`;
      } else {
        titleEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Filtrar';
      }
    };

    campoInput.addEventListener("input", refreshTitle);
    operadorSelect.addEventListener("change", refreshTitle);
    valorInput.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const original = data.original_count || 0;
      const filtrado = data.filtrado || 0;
      const preview = data.data?.slice(0, 3) || [];
      
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600;margin-bottom:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          ${count} de ${original} elementos
          ${filtrado > 0 ? `<span style="color:#6b7280">(${filtrado} filtrados)</span>` : ''}
        </div>
        <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 3 ? '<div style="color:#6b7280;margin-top:4px">... y ' + (count - 3) + ' elementos más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }

    body.appendChild(output);
  }
};

```
**folderpicker.js**
```js
export async function openFolderPicker(initialPath = "") {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.25);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;
  const modal = document.createElement("div");
  modal.style.cssText = `
    width:720px; max-height:70vh; background:#fff; border:1px solid #e5e7f0; border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.25); display:flex; flex-direction:column; overflow:hidden;
    font:13px system-ui;
  `;
  modal.innerHTML = `
    <div style="padding:10px 12px; background:linear-gradient(90deg,#6aa3ff,#9c7bff); color:#fff; font-weight:600;">
      Seleccionar carpeta
    </div>
    <div style="padding:8px 12px; display:flex; gap:8px; align-items:center;">
      <button data-role="up" class="btn">↑ Subir</button>
      <input type="text" data-role="path" style="flex:1; padding:6px 8px; border:1px solid #cfd7ea; border-radius:8px;" />
      <button data-role="choose" class="btn">Elegir esta carpeta</button>
    </div>
    <div data-role="list" style="padding:0 12px 12px; overflow:auto; flex:1;"></div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const pathInput = modal.querySelector('[data-role="path"]');
  const listEl    = modal.querySelector('[data-role="list"]');
  const upBtn     = modal.querySelector('[data-role="up"]');
  const chooseBtn = modal.querySelector('[data-role="choose"]');

  function row(html){ const d=document.createElement("div"); d.innerHTML=html; return d.firstElementChild; }

  async function loadDir(p) {
    const url = new URL("/api/fs/list", window.location.origin);
    if (p) url.searchParams.set("path", p);
    const res = await fetch(url).then(r=>r.json());
    if (res.error) throw new Error(res.error);
    pathInput.value = res.cwd;

    listEl.innerHTML = "";
    res.items.forEach(it=>{
      const el = row(`
        <div class="fp-item" style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-bottom:1px solid #f1f4fb; cursor:pointer;">
          <div style="width:20px; text-align:center;">
            ${it.is_dir 
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' 
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>'}
          </div>
          <div style="flex:1">${it.name}</div>
        </div>
      `);
      el.addEventListener("click", ()=>{
        if (it.is_dir) loadDir(it.path);
      });
      listEl.appendChild(el);
    });

    upBtn.disabled = !res.parent;
    upBtn.onclick = ()=> res.parent && loadDir(res.parent);
    chooseBtn.onclick = ()=> {
      const chosen = pathInput.value.trim();
      cleanup();
      resolve(chosen);
    };
  }

  function cleanup(){ overlay.remove(); }

  let resolve;
  const done = new Promise(r=> resolve = r);

  overlay.addEventListener("click", (e)=>{ if (e.target === overlay) cleanup(); });
  window.addEventListener("keydown", function esc(ev){
    if(ev.key==="Escape"){
      cleanup();
      window.removeEventListener("keydown", esc);
    }
  });

  await loadDir(initialPath);
  return done;
}


```
**if_router.js**
```js
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


```
**ifnode.js**
```js
export default {
  type: "ifnode",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Expresión (usa <code>x</code>)</label>
      <input 
        id="expr_${nodeId}" 
        data-config-key="expr"
        value="bool(x)" 
        style="font-size:12px"
      />
      
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        Ejemplos: <code>x > 10</code>, <code>'ok' in str(x)</code>
      </div>
    `;

    // puertos: true/false
    window.NODE_API?.rebuildOutPorts?.(el, [
      { name:"true",  title:"Salida (true)",  topPct:35 },
      { name:"false", title:"Salida (false)", topPct:65 }
    ]);
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:150px;overflow:auto";

    if (data.error) {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error}
      </div>`;
    } else {
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Evaluado
        </div>
        <pre style="margin:4px 0 0 0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(data, null, 2).slice(0, 300)}</pre>
      `;
    }

    body.appendChild(output);
  }
};


```
**imprimir.js**
```js
export default {
  type: "imprimir",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.prefix?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Prefijo (opcional)</label>
      <input 
        data-config-key="prefix"
        type="text" 
        value="${def}" 
        placeholder="ej: Resultado"
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        📋 Imprime datos en la consola
      </div>
    `;
  },
  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600;margin-bottom:4px">🖨️ ${data?.message || 'Impreso'}</div>
      <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(data?.value, null, 2).slice(0, 500)}</pre>
    `;

    body.appendChild(output);
  }
};


```
**leer_csv.js**
```js
export default {
  type: "leer_csv",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8;display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
          <path d="M13 2v7h7"/>
        </svg>
        Archivo CSV
      </label>
      <input 
        type="text" 
        data-config-key="archivo" 
        placeholder="datos.csv o ruta/datos.csv" 
        style="font-size:12px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Delimitador</label>
      <input 
        type="text" 
        data-config-key="delimiter" 
        value="," 
        maxlength="1"
        style="font-size:12px;width:40px" 
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">
        <input 
          type="checkbox" 
          data-config-key="tiene_encabezado" 
          checked
        />
        Primera fila es encabezado
      </label>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Codificación</label>
      <select data-config-key="encoding" style="font-size:12px">
        <option value="utf-8">UTF-8</option>
        <option value="latin-1">Latin-1</option>
        <option value="cp1252">Windows-1252</option>
      </select>
    `;

    const titleEl = el.querySelector(".title");
    const archivoInput = body.querySelector('[data-config-key="archivo"]');
    
    const refreshTitle = () => {
      const archivo = archivoInput.value.trim();
      if (archivo) {
        const filename = archivo.split(/[/\\]/).pop();
        titleEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>Leer: ${filename}`;
      } else {
        titleEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>Leer CSV';
      }
    };

    archivoInput.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === "checkbox") {
        config[key] = inp.checked;
      } else {
        config[key] = inp.value;
      }
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const preview = data.data?.slice(0, 3) || [];
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600;margin-bottom:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Cargadas ${count} filas
        </div>
        <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 3 ? '<div style="color:#6b7280;margin-top:4px">... y ' + (count - 3) + ' filas más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }

    body.appendChild(output);
  }
};

```
**listarcarpetas.js**
```js
import { openFolderPicker } from "/static/modules/folderpicker.js";

export default {
  type: "listarcarpetas",

  buildBody(el, toolSpec, nodeId) {
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.path?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Ruta de carpeta</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <input 
          id="path_${nodeId}" 
          data-config-key="path"
          type="text" 
          value="${def}" 
          placeholder="workflows" 
          style="flex:1;font-size:12px"
        />
        <button type="button" class="btn btn-browse" style="font-size:11px;padding:4px 8px;display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
    `;
    body.querySelector(".btn-browse").addEventListener("click", async ()=>{
      const current = body.querySelector("input").value.trim();
      const chosen = await openFolderPicker(current);
      if (chosen) body.querySelector("input").value = chosen;
    });
  },

  readConfig(el) {
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data) {
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:150px;overflow:auto";

    const files = (data.files || []);
    const names = files.slice(0, 8).map(f => {
      const icon = f.is_dir 
        ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
        : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>';
      return icon + f.name;
    });
    
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600;margin-bottom:4px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        ${files.length} elementos
      </div>
      <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${names.join('\n')}</pre>
      ${files.length > 8 ? '<div style="color:#6b7280;margin-top:4px">... y ' + (files.length - 8) + ' más</div>' : ''}
    `;

    body.appendChild(output);
  }
};


```
**mapear.js**
```js
export default {
  type: "mapear",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Operación</label>
      <select data-config-key="operacion" id="op_${nodeId}" style="font-size:12px">
        <option value="extraer_campos">Extraer campos específicos</option>
        <option value="renombrar_campo">Renombrar un campo</option>
        <option value="agregar_campo">Agregar campo nuevo</option>
      </select>

      <div id="campos_container_${nodeId}" style="margin-top:8px">
        <label style="font:600 12px system-ui;opacity:.8">Campos (separados por coma)</label>
        <input 
          type="text" 
          data-config-key="campos" 
          placeholder="nombre, edad, ciudad" 
          style="font-size:12px" 
        />
      </div>

      <div id="renombrar_container_${nodeId}" style="margin-top:8px;display:none">
        <label style="font:600 12px system-ui;opacity:.8">Campo origen</label>
        <input 
          type="text" 
          data-config-key="campo_origen" 
          placeholder="nombre_viejo" 
          style="font-size:12px" 
        />
        <label style="font:600 12px system-ui;opacity:.8;margin-top:4px">Campo destino</label>
        <input 
          type="text" 
          data-config-key="campo_destino" 
          placeholder="nombre_nuevo" 
          style="font-size:12px" 
        />
      </div>

      <div id="agregar_container_${nodeId}" style="margin-top:8px;display:none">
        <label style="font:600 12px system-ui;opacity:.8">Nombre del nuevo campo</label>
        <input 
          type="text" 
          data-config-key="campo_destino" 
          placeholder="nuevo_campo" 
          style="font-size:12px" 
        />
        <label style="font:600 12px system-ui;opacity:.8;margin-top:4px">Valor</label>
        <input 
          type="text" 
          data-config-key="valor_nuevo" 
          placeholder="valor constante" 
          style="font-size:12px" 
        />
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const opSelect = body.querySelector(`#op_${nodeId}`);
    const camposContainer = body.querySelector(`#campos_container_${nodeId}`);
    const renombrarContainer = body.querySelector(`#renombrar_container_${nodeId}`);
    const agregarContainer = body.querySelector(`#agregar_container_${nodeId}`);
    
    const updateVisibility = () => {
      const op = opSelect.value;
      camposContainer.style.display = op === "extraer_campos" ? "block" : "none";
      renombrarContainer.style.display = op === "renombrar_campo" ? "block" : "none";
      agregarContainer.style.display = op === "agregar_campo" ? "block" : "none";
      
      const labels = {
        "extraer_campos": '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>Extraer campos',
        "renombrar_campo": '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>Renombrar',
        "agregar_campo": '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>Agregar campo'
      };
      titleEl.innerHTML = labels[op] || '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>Mapear';
    };

    opSelect.addEventListener("change", updateVisibility);
    updateVisibility();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px;max-height:200px;overflow:auto";

    if (data.ok) {
      const count = data.count || 0;
      const preview = data.data?.slice(0, 3) || [];
      
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600;margin-bottom:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          ${count} elementos transformados
        </div>
        <pre style="margin:0;color:#d1d5db;white-space:pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
        ${count > 3 ? '<div style="color:#6b7280;margin-top:4px">... y ' + (count - 3) + ' elementos más</div>' : ''}
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }

    body.appendChild(output);
  }
};

```
**operador.js**
```js
export default {
  type: "operador",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defOp = toolSpec?.config?.op?.default ?? "+";
    const defB  = toolSpec?.config?.b?.default ?? "0";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Operador</label>
      <select data-config-key="op" style="font-size:12px">
        ${["+","-","*","/","%","==","!=","<",">","<=",">="].map(o=>`<option value="${o}" ${o===defOp?"selected":""}>${o}</option>`).join("")}
      </select>

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">B (si no hay input1)</label>
      <input 
        data-config-key="b"
        type="text" 
        value="${defB}" 
        placeholder="0"
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        A = input0, B = input1 (o constante)
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const opSelect = body.querySelector('[data-config-key="op"]');
    
    const refreshTitle = () => {
      const op = opSelect.value;
      titleEl.textContent = `➕ Operador ${op}`;
    };

    opSelect.addEventListener("change", refreshTitle);
    refreshTitle();
  },
  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    if(data?.type === "error"){
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        ${data.error || 'Error'}
      </div>`;
    }else{
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">Resultado</div>
        <div style="color:#d1d5db;margin-top:4px">${String(data?.value)}</div>
      `;
    }

    body.appendChild(output);
  }
};


```
**sequence.js**
```js
export default {
  type: "sequence",

  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defPasos = toolSpec?.config?.pasos?.default ?? 2;
    const defCic   = toolSpec?.config?.ciclico?.default ?? false;

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Pasos (salidas 1..N)</label>
      <input 
        id="pasos_${nodeId}" 
        data-config-key="pasos"
        type="number" 
        min="1" 
        max="12" 
        value="${defPasos}"
        style="font-size:12px"
      />
      
      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px;display:flex;align-items:center;gap:8px;">
        <input 
          id="ciclico_${nodeId}" 
          data-config-key="ciclico"
          type="checkbox" 
          ${defCic ? "checked":""}
        />
        Cíclico
      </label>
      
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Ejecuta pasos en secuencia
      </div>
    `;

    // puertos: eliminamos out existentes y creamos 1..N
    el.querySelectorAll(".port.out").forEach(p=>p.remove());

    const pasos = Math.max(1, Math.min(12, parseInt(defPasos,10) || 2));
    for(let i=1;i<=pasos;i++){
      const p = document.createElement("div");
      p.className = "port out";
      p.dataset.port = String(i);
      p.title = `Salida paso ${i}`;
      p.style.top = `${(i/(pasos+1))*100}%`;
      el.appendChild(p);
      p.addEventListener("mousedown",(e)=>{
        e.stopPropagation();
        // usa la función global del editor
        iniciarConexionDesdeSalida(e, el, p);
      });
    }
    return true;
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === 'checkbox') {
        config[key] = inp.checked;
      } else if (inp.type === 'number') {
        config[key] = parseInt(inp.value, 10);
      } else {
        config[key] = inp.value;
      }
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const r = data?.result || {};
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Paso ${r.paso ?? '?'}/${r.pasos ?? '?'}
      </div>
      ${r.fin ? '<div style="color:#6b7280;margin-top:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:2px;"><path d="M20 6L9 17l-5-5"/></svg>Finalizado</div>' : ''}
    `;

    body.appendChild(output);
  }
};


```
**var_get.js**
```js
export default {
  type: "var_get",
  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const defN = toolSpec?.config?.name?.default ?? "x";
    const defD = toolSpec?.config?.default?.default ?? "";
    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Nombre de variable</label>
      <input 
        id="name_${nodeId}" 
        data-config-key="name"
        type="text" 
        value="${defN}" 
        placeholder="x"
        style="font-size:12px"
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor por defecto</label>
      <input 
        id="default_${nodeId}" 
        data-config-key="default"
        type="text" 
        value="${defD}" 
        placeholder="(si no existe)"
        style="font-size:12px"
      />
    `;

    const titleEl = el.querySelector(".title");
    const nameInput = body.querySelector('[data-config-key="name"]');
    
    const refreshTitle = () => {
      const name = nameInput.value.trim() || "x";
      titleEl.textContent = `Obtener: ${name}`;
    };

    nameInput.addEventListener("input", refreshTitle);
    refreshTitle();
  },
  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },
  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    if (data?.name) {
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">${data.name}</div>
        <div style="color:#d1d5db;margin-top:4px">${String(data.value)}</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Variable no encontrada
      </div>`;
    }

    body.appendChild(output);
  }
};


```
**var_set.js**
```js
export default {
  type: "var_set",

  buildBody(el, tool, nodeId){
    const body = el.querySelector(".body");

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Variable</label>
      <input 
        id="name_${nodeId}" 
        data-config-key="name"
        placeholder="nombre" 
        value="x"
        style="font-size:12px"
      />

      <label style="font:600 12px system-ui;opacity:.8;margin-top:8px">Valor inicial (opcional)</label>
      <input 
        id="value_${nodeId}" 
        data-config-key="value"
        placeholder="(vacío = usar entrada si llega)" 
        value=""
        style="font-size:12px"
      />

      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        Si recibe entrada, se usa como valor.<br>
        Si no, se usa el valor inicial.
      </div>
    `;

    const titleEl = el.querySelector(".title");
    const nameEl = body.querySelector('[data-config-key="name"]');
    const valueEl = body.querySelector('[data-config-key="value"]');

    const refreshTitle = ()=>{
      const n = (nameEl.value || "").trim() || "¿?";
      const v = (valueEl.value || "").trim();
      titleEl.innerHTML = v ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>${n} = ${v}` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Asignar ${n}`;
    };

    nameEl.addEventListener("input", refreshTitle);
    valueEl.addEventListener("input", refreshTitle);
    refreshTitle();
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      config[key] = inp.value;
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    if (data?.name) {
      output.innerHTML = `
        <div style="color:#4ade80;font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-1px;margin-right:4px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          ${data.name}
        </div>
        <div style="color:#d1d5db;margin-top:4px">${String(data.value)}</div>
      `;
    } else {
      output.innerHTML = `<div style="color:#f48771">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Error asignando variable
      </div>`;
    }

    body.appendChild(output);
  }
};


```
**while_node.js**
```js
// static/modules/while_node.js
export default {
  type: "while_node",

  buildBody(el, toolSpec, nodeId){
    const body = el.querySelector(".body");
    const def = toolSpec?.config?.max_iter?.default ?? 50;

    body.innerHTML = `
      <label style="font:600 12px system-ui;opacity:.8">Máximo de iteraciones</label>
      <input 
        id="max_${nodeId}" 
        data-config-key="max_iter"
        type="number" 
        min="1" 
        max="100000" 
        value="${def}"
        style="font-size:12px"
      />
      
      <div style="margin-top:6px;font-size:10px;color:#6b7280;line-height:1.4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
        </svg>
        Entrada: <code>{cond, payload}</code><br>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:2px;">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        Salidas: <code>loop</code> y <code>salir</code>
      </div>
    `;

    window.NODE_API?.rebuildOutPorts?.(el, [
      { name: "loop",  title: "Vuelve a iterar (loop)", topPct: 35 },
      { name: "salir", title: "Salida final (salir)",  topPct: 65 }
    ]);
  },

  readConfig(el){
    const config = {};
    el.querySelectorAll("[data-config-key]").forEach(inp => {
      const key = inp.dataset.configKey;
      if (inp.type === 'number') {
        config[key] = parseInt(inp.value, 10);
      } else {
        config[key] = inp.value;
      }
    });
    return config;
  },

  renderResult(el, data){
    const body = el.querySelector(".body");
    const existing = body.querySelector(".run-output");
    if (existing) existing.remove();

    const output = document.createElement("div");
    output.className = "run-output";
    output.style.cssText = "margin-top:8px;padding:8px;background:#25343F;border-radius:4px;font-size:11px";

    const r = data?.result || {};
    output.innerHTML = `
      <div style="color:#4ade80;font-weight:600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
        </svg>
        Iteración ${r.iter ?? '?'}/${r.max_iter ?? '?'}
      </div>
      <div style="color:#d1d5db;margin-top:4px">
        Condición: ${r.cond ? 'true' : 'false'}${r.fin ? ' (finalizado)' : ''}
      </div>
    `;

    body.appendChild(output);
  }
};


```
## templates
**index.html**
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>NodeFlow - Flask</title>
  <link rel="icon" type="image/png" href="https://static.agusmadev.es/logos/logo-naranja-blanco.png">
  <link rel="stylesheet" href="https://jocarsa.github.io/cssreset/cssreset.css">
  <link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}">
</head>
<body>
  <header>
    <button id="play" class="btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
      Ejecutar grafo
    </button>
    <button id="deleteNode" class="btn" title="Elimina el nodo seleccionado (Supr)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
      </svg>
      Eliminar
    </button>
    <div style="border-left: 1px solid rgba(255,255,255,.25); height: 28px; margin: 0 6px;"></div>
    <button id="saveBtn" class="btn" title="Guardar workflow (Ctrl+S)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
        <path d="M17 21v-8H7v8M7 3v5h8"/>
      </svg>
      Guardar
    </button>
    <button id="loadBtn" class="btn" title="Cargar workflow">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
      Cargar
    </button>
    <button id="exportBtn" class="btn" title="Exportar como JSON">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
      </svg>
      Exportar
    </button>
    <button id="importBtn" class="btn" title="Importar desde JSON">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      Importar
    </button>
    <button id="newBtn" class="btn" title="Nuevo workflow (limpia todo)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6M12 18v-6M9 15h6"/>
      </svg>
      Nuevo
    </button>
    <div class="muted">Pan: Ctrl + arrastrar · Zoom: Ctrl + rueda · Selección: clic · Borrar: Supr</div>
    <div class="muted">BASE_DIR: <code>{{ base_dir }}</code></div>
  </header>

  <section id="tools">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <h3 style="margin:0;display:flex;align-items:center;gap:8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        Herramientas
      </h3>
      <button 
        id="toggle-all-categories" 
        type="button"
        style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer;font-size:10px;color:var(--primary);transition:all 0.2s ease;"
        title="Expandir/Colapsar todas las categorías"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 13l5 5 5-5M7 7l5 5 5-5"/>
        </svg>
      </button>
    </div>
    <div class="search-box">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5;">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input 
        type="text" 
        id="tools-search" 
        placeholder="Buscar... (Ctrl+K o /)" 
        autocomplete="off"
      />
    </div>
    <div id="tools-list">
      <div style="text-align:center;padding:20px 10px;color:#9ca3af;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 12px;opacity:0.5;animation:spin 2s linear infinite;">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <div style="font-size:12px;font-weight:600;">Cargando herramientas...</div>
      </div>
    </div>
  </section>

  <main id="centro" aria-label="zona de trabajo">
    <div id="mundo">
      <svg id="edges" viewBox="0 0 4000 3000" preserveAspectRatio="none"></svg>
    </div>
    <div id="hint">Arrastra salida → entrada para conectar</div>
  </main>

  <aside id="console">
    <h3>Consola</h3>
    <pre id="log">Listo.</pre>
    <div id="minimap-container">
      <h4>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
        </svg>
        Mini-mapa
      </h4>
      <canvas id="minimap"></canvas>
    </div>
  </aside>

  <script id="app-config" type="application/json">
    {
      "baseDir": {{ base_dir|tojson }}
    }
  </script>
  <script src="{{ url_for('static', filename='app.js') }}" type="module"></script>
</body>
</html>


```
## workflows