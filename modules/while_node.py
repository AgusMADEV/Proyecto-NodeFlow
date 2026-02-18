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

