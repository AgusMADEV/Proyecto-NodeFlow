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

