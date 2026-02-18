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

