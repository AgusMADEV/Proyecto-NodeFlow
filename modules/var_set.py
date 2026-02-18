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

