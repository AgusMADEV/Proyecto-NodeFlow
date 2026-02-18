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

