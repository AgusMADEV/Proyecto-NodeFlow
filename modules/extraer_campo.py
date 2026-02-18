# modules/extraer_campo.py
TOOL = {
    "type": "extraer_campo",
    "label": "📌 Extraer Campo",
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
