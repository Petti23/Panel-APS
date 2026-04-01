# Panel APS — Documentación de Arquitectura y Flujo de Datos

> Guía técnica completa para agentes e integradores.  
> Última actualización: Abril 2026.

---

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Arquitectura de Capas](#4-arquitectura-de-capas)
5. [Base de Datos (Supabase)](#5-base-de-datos-supabase)
6. [Capa de Servicios DB](#6-capa-de-servicios-db)
7. [Modelo de Datos de la App (App Model)](#7-modelo-de-datos-de-la-app-app-model)
8. [Estado Global — DataContext](#8-estado-global--datacontext)
9. [Autenticación — AuthContext](#9-autenticación--authcontext)
10. [Flujo de Importación Excel](#10-flujo-de-importación-excel)
11. [Páginas y Componentes](#11-páginas-y-componentes)
12. [Flujo de Datos Completo](#12-flujo-de-datos-completo)
13. [Convenciones de Código](#13-convenciones-de-código)
14. [Integración con Otros Sistemas](#14-integración-con-otros-sistemas)
15. [Variables de Entorno](#15-variables-de-entorno)

---

## 1. Visión General

**Panel APS** es una Single Page Application (SPA) de administración para la liga de softball APS. Su función principal es:

- **Gestionar** torneos, equipos, jugadores y partidos.
- **Importar fixtures** desde archivos Excel con formato propio de la liga.
- Actuar como **fuente de verdad** del fixture y roster para el resto de los sistemas (app de scoresheet, app de consulta pública, etc.).

Este panel **escribe** en la base de datos compartida en Supabase. Los otros sistemas (scoresheet, stats web) **leen** de esa misma base de datos.

```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL                     │
│                  (fuente de verdad compartida)               │
└────────────┬───────────────────────┬────────────────────────┘
             │ ESCRIBE               │ LEE
             ▼                       ▼
┌─────────────────────┐   ┌─────────────────────────────────┐
│   Panel APS (este)  │   │  App Scoresheet / Stats Web /   │
│   Gestión y fixture │   │  App pública / otros agentes    │
└─────────────────────┘   └─────────────────────────────────┘
```

---

## 2. Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Framework UI | React 18 + Vite |
| Enrutamiento | React Router v6 |
| Base de datos | Supabase (PostgreSQL hosted) |
| Cliente DB | `@supabase/supabase-js` v2 |
| Parseo Excel | ExcelJS |
| Iconos | Lucide React |
| CSS | CSS puro (sin framework) |

---

## 3. Estructura de Carpetas

```
Panel-APS/
├── src/
│   ├── App.jsx                        # Raíz: Router + Providers + Auth guard
│   ├── main.jsx                       # Entry point React
│   ├── index.css                      # Estilos globales / CSS variables
│   │
│   ├── context/
│   │   ├── AuthContext.jsx            # Sesión Supabase Auth
│   │   └── DataContext.jsx            # Estado global de datos (tournaments, teams, etc.)
│   │
│   ├── services/
│   │   ├── supabase.js                # Singleton del cliente Supabase
│   │   ├── db/
│   │   │   ├── categories.js          # Consultas tabla → categories derivadas
│   │   │   ├── tournaments.js         # CRUD tabla tournament
│   │   │   ├── teams.js               # CRUD tabla team
│   │   │   ├── players.js             # CRUD tabla player
│   │   │   ├── games.js               # CRUD tabla game
│   │   │   └── scheduleImport.js      # Importación masiva desde Excel
│   │   └── excel/
│   │       ├── readWorkbook.js        # Carga .xlsx → ExcelJS Workbook
│   │       ├── extractSheetMatrix.js  # Workbook → matriz de celdas
│   │       ├── normalizeMergedCells.js# Expande celdas combinadas
│   │       ├── scheduleSectionDetector.js # Detecta secciones/categorías
│   │       ├── scheduleRowClassifier.js   # Clasifica cada fila
│   │       └── scheduleParser.js     # Parsea cada sección en bloque de datos
│   │
│   ├── adapters/
│   │   └── schedule/
│   │       ├── sheetToScheduleModel.js  # Orquesta todo el pipeline Excel → modelo
│   │       └── scheduleToAppModel.js    # Limpia/mapea al modelo final de la app
│   │
│   ├── utils/
│   │   ├── sanitizer.js               # Sanitización de inputs de usuario
│   │   └── schedule/
│   │       ├── normalizeText.js       # Minúsculas, sin tildes, sin espacios extra
│   │       ├── categoryMapper.js      # Texto Excel → categoría oficial + torneo
│   │       ├── parseCategoryTitle.js  # Extrae año y torneo del título de categoría
│   │       ├── parseDate.js           # "Lunes 9 de marzo 2026" → "2026-03-09"
│   │       ├── parseMatchType.js      # Detecta playoff vs partido regular
│   │       ├── sanitizeCellValue.js   # Limpia valor de celda Excel
│   │       ├── isHeaderRow.js         # ¿Esta fila es la cabecera de columnas?
│   │       ├── isInformativeRow.js    # ¿Esta fila es texto informativo?
│   │       ├── isMatchRow.js          # ¿Esta fila es un partido?
│   │       └── isPlaceholderTeam.js   # ¿Este nombre es un placeholder de llave?
│   │
│   ├── validators/
│   │   └── schedule/
│   │       ├── validateMatchRow.js    # Valida que una fila tenga los campos requeridos
│   │       └── validateScheduleBlock.js # Valida que un bloque de categoría sea coherente
│   │
│   ├── constants/
│   │   └── categories.js             # Lista canónica de categorías APS
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx             # Vista resumen
│   │   ├── Tournaments.jsx           # ABM torneos
│   │   ├── Teams.jsx                 # ABM equipos
│   │   ├── Players.jsx               # ABM jugadores
│   │   └── Games.jsx                 # ABM partidos + importación Excel
│   │
│   └── components/
│       ├── Layout.jsx / Layout.css    # Shell: nav sidebar + outlet
│       ├── Modal.jsx / Modal.css      # Modal genérico
│       ├── Table.css / Pages.css      # Estilos compartidos de tablas y páginas
│       ├── UploadDrawer.jsx / .css    # Drawer lateral para cargar Excel de fixture
│       ├── ExcelUploader.jsx          # Uploader para Excel de jugadores
│       ├── ExcelScheduleUploader.jsx  # Componente de carga de fixture Excel
│       ├── SchedulePreviewModal.jsx   # Previsualización antes de confirmar importación
│       ├── ScheduleImportErrors.jsx   # Display de errores de validación del Excel
│       └── ScheduleImportSummary.jsx  # Resumen post-importación
│
├── supabase/
│   ├── schema.sql                    # DDL completo de la base de datos
│   ├── rls.sql                       # Políticas RLS
│   ├── seed_categories.sql           # Datos iniciales (obsoleto en nuevo esquema)
│   └── drop_spanish_tables.sql       # Elimina tablas del esquema anterior
│
├── Documentacion Base de Datos.md   # Documentación técnica del esquema PostgreSQL
├── ARCHITECTURE.md                  # Este archivo
├── package.json
└── vite.config.js
```

---

## 4. Arquitectura de Capas

```
┌──────────────────────────────────────────────────────────────────┐
│  CAPA UI (Pages + Components)                                    │
│  React components. Leen desde DataContext, llaman sus funciones. │
│  No llaman a Supabase directamente.                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ useData()
┌──────────────────────────▼───────────────────────────────────────┐
│  CAPA ESTADO (DataContext)                                       │
│  Estado en memoria: tournaments[], teams[], players[], games[].  │
│  Optimistic updates: actualiza estado antes de confirmar la DB.  │
│  Rollback automático si la DB falla.                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │ import
┌──────────────────────────▼───────────────────────────────────────┐
│  CAPA SERVICIO DB (src/services/db/)                             │
│  Funciones puras: fetch/insert/update/delete.                    │
│  Mapeo DB rows (snake_case) ↔ App objects (camelCase).           │
│  Un archivo por entidad.                                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │ supabase client
┌──────────────────────────▼───────────────────────────────────────┐
│  BASE DE DATOS (Supabase PostgreSQL)                             │
│  Tablas: tournament, team, player, game, game_team, game_player, │
│  plate_appearance, pitch, play, runner_advance, ...              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Base de Datos (Supabase)

La base de datos completa está documentada en [`Documentacion Base de Datos.md`](./Documentacion%20Base%20de%20Datos.md). Aquí se resume lo relevante para este panel.

### Tablas que usa este panel

| Tabla DB | PK | Descripción |
|----------|-----|-------------|
| `tournament` | `tournament_id` (bigserial) | Torneos. Unique: `(name, season, category)` |
| `team` | `team_id` (bigserial) | Equipos. Unique: `(name, club)` |
| `player` | `player_id` (bigserial) | Jugadores. |
| `game` | `game_id` (bigserial) | Partidos. FK → `tournament`, `team` (home + away) |

### Tablas que lee pero no escribe directamente este panel

`game_team`, `game_player`, `plate_appearance`, `pitch`, `play`, `runner_advance`, `fielding_play_participant` — estas son escritas por la app de scoresheet.

### Columnas clave por tabla

**`tournament`**
```
tournament_id   bigserial PK
name            text NOT NULL
season          int NOT NULL         ← año (ej. 2026)
category        text                 ← "Cadete", "Infantil", etc.
start_date      date
end_date        date
regulations_url text
created_at      timestamptz
UNIQUE (name, season, category)
```

**`team`**
```
team_id       bigserial PK
name          text NOT NULL
club          text                   ← nombre del club
city          text
abbreviation  text
created_at    timestamptz
UNIQUE (name, club)
```

**`player`**
```
player_id    bigserial PK
first_name   text NOT NULL
last_name    text NOT NULL
national_id  text                   ← DNI (opcional)
birth_date   date
bat_hand     bat_hand NOT NULL      ← 'R' | 'L' | 'S'
throw_hand   throw_hand NOT NULL    ← 'R' | 'L'
created_at   timestamptz
```

**`game`**
```
game_id              bigserial PK
tournament_id        bigint FK → tournament
scheduled_datetime   timestamptz NOT NULL  ← fecha Y hora combinadas
venue                text
field                text
home_team_id         bigint FK → team
away_team_id         bigint FK → team
status               game_status DEFAULT 'draft'
scheduled_innings    int DEFAULT 7
mercy_rule           boolean DEFAULT false
created_at           timestamptz
```

> **Importante:** `game.status` puede ser `draft | in_progress | submitted | closed`.
> La app scoresheet cambia este estado. Este panel solo crea juegos con status `draft`.

---

## 6. Capa de Servicios DB

Cada archivo en `src/services/db/` expone funciones async que encapsulan las queries a Supabase.

### Mapeo DB ↔ App

Cada servicio define dos funciones internas privadas:

- `fromRow(row)` — convierte un registro DB (snake_case, PK numérico nativo) al **App Model** (camelCase, `id` normalizado).
- `toRow(appObj)` — convierte el App Model al formato que espera la DB.

#### Ejemplo: `games.js`

```js
// DB → App
fromRow: row => ({
    id            : row.game_id,           // bigint → 'id'
    tournamentId  : row.tournament_id,
    homeTeamId    : row.home_team_id,
    visitorTeamId : row.away_team_id,      // 'away_team_id' en DB → 'visitorTeamId' en app
    venue         : row.venue,
    field         : row.field,
    date          : row.scheduled_datetime?.slice(0, 10), // timestamptz → 'YYYY-MM-DD'
    time          : row.scheduled_datetime?.slice(11, 16),// timestamptz → 'HH:MM'
    status        : row.status,
})

// App → DB
toRow: obj => ({
    tournament_id       : obj.tournamentId,
    home_team_id        : obj.homeTeamId,
    away_team_id        : obj.visitorTeamId,
    venue               : obj.venue || null,
    field               : obj.field || null,
    scheduled_datetime  : obj.date ? `${obj.date}T${obj.time ?? '00:00'}:00` : null,
})
```

### Resumen de funciones exportadas

#### `categories.js`
| Función | Descripción |
|---------|-------------|
| `fetchCategories()` | Devuelve `[{ name }]` con los valores únicos de `tournament.category` |

> No hay tabla propia de categorías. Son valores derivados de `tournament.category`.

#### `tournaments.js`
| Función | Signature | Descripción |
|---------|-----------|-------------|
| `fetchTournaments()` | `→ Tournament[]` | SELECT * ORDER BY created_at ASC |
| `insertTournament(data)` | `→ Tournament` | INSERT + SELECT single |
| `updateTournament(id, data)` | `→ Tournament` | UPDATE WHERE tournament_id = id |
| `deleteTournament(id)` | `→ void` | DELETE WHERE tournament_id = id |

#### `teams.js`
| Función | Signature | Descripción |
|---------|-----------|-------------|
| `fetchTeams()` | `→ Team[]` | SELECT * ORDER BY created_at ASC |
| `insertTeam(data)` | `→ Team` | INSERT + SELECT single |
| `updateTeam(id, data)` | `→ Team` | UPDATE WHERE team_id = id |
| `deleteTeam(id)` | `→ void` | DELETE WHERE team_id = id |

#### `players.js`
| Función | Signature | Descripción |
|---------|-----------|-------------|
| `fetchPlayers()` | `→ Player[]` | SELECT * ORDER BY created_at ASC |
| `insertPlayer(data)` | `→ Player` | INSERT + SELECT single |
| `updatePlayer(id, data)` | `→ Player` | UPDATE WHERE player_id = id |
| `deletePlayer(id)` | `→ void` | DELETE WHERE player_id = id |

#### `games.js`
| Función | Signature | Descripción |
|---------|-----------|-------------|
| `fetchGames()` | `→ Game[]` | SELECT * ORDER BY scheduled_datetime ASC |
| `insertGame(data)` | `→ Game` | INSERT + SELECT single |
| `updateGame(id, data)` | `→ Game` | UPDATE WHERE game_id = id |
| `deleteGame(id)` | `→ void` | DELETE WHERE game_id = id |

#### `scheduleImport.js`
| Función | Signature | Descripción |
|---------|-----------|-------------|
| `importScheduleToDb(data)` | `→ { addedTournaments, addedTeams, addedGames }` | Importación masiva desde modelo Excel |

---

## 7. Modelo de Datos de la App (App Model)

Estos son los objetos que circulan entre la UI, DataContext y los servicios DB. **Son distintos de las filas DB** (camelCase, PK normalizada como `id`).

### `Tournament`
```ts
{
  id        : number        // tournament_id de la DB
  name      : string
  season    : number        // año: 2026
  category  : string | null // "Cadete", "Infantil", etc.
  startDate : string | null // "YYYY-MM-DD"
  endDate   : string | null // "YYYY-MM-DD"
}
```

### `Team`
```ts
{
  id           : number
  name         : string
  club         : string | null
  city         : string | null
  abbreviation : string | null
}
```

### `Player`
```ts
{
  id        : number
  fullName  : string        // "first_name last_name" combinados
  firstName : string
  lastName  : string
  dni       : string | null // alias de nationalId
  nationalId: string | null
  birthDate : string | null // "YYYY-MM-DD"
  batHand   : 'R' | 'L' | 'S'
  throwHand : 'R' | 'L'
}
```

### `Game`
```ts
{
  id           : number
  tournamentId : number
  homeTeamId   : number
  visitorTeamId: number     // mapea a away_team_id en la DB
  venue        : string | null
  field        : string | null
  date         : string | null  // "YYYY-MM-DD" (extraído de scheduled_datetime)
  time         : string | null  // "HH:MM" (extraído de scheduled_datetime)
  status       : 'draft' | 'in_progress' | 'submitted' | 'closed'
}
```

### `Category` (derivado)
```ts
{
  name: string  // valor único de tournament.category
}
```

---

## 8. Estado Global — DataContext

`src/context/DataContext.jsx` provee un contexto React con todo el estado de datos.

### Acceso desde cualquier componente
```jsx
import { useData } from '../context/DataContext'

const MyComponent = () => {
  const {
    loading, dbError,
    categories,
    tournaments, addTournament, addTournaments, updateTournament, deleteTournament,
    teams,      addTeam,        addTeams,        updateTeam,        deleteTeam,
    players,    addPlayer,      addPlayers,      updatePlayer,      deletePlayer,
    games,      addGame,        addGames,        updateGame,        deleteGame,
    importScheduleData,
  } = useData()
}
```

### Estado disponible

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `loading` | `boolean` | `true` mientras se carga desde Supabase |
| `dbError` | `string \| null` | Mensaje de error de la última carga |
| `categories` | `Category[]` | Derivado de tournament.category |
| `tournaments` | `Tournament[]` | Todos los torneos |
| `teams` | `Team[]` | Todos los equipos |
| `players` | `Player[]` | Todos los jugadores |
| `games` | `Game[]` | Todos los partidos |

### Patrón Optimistic Update

Todas las mutaciones siguen este patrón:

```
1. Asignar tempId (string "tmp_<timestamp>")
2. Actualizar estado local inmediatamente (UI responde al instante)
3. Llamar servicio DB async
4. Si OK → reemplazar tempId con el ID real de la DB
5. Si FAIL → revertir al snapshot previo (rollback)
```

Ejemplo:
```js
const addTournament = (data) => {
    const tempId = `tmp_${Date.now()}`
    setTournaments(prev => [...prev, { id: tempId, ...data }])
    insertTournament(data)
        .then(created => setTournaments(prev => prev.map(t => t.id === tempId ? created : t)))
        .catch(err => setTournaments(prev => prev.filter(t => t.id !== tempId)))
}
```

> **IMPORTANTE para integradores:** `id` en el App Model puede ser un número real (bigserial de la DB) o un string `"tmp_..."` durante los milisegundos de latencia tras crear un registro. Cualquier lógica que dependa del `id` debe tolerar esto, o esperar al evento de reemplazo.

### Carga inicial

Al montar `DataProvider`, se ejecuta `loadAll()` que hace 5 requests en paralelo:

```js
const [cats, t, tm, p, g] = await Promise.all([
    fetchCategories(),
    fetchTournaments(),
    fetchTeams(),
    fetchPlayers(),
    fetchGames(),
])
```

`importScheduleData(data)` también llama `loadAll()` al finalizar para sincronizar todos los IDs reales post-importación.

---

## 9. Autenticación — AuthContext

`src/context/AuthContext.jsx` gestiona la sesión via Supabase Auth.

### Estado de sesión

| Valor de `session` | Significado |
|-------------------|-------------|
| `undefined` | Cargando (verificando sesión actual) |
| `null` | Sin sesión — se muestra `<Login />` |
| `Session object` | Sesión activa — se renderiza la app |

### Flujo de autenticación

```
App monta
  ↓
AuthProvider llama supabase.auth.getSession()
  ↓
session = undefined → null | Session
  ↓
ProtectedRoutes evalúa:
  - undefined → null (render nada)
  - null      → <Login />
  - Session   → <DataProvider> + <Routes>
```

### API pública del contexto

```js
const { session, signIn, signOut } = useAuth()

// Login
const { error } = await signIn(email, password)

// Logout
await signOut()
```

---

## 10. Flujo de Importación Excel

Esta es la funcionalidad más compleja del panel. Convierte un archivo `.xlsx` con el fixture de la liga en registros de base de datos.

### Pipeline completo

```
[Archivo .xlsx]
       ↓
readWorkbook()          ← ExcelJS carga el buffer del archivo
       ↓
extractSheetMatrix()    ← Convierte primera hoja en matriz 2D de celdas
       ↓
normalizeMergedCells()  ← Expande celdas combinadas (el valor del origen se copia)
       ↓
detectDocumentTitle()   ← Busca título global en primeras 5 filas
       ↓
detectSections()        ← Recorre filas e identifica secciones por categoría
  │  Para cada fila llama classifyRow():
  │    'category_title' → abre nueva sección
  │    'header'         → extrae headerMap { fecha, hora, local, visitante, diamante, arbitros }
  │    'match'          → agrega fila a sección actual
  │    'informative'    → agrega nota (ej: "SIN ACTIVIDAD")
  │    'empty'/'unknown'→ ignorado
       ↓
parseSection()          ← Convierte cada sección en bloque de datos
  │  parseCategoryTitle() → extrae categoria, torneo, anio
  │  validateMatchRow()   → valida y extrae campos de cada fila de partido
  │  validateScheduleBlock() → valida coherencia del bloque
       ↓
mapCategoryAndTournament() ← Mapea texto crudo → categoría oficial ("KDT A" → "Cadete")
       ↓
scheduleToAppModel()    ← Limpia y homogeniza el modelo final
       ↓
[Modelo App: { tituloGeneral, categorias: [...], estadisticas }]
       ↓
SchedulePreviewModal    ← El usuario revisa y confirma
       ↓
importScheduleToDb()    ← Escribe en Supabase:
  1. Upsert tournaments (UNIQUE: name, season, category)
  2. Fetch teams existentes, insert solo los nuevos
  3. Insert games
       ↓
loadAll()               ← Refresca todo el estado local
```

### Estructura del modelo intermedio (post-parse)

```ts
{
  tituloGeneral: string,
  estadisticas: {
    categoriasDetectadas: number,
    partidosValidos: number,
    bloquesSinActividad: number,
    advertencias: number,
    errores: number
  },
  categorias: Array<{
    categoriaRaw : string,       // texto tal como salió del Excel
    categoria    : string,       // texto limpio (sin año/torneo)
    category     : string,       // categoría oficial mapeada ("Cadete", "Infantil"...)
    torneo       : string | null,// "1° TORNEO", "2° TORNEO"...
    tournamentName: string,      // nombre del torneo sin categoría ni año
    anio         : string | null,// "2026"
    estado       : 'con_partidos' | 'sin_actividad' | 'informativo',
    mensaje      : string,
    erroresFila  : Array<{rowData, errors}>,
    partidos     : Array<{
      fechaTexto : string,       // "Lunes, 9 de marzo de 2026"
      hora       : string,       // "10:00"
      local      : string,       // nombre del equipo local
      vs         : string,       // puede indicar tipo ("P1", "VS")
      visitante  : string,       // nombre del equipo visitante
      diamante   : string,       // cancha/diamante
      arbitros   : string,
      tipo       : 'partido_regular' | 'playoff'
    }>
  }>
}
```

### Estrategia de upsert en importación

| Entidad | Estrategia | Conflicto |
|---------|-----------|-----------|
| `tournament` | `UPSERT` | `(name, season, category)` |
| `team` | SELECT existentes + INSERT nuevos | Match por `name` normalizado |
| `game` | `INSERT` directo | Sin deduplicación (puede crear duplicados si se reimporta) |

> **Aviso:** La importación de `game` no deduplica. Si se importa el mismo Excel dos veces, los partidos se duplicarán. El panel no implementa idempotencia de games todavía.

### Detección de placeholder teams

Antes de insertar, `isPlaceholderTeam()` filtra nombres que no son equipos reales:

```
GP1, GP2, GP3...          → placeholder de grupo
1°, 2°, 3°, 4°...         → placeholder de posición  
GANADOR GRUPO A...         → placeholder de llave
CLASIFICADO 1...           → placeholder
```

---

## 11. Páginas y Componentes

### `Dashboard.jsx`

Vista de resumen. Muestra contadores (torneos, partidos, equipos, jugadores) y los últimos 5 partidos.

**Datos consumidos:** `tournaments`, `games`, `teams`, `players` del DataContext.

---

### `Tournaments.jsx`

ABM de torneos.

**Campos del formulario:**
- `name` (string, requerido)
- `season` (number, default: año actual)
- `category` (select desde `CATEGORIES` constante)
- `startDate` (date, opcional)
- `endDate` (date, opcional)

**Filtro:** por `category`.

**Acciones:** crear, editar, eliminar.

---

### `Teams.jsx`

ABM de equipos.

**Campos del formulario:**
- `name` (string, requerido)
- `club` (string, opcional)

**Funcionalidad extra:** botón para importar jugadores desde Excel (via `ExcelUploader`). Los jugadores se insertan independientemente del equipo ya que la tabla `player` no tiene FK directa a `team`.

---

### `Players.jsx`

ABM de jugadores.

**Campos del formulario:**
- `fullName` (string, requerido) → se parte en `firstName + lastName` en el servicio
- `dni` (string, opcional) → mapea a `national_id`

**Filtro:** búsqueda por nombre o DNI.

---

### `Games.jsx`

ABM de partidos + importación masiva de fixture Excel.

**Campos del formulario:**
- `tournamentId` (select, requerido)
- `homeTeamId` (select, requerido — lista todos los equipos)
- `visitorTeamId` (select, requerido — lista todos los equipos)
- `field` (string, requerido)
- `date` (date, requerido)
- `time` (time, requerido)

**Filtros:** por categoría, torneo, fecha.

**Vista:** partidos agrupados por torneo, ordenados por fecha/hora.

**Importación Excel:** via `UploadDrawer` → pipeline Excel completo → `importScheduleData()`.

---

### Componentes clave

| Componente | Propósito |
|-----------|----------|
| `Layout.jsx` | Shell: sidebar de navegación + `<Outlet />` |
| `Modal.jsx` | Modal genérico reutilizable |
| `UploadDrawer.jsx` | Drawer lateral para carga de Excel de fixture. Orquesta el pipeline Excel y muestra preview. |
| `ExcelUploader.jsx` | Modal de carga de Excel de jugadores. Usa `validatePlayerRow` de `sanitizer.js`. |
| `SchedulePreviewModal.jsx` | Muestra el modelo parseado antes de confirmar la importación |
| `ScheduleImportSummary.jsx` | Muestra estadísticas post-importación |
| `ScheduleImportErrors.jsx` | Muestra errores de filas inválidas del Excel |

---

## 12. Flujo de Datos Completo

### Lectura (carga inicial)

```
Browser monta App
  → AuthProvider verifica sesión (supabase.auth.getSession)
  → session válida → DataProvider monta
  → loadAll() ejecuta Promise.all de 5 fetches en paralelo
  → Estado local poblado
  → UI renderiza con datos
```

### Escritura individual (crear/editar/eliminar)

```
Usuario hace acción en UI (ej: crear torneo)
  → Página llama DataContext.addTournament(data)
  → DataContext: estado local actualizado con tempId (usuario ve resultado inmediato)
  → DataContext: llama insertTournament(data) → supabase.from('tournament').insert(toRow(data))
  → Supabase responde con el registro creado
  → DataContext: reemplaza tempId con el row real de DB
  → UI re-renderiza con ID real
```

### Escritura masiva (importar Excel)

```
Usuario sube archivo .xlsx
  → readWorkbook() carga el archivo
  → sheetToScheduleModel() ejecuta todo el pipeline de parseo
  → SchedulePreviewModal muestra el resultado
  → Usuario confirma
  → importScheduleData(model) en DataContext
    → importScheduleToDb(model) en scheduleImport.js
      → Upsert tournaments
      → Fetch + Insert teams
      → Insert games
    → loadAll() refresca todo el estado desde DB
  → UI actualizada con datos finales limpios
```

---

## 13. Convenciones de Código

### Naming

| Contexto | Convención | Ejemplo |
|---------|-----------|---------|
| DB columns | `snake_case` | `tournament_id`, `home_team_id` |
| App objects | `camelCase` | `tournamentId`, `homeTeamId` |
| PK en DB | `{tabla}_id` (bigserial) | `tournament_id`, `team_id` |
| PK en App | `id` | `tournament.id` |
| Tablas DB | singular | `tournament`, `team`, `player`, `game` |

### Mapeo de PK

Todas las PKs en la DB son `bigserial` (entero autoincremental). En el App Model todas se exponen como `id`. El servicios DB usa `.eq('{tabla}_id', id)` para las queries con filtro.

### Fechas y horarios

| Formato | Contexto |
|---------|---------|
| `timestamptz` | DB: `scheduled_datetime` en `game` |
| `'YYYY-MM-DD'` | App: `game.date`, `tournament.startDate` |
| `'HH:MM'` | App: `game.time` |
| `'YYYY-MM-DDThh:mm:ss'` | Conversión a DB en `toRow()` |

### Categorías

Las categorías son strings libres en la DB (`tournament.category TEXT`). Los valores canónicos están en `src/constants/categories.js`. El mapeo desde texto Excel se hace en `src/utils/schedule/categoryMapper.js`.

---

## 14. Integración con Otros Sistemas

Este panel es la **fuente de escritura** para las tablas base. Los otros sistemas deben leer de Supabase directamente.

### Datos que provee este panel

| Tabla | Qué contiene después de usarse el panel |
|-------|----------------------------------------|
| `tournament` | Todos los torneos de cada temporada |
| `team` | Todos los equipos registrados |
| `player` | Todos los jugadores registrados (sin asignación a equipo/torneo) |
| `game` | El fixture completo (partidos programados con status `draft`) |

### Datos que debe escribir la App Scoresheet

Las siguientes tablas **no son gestionadas por este panel**, son responsabilidad de la app scoresheet:

| Tabla | Responsable |
|-------|------------|
| `team_tournament` | Scoresheet: registra qué equipos participan en qué torneo |
| `player_team_tournament` | Scoresheet: roster de jugadores por equipo y torneo |
| `game_team` | Scoresheet: totales por equipo en un juego |
| `game_player` | Scoresheet: lineup del juego |
| `plate_appearance` | Scoresheet: turnos al bate |
| `pitch` | Scoresheet: pitcheos |
| `play` | Scoresheet: resultado del turno |
| `runner_advance` | Scoresheet: movimiento de corredores |
| `fielding_play_participant` | Scoresheet: participantes en jugada defensiva |

### Queries útiles para otros sistemas

**Obtener todos los partidos programados de un torneo:**
```sql
SELECT
    g.game_id,
    g.scheduled_datetime,
    g.field,
    g.venue,
    g.status,
    ht.name   AS home_team,
    at.name   AS away_team,
    t.name    AS tournament_name,
    t.season,
    t.category
FROM game g
JOIN team ht ON ht.team_id = g.home_team_id
JOIN team at ON at.team_id = g.away_team_id
JOIN tournament t ON t.tournament_id = g.tournament_id
WHERE g.tournament_id = {tournament_id}
ORDER BY g.scheduled_datetime ASC;
```

**Obtener todos los equipos (para armar el selector de fixture):**
```sql
SELECT team_id, name, club, city, abbreviation
FROM team
ORDER BY name;
```

**Obtener todos los jugadores:**
```sql
SELECT player_id, first_name, last_name, national_id, bat_hand, throw_hand
FROM player
ORDER BY last_name, first_name;
```

**Obtener torneos activos (con partidos draft/in_progress):**
```sql
SELECT DISTINCT t.tournament_id, t.name, t.season, t.category
FROM tournament t
JOIN game g ON g.tournament_id = t.tournament_id
WHERE g.status IN ('draft', 'in_progress')
ORDER BY t.season DESC, t.category;
```

### Supabase JS SDK — Ejemplo de conexión desde otro sistema

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Leer partidos de un torneo
const { data: games } = await supabase
    .from('game')
    .select(`
        game_id,
        scheduled_datetime,
        field,
        status,
        home_team:team!game_home_team_id_fkey(team_id, name),
        away_team:team!game_away_team_id_fkey(team_id, name)
    `)
    .eq('tournament_id', tournamentId)
    .order('scheduled_datetime')
```

### Tiempo Real (Broadcast)

Para actualizaciones en vivo durante un juego (manejado por la app scoresheet):
```
Canal: match-live-{game_id}
Evento: game_update
```

---

## 15. Variables de Entorno

El archivo `.env.local` (no versionado en git) debe contener:

```env
VITE_SUPABASE_URL=https://{project_id}.supabase.co
VITE_SUPABASE_ANON_KEY={anon_key_publica}
```

> **Seguridad:** Solo se usa la `anon key` (clave pública). La `service_role key` NUNCA debe estar en el frontend. La seguridad de lectura/escritura está gestionada por las políticas RLS en Supabase.

---

*Panel APS — Documentación Técnica — Abril 2026*
