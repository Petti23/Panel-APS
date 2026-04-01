# Reglas del Agente — Panel APS

## Panel-APS es la fuente de verdad de toda la documentación

Este repositorio contiene las **4 documentaciones centrales** del ecosistema APS. Son fuente de verdad única y **no se duplican** en los otros repositorios:

| Archivo | Descripción |
|---|---|
| `DOCUMENTACION DB.md` | Esquema de la base de datos Supabase (tablas, columnas, relaciones) |
| `DOCUMENTACION PANEL.md` | Arquitectura del panel de administración (este proyecto) |
| `DOCUMENTACION PLANILLA.md` | Actualizacion de partidos y estadisticas de jugadores en tiempo real |
| `DOCUMENTACION WEB.md` | Arquitectura del sitio web público |

Los repositorios `Web-APS` y `Softball-Statics` referencian estos archivos vía sus URLs raw en GitHub. **No existen ni deben existir copias locales en esos repos.**

### Reglas estrictas

- Actualizar la documentación es parte **obligatoria** de cualquier tarea que modifique código, estructura de carpetas, modelos de datos, servicios DB, flujos o convenciones.
- No se considera una tarea completa si los cambios no están reflejados en el archivo de documentación correspondiente de este repo.
- Si se agrega una nueva entidad, tabla, campo, servicio, página o flujo → documentar en la sección correspondiente.
- Si se elimina o renombra algo → corregirlo en la documentación.
- **Nunca** copiar estos archivos a `Web-APS` ni a `Softball-Statics`.
