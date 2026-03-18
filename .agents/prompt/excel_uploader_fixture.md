Prompt para tu agente

Quiero que actúes como un ingeniero de software senior especializado en React, arquitectura frontend modular, parsing robusto de archivos Excel y validación de datos.

Ya existe una funcionalidad de carga masiva de Excel en mi proyecto, pero actualmente está orientada a un formato simple de jugadores (Nombre, Apellido, DNI). Necesito que refactorices y modularices esa solución para soportar un nuevo tipo de uploader, destinado a leer planillas de programación deportiva APS con múltiples bloques por categoría.

Contexto actual

Existe una funcionalidad de Excel uploader que:

procesa archivos .xlsx y .xls del lado cliente usando xlsx / SheetJS

sanitiza y valida datos antes de aceptarlos

muestra vista previa y errores antes de confirmar

no sube el archivo físico al servidor, solo parsea y transforma datos

está actualmente pensada para una tabla plana simple

Quiero mantener esa filosofía, pero adaptar la arquitectura para soportar un Excel de estructura mucho más compleja.

Objetivo

Refactorizar el uploader actual para que pueda leer archivos Excel con una estructura visual como esta:

Un título general arriba, por ejemplo:

Programación APS desde el 9 al 15 de marzo 2026

Luego varios bloques de categorías

Cada bloque tiene:

una fila de nombre de categoría / torneo / año, por ejemplo:

ESCUELITA

PREINFANTIL

KDT "A" 1° TORNEO 2026

JUVENILES 1° TORNEO 2026

PRIMERA DIVISION 4° TORNEO 2025 - 2026

una fila de encabezados:

FECHA | HORA | LOCAL | Vs | VISITANTE | DIAMANTE | ARBITROS

una o varias filas de partidos

o bien una fila informativa como:

Sin actividad

Torneo organizado por CAT

Torneo organizado por Don Bosco

etc.

Además, en la columna Vs:

puede venir vacía en partidos normales

o puede contener valores como P1, P2, P3, etc. para identificar cruces de playoff

Requisitos funcionales
1. El uploader debe detectar y parsear correctamente
A. Metadatos globales

Extraer:

tituloGeneral

rango de fechas si se puede inferir del título

hoja origen si aplica

Ejemplo:

{
  "tituloGeneral": "Programación APS desde el 9 al 15 de marzo 2026"
}
B. Bloques de categorías

Debe detectar automáticamente cada bloque de categoría, aunque existan:

filas vacías

celdas combinadas

filas decorativas

colores de fondo

textos informativos

Cada bloque debe transformarse a algo así:

{
  "categoriaRaw": "JUVENILES 1° TORNEO 2026",
  "categoria": "JUVENILES",
  "torneo": "1° TORNEO",
  "anio": "2026",
  "estado": "con_partidos",
  "partidos": [...]
}

O si no hay actividad:

{
  "categoriaRaw": "U23 1° TORNEO 2026",
  "categoria": "U23",
  "torneo": "1° TORNEO",
  "anio": "2026",
  "estado": "sin_actividad",
  "mensaje": "Sin actividad",
  "partidos": []
}

O si hay observación organizativa:

{
  "categoriaRaw": "PREINFANTIL",
  "categoria": "PREINFANTIL",
  "estado": "informativo",
  "mensaje": "Torneo organizado por CAT",
  "partidos": []
}
C. Partidos

Cada fila válida de partido debe mapearse como entidad estructurada:

{
  "fechaTexto": "Viernes, 13 de marzo de 2026",
  "hora": "18:00",
  "local": "CAE",
  "vs": "",
  "visitante": "CAT",
  "diamante": "CAE",
  "arbitros": "APS",
  "tipo": "partido_regular"
}

Y para playoff:

{
  "fechaTexto": "Domingo, 15 de marzo de 2026",
  "hora": "11:00",
  "local": "3°",
  "vs": "P1",
  "visitante": "4°",
  "diamante": "CAP",
  "arbitros": "APS",
  "tipo": "playoff"
}
Requisitos de arquitectura

Quiero que lo implementes de forma modular, extensible y limpia, no como lógica monolítica en un solo componente.

Separar responsabilidades en módulos
Componentes UI

ExcelScheduleUploader.jsx

SchedulePreviewModal.jsx

ScheduleImportSummary.jsx

ScheduleImportErrors.jsx

Servicios / parsing

src/services/excel/readWorkbook.js

src/services/excel/extractSheetMatrix.js

src/services/excel/normalizeMergedCells.js

src/services/excel/scheduleParser.js

src/services/excel/scheduleSectionDetector.js

src/services/excel/scheduleRowClassifier.js

Utilidades de dominio

src/utils/schedule/sanitizeCellValue.js

src/utils/schedule/normalizeText.js

src/utils/schedule/parseCategoryTitle.js

src/utils/schedule/isHeaderRow.js

src/utils/schedule/isMatchRow.js

src/utils/schedule/isInformativeRow.js

src/utils/schedule/parseMatchType.js

Validaciones

src/validators/schedule/validateScheduleBlock.js

src/validators/schedule/validateMatchRow.js

Adaptadores / transformers

src/adapters/schedule/sheetToScheduleModel.js

src/adapters/schedule/scheduleToAppModel.js

No quiero lógica pesada incrustada en el componente React.

Estrategia de parsing esperada

Implementá una estrategia robusta basada en una matriz de celdas (array of arrays) y no dependas de que el Excel sea una tabla plana perfecta.

El parser debe:

Leer la hoja como matriz cruda

Normalizar valores vacíos, espacios y textos

Tener en cuenta que puede haber:

