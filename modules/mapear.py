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
