# Proyecto-NodeFlow 🔄

**Editor visual de workflows para procesamiento de datos**

Crea flujos de trabajo arrastrando y conectando nodos para automatizar tareas de procesamiento de datos sin escribir código.

## 🚀 Inicio Rápido

1. Ejecuta el servidor Flask:
   ```bash
   python app.py
   ```

2. Se abrirá automáticamente en tu navegador

3. Arrastra nodos desde la barra lateral y conéctalos

4. Presiona ▶️ Play para ejecutar el workflow

## ⌨️ Atajos de Teclado

- **Ctrl + Z**: Deshacer
- **Ctrl + Y**: Rehacer  
- **Ctrl + C**: Copiar nodo seleccionado
- **Ctrl + V**: Pegar nodo
- **Ctrl + S**: Guardar workflow
- **Delete/Supr**: Eliminar nodo seleccionado
- **Ctrl + Rueda**: Zoom
- **Ctrl + Arrastrar**: Mover canvas (pan)

## 📦 Nodos Disponibles

### 📊 Entrada/Salida de Datos
- **📄 Leer CSV**: Carga archivos CSV como tabla de datos
- **💾 Escribir CSV**: Exporta datos a archivo CSV
- **📁 Listar Carpetas**: Lista archivos en un directorio

### 🔄 Transformación de Datos
- **🔍 Filtrar**: Filtra elementos por condición (campo == valor, >, <, contains, etc.)
- **🔄 Mapear**: Transforma datos (extraer campos, renombrar, agregar campos)
- **📌 Extraer Campo**: Extrae un campo específico a lista simple

### 🧮 Operaciones
- **➕ Operador**: Operaciones matemáticas (+, -, ×, ÷)
- **Comparar**: Comparaciones (==, !=, >, <, >=, <=, contains)

### 🔀 Control de Flujo
- **If Node**: Bifurcación simple (true/false)
- **If Router**: Múltiples salidas según condiciones
- **While**: Bucle mientras condición sea verdadera
- **Sequence**: Ejecuta nodos en secuencia

### 💾 Variables
- **Asignar Variable**: Guarda valor en variable
- **Obtener Variable**: Recupera valor de variable
- **Constante**: Define un valor constante

### 📋 Debug
- **Imprimir**: Muestra datos en consola

## 📝 Ejemplo de Uso

### Caso 1: Filtrar datos de CSV

1. **Leer CSV** (`workflows/datos_ejemplo.csv`)
   ↓
2. **Filtrar** (edad > 30)
   ↓
3. **Escribir CSV** (`resultados.csv`)

### Caso 2: Extraer y transformar

1. **Leer CSV** (con datos de empleados)
   ↓
2. **Mapear** (extraer solo: nombre, salario)
   ↓
3. **Filtrar** (salario > 45000)
   ↓
4. **Extraer Campo** (nombre)
   ↓
5. **Imprimir** (ver lista de nombres)

## 🎯 Archivo de Ejemplo

Se incluye `workflows/datos_ejemplo.csv` con datos de prueba listos para usar.

## 💡 Tips

- Los workflows se guardan en la carpeta `workflows/`
- Puedes exportar/importar workflows como JSON
- Usa **Imprimir** para debug durante el desarrollo
- Los nodos muestran preview de resultados al ejecutar