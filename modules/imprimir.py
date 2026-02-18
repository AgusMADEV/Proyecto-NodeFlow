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

