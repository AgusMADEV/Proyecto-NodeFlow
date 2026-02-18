# modules/filtrar.py
TOOL = {
    "type": "filtrar",
    "label": "🔍 Filtrar",
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
