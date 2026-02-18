# modules/escribir_csv.py
import csv
import os

TOOL = {
    "type": "escribir_csv",
    "label": "💾 Escribir CSV",
    "description": "Escribe una lista de datos en un archivo CSV.",
    "config": {
        "archivo": {"type": "string", "label": "Ruta del archivo CSV", "default": "salida.csv"},
        "delimiter": {"type": "string", "label": "Delimitador", "default": ","},
        "encoding": {"type": "string", "label": "Codificación", "default": "utf-8"},
        "incluir_encabezado": {"type": "boolean", "label": "Incluir encabezado", "default": True}
    }
}

def execute(config, context):
    """
    Escribe datos en un archivo CSV.
    Acepta una lista de diccionarios o una lista de listas.
    """
    archivo = (config.get("archivo") or "").strip()
    if not archivo:
        return {"ok": False, "error": "No se especificó archivo"}
    
    delimiter = config.get("delimiter", ",") or ","
    encoding = config.get("encoding", "utf-8") or "utf-8"
    incluir_encabezado = config.get("incluir_encabezado", True)
    
    # Obtener datos de entrada
    inputs = context.get("inputs", [])
    if not inputs:
        return {"ok": False, "error": "No hay datos para escribir"}
    
    # Obtener datos: puede venir como {"data": [...]}, {"ok": True, "data": [...]}, o lista directa
    first_input = inputs[0]
    
    if isinstance(first_input, dict):
        # Si tiene campo 'data', usar ese
        if "data" in first_input:
            data = first_input["data"]
        # Si no, verificar si es un dict con estructura de listarcarpetas
        elif "files" in first_input:
            # Convertir formato de listarcarpetas a lista de dicts
            data = first_input["files"]
        # Si no, asumir que el dict completo es un item
        else:
            data = [first_input]
    else:
        data = first_input
    
    # Verificar que sea una lista
    if not isinstance(data, list):
        return {"ok": False, "error": "Los datos deben ser una lista"}
    
    if not data:
        return {"ok": False, "error": "La lista de datos está vacía"}
    
    # Usar safe_join del contexto para manejar rutas correctamente
    safe_join = context.get("safe_join")
    base_dir = context.get("BASE_DIR", "/")
    
    try:
        archivo = safe_join(base_dir, archivo)
    except Exception as e:
        return {"ok": False, "error": f"Ruta inválida: {str(e)}"}
    
    try:
        # Crear directorio si no existe
        dir_path = os.path.dirname(archivo)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        with open(archivo, 'w', encoding=encoding, newline='') as f:
            # Determinar si son diccionarios o listas
            if isinstance(data[0], dict):
                # Lista de diccionarios
                headers = list(data[0].keys())
                writer = csv.DictWriter(f, fieldnames=headers, delimiter=delimiter)
                
                if incluir_encabezado:
                    writer.writeheader()
                
                writer.writerows(data)
                
            elif isinstance(data[0], (list, tuple)):
                # Lista de listas
                writer = csv.writer(f, delimiter=delimiter)
                writer.writerows(data)
                
            else:
                return {"ok": False, "error": "Los datos deben ser una lista de diccionarios o listas"}
        
        return {
            "ok": True,
            "archivo": archivo,
            "filas_escritas": len(data)
        }
    
    except Exception as e:
        return {"ok": False, "error": f"Error escribiendo CSV: {str(e)}"}