celdas combinadas

filas separadoras

bloques con colores pero sin metadata útil

Detectar el título general en las primeras filas

Recorrer la matriz fila por fila

Identificar cuándo una fila representa:

un título de categoría

una fila de encabezado

una fila de partido

una fila informativa (Sin actividad, Torneo organizado por ...)

una fila vacía / decorativa

Construir una estructura intermedia de bloques

Validar cada bloque

Mostrar preview antes de confirmar

Reglas de detección
Una fila debe considerarse “título de categoría” si:

tiene texto significativo

no coincide con el encabezado estándar

no parece fila de partido

suele estar sola o centrada visualmente

contiene palabras como categoría, torneo, división, juvenil, infantil, primera, liga, lanzamiento lento, etc.

puede incluir año/s

Una fila debe considerarse “encabezado” si contiene columnas equivalentes a:

fecha

hora

local

vs

visitante

diamante

arbitros

La detección debe ser tolerante a:

mayúsculas/minúsculas

acentos

espacios extra

variantes como árbitros o arbitros

Una fila debe considerarse “informativa” si contiene textos como:

Sin actividad

Torneo organizado por ...

cualquier observación no estructurada dentro del bloque

Una fila debe considerarse “partido” si:

tiene al menos fecha + hora + local + visitante

vs puede estar vacío o tener P1, P2, etc.

diamante y arbitros pueden venir completos o eventualmente vacíos según futuros formatos

Validaciones requeridas
Validación por fila de partido

Validar:

fecha presente

hora presente

local presente

visitante presente

vs opcional pero si existe debe cumplir patrón tipo P\d+ o similar configurable

sanitización de strings

longitud razonable

descarte de filas basura

Validación por bloque

Validar:

que cada bloque tenga categoría detectada

que no mezcle partidos con otra categoría

que un bloque pueda ser:

con_partidos

sin_actividad

informativo

Tolerancia a errores

No quiero que falle toda la importación por una sola fila malformada.
Quiero:

filas válidas

filas descartadas con motivo

advertencias

resumen final

Seguridad

Mantener y reforzar medidas de seguridad:

sanitizar strings

eliminar caracteres potencialmente peligrosos

prevenir XSS en preview

no ejecutar nada proveniente del Excel

procesamiento 100% client-side

no confiar en formato visual del archivo

validar todo antes de integrar a estado global

UX esperada

La experiencia debe seguir esta secuencia:

Usuario selecciona Excel

Se parsea localmente

Se muestra preview estructurada por categoría

Se muestran:

bloques detectados

partidos válidos

bloques sin actividad

observaciones

errores / advertencias

Recién al confirmar se integra al estado global

La preview debería mostrar

título general detectado

cantidad de categorías detectadas

cantidad de partidos válidos

cantidad de bloques sin actividad

cantidad de filas descartadas

tabla agrupada por categoría

Integración con el estado global

Quiero que el resultado final quede listo para integrarlo a DataContext o al store actual de la app.

Diseñá un modelo final claro, por ejemplo:

{
  "tituloGeneral": "Programación APS desde el 9 al 15 de marzo 2026",
  "categorias": [
    {
      "categoriaRaw": "KDT \"A\" 1° TORNEO 2026",
      "categoria": "KDT A",
      "torneo": "1° TORNEO",
      "anio": "2026",
      "estado": "con_partidos",
      "partidos": [
        {
          "fechaTexto": "Sabado, 14 de marzo de 2026",
          "hora": "10:00",
          "local": "DON BOSCO",
          "vs": "",
          "visitante": "CAT",
          "diamante": "DON BOSCO",
          "arbitros": "APS",
          "tipo": "partido_regular"
        }
      ]
    }
  ],
  "estadisticas": {
    "categoriasDetectadas": 10,
    "partidosValidos": 15,
    "bloquesSinActividad": 4,
    "advertencias": 2,
    "errores": 1
  }
}
Implementación esperada
Quiero que hagas esto

Analices el uploader actual

Refactorices la lógica reutilizable

Extraigas parsing genérico a servicios

Crees un parser específico para “programación APS”

Mantengas compatibilidad con futuros formatos similares

No rompas el uploader existente de jugadores

Si es necesario, creá una base reusable tipo:

BaseExcelUploader

excel parsing pipeline

parser strategies

format adapters

Enfoque técnico recomendado

Me interesa que uses un enfoque tipo pipeline:

readWorkbook(file)

extractRawMatrix(worksheet)

normalizeMatrix(matrix, merges)

detectDocumentTitle(matrix)

detectSections(matrix)

parseSection(section)

validateSection(section)

buildPreviewModel(parsedData)

buildImportPayload(parsedData)

Si lo ves conveniente, usá patrón Strategy o Adapter para soportar múltiples formatos de Excel en el futuro.

Restricciones

No quiero hacks frágiles hardcodeados por índice de fila

No asumas posiciones fijas exactas

No dependas del color de celda como única fuente de verdad

No metas toda la lógica en un solo archivo

No rompas la funcionalidad existente

No corras tests automáticos

Solo implementá/refactorizá el código

Dejá comentarios claros en las partes complejas

Priorizá legibilidad, mantenibilidad y extensibilidad

Entregable esperado

Quiero que me devuelvas:

La refactorización completa propuesta

Los nuevos módulos creados

La lógica de parsing para este formato

La integración con el uploader actual

El shape final de datos parseados

Una preview usable para confirmar importación

Manejo detallado de errores y advertencias

Al implementar, razoná como si esto fuera una funcionalidad productiva real, mantenible a largo plazo, no un parche rápido.