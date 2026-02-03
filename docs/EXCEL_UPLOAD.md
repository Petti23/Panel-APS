# Documentación: Carga Masiva de Jugadores (Excel)

Esta funcionalidad permite a los administradores cargar "Listas de Buena Fé" completas para un equipo utilizando archivos Excel (`.xlsx`, `.xls`), agilizando el proceso de registro y minimizando errores manuales.

## 📋 Formato Esperado del Archivo

El sistema es flexible y acepta archivos Excel con **3 columnas principales**. No requiere encabezados obligatorios, pero el orden lógico esperado es:

1.  **Columna A**: Nombre(s)
2.  **Columna B**: Apellido(s)
3.  **Columna C**: DNI / Documento

Existen dos modos de detección:
*   **Sin Encabezados (Recomendado)**: Lee directamente la fila 1 como datos. Asume `[Nombre, Apellido, DNI]`.
*   **Con Encabezados**: Si se detectan encabezados como "Nombre", "Apellido", "DNI", el sistema intentará mapearlos inteligentemente.

## ⚙️ Proceso Técnico

### 1. Lectura del Archivo (Client-Side)
Todo el procesamiento ocurre **en el navegador del usuario** (no se sube el archivo físico al servidor, solo se extraen los datos). Utilizamos la librería `xlsx` (SheetJS) para parsear el binario del archivo Excel y convertirlo en un array de datos manejable por JavaScript.

**Archivo**: `src/components/ExcelUploader.jsx`

```javascript
// Leemos el archivo como un array de arrays (header: 1) para máxima compatibilidad
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) 
```

### 2. Validación y Sanitización (Seguridad)
Antes de aceptar cualquier dato, cada fila pasa por un proceso riguroso de limpieza para prevenir **Inyecciones SQL** y **Ataques XSS**, y para asegurar la integridad de los datos.

**Archivo**: `src/utils/sanitizer.js`

#### Sanitización (Seguridad)
La función `sanitizeInput` elimina caracteres peligrosos que podrían ser usados para atacar la base de datos o la interfaz web.
*   **Permitido**: Letras, números, espacios, acentos, puntos, guiones.
*   **Bloqueado/Eliminado**:  `;` `'` `"` `<` `>` `\` (caracteres típicos de inyección de código).

#### Validación (Integridad)
La función `validatePlayerRow` verifica:
*   **Campos Obligatorios**: Que existan Nombre, Apellido y DNI.
*   **Formato de Nombre**: Solo letras y caracteres válidos de nombres.
*   **Formato de DNI**: Solo números, puntos y guiones.

### 3. Vista Previa y Errores
El sistema **NO guarda nada automáticamente**. Primero muestra un modal de confirmación:
*   **✅ Jugadores Válidos**: Se muestran en una tabla de vista previa.
*   **❌ Errores**: Se agrupan en un reporte rojo, indicando exactamente qué fila falló y por qué (ej. "Fila 4: DNI inválido"). Estas filas son descartadas automáticamente.

### 4. Carga Definitiva
Solo al hacer clic en "Confirmar Carga", los datos válidos se integran al estado global de la aplicación (`DataContext`), vinculándolos automáticamente al **Equipo** y **Categoría** seleccionados.

---

## 🛡️ Medidas de Seguridad Implementadas

1.  **Sanitización de Entrada**: Prevenimos que un Excel malicioso inyecte scripts o comandos SQL.
2.  **Validación de Tipos**: Aseguramos que los DNIs sean numéricos y los nombres sean texto.
3.  **Procesamiento Local**: Al procesar el archivo en el navegador, reducimos la carga del servidor y evitamos almacenar archivos temporales innecesarios.
4.  **Feedback Visual**: El usuario siempre tiene control total de qué se va a subir antes de que suceda.
