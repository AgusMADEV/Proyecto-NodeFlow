# modules/leer_csv.py
import csv
import os

TOOL = {
    "type": "leer_csv",
    "label": "📄 Leer CSV",
    "description": "Lee un archivo CSV y lo convierte en una lista de diccionarios (tabla de datos).",
    "config": {
        "archivo": {"type": "string", "label": "Ruta del archivo CSV", "default": ""},
        "delimiter": {"type": "string", "label": "Delimitador", "default": ","},
        "encoding": {"type": "string", "label": "Codificación", "default": "utf-8"},
        "tiene_encabezado": {"type": "boolean", "label": "Primera fila es encabezado", "default": True}
    }
}

def execute(config, context):
    """
    Lee un archivo CSV y retorna una lista de diccionarios.
    Si tiene_encabezado=True, usa la primera fila como claves.
    Si tiene_encabezado=False, usa col0, col1, col2, etc. como nombres.
    """
    archivo = (config.get("archivo") or "").strip()
    if not archivo:
        return {"ok": False, "error": "No se especificó archivo"}
    
    delimiter = config.get("delimiter", ",") or ","
    encoding = config.get("encoding", "utf-8") or "utf-8"
    tiene_encabezado = config.get("tiene_encabezado", True)
    
    # Usar safe_join del contexto para manejar rutas correctamente
    safe_join = context.get("safe_join")
    base_dir = context.get("BASE_DIR", "/")
    
    try:
        archivo = safe_join(base_dir, archivo)
    except Exception as e:
        return {"ok": False, "error": f"Ruta inválida: {str(e)}"}
    
    if not os.path.isfile(archivo):
        return {"ok": False, "error": f"Archivo no encontrado: {archivo}"}
    
    try:
        with open(archivo, 'r', encoding=encoding, newline='') as f:
            reader = csv.reader(f, delimiter=delimiter)
            rows = list(reader)
        
        if not rows:
            return {"ok": True, "data": [], "count": 0}
        
        if tiene_encabezado and len(rows) > 0:
            headers = rows[0]
            data_rows = rows[1:]
            # Convertir a lista de diccionarios
            data = [
                {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
                for row in data_rows
            ]
        else:
            # Sin encabezado, usar col0, col1, etc.
            max_cols = max(len(row) for row in rows) if rows else 0
            headers = [f"col{i}" for i in range(max_cols)]
            data = [
                {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
                for row in rows
            ]
        
        return {
            "ok": True,
            "data": data,
            "count": len(data),
            "headers": headers if tiene_encabezado else None
        }
    
    except Exception as e:
        return {"ok": False, "error": f"Error leyendo CSV: {str(e)}"}
