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
BASE_DIR = "/"          # raíz del sistema
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

