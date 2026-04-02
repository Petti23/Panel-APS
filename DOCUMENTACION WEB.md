# Documentación Completa — Web APS (Softball Statics)

> **Propósito de este documento:** referencia técnica completa para agentes IA y desarrolladores que necesiten integrar, extender o consumir datos de esta aplicación. Cubre arquitectura, tecnologías, estructura de carpetas, flujo de datos, servicios, UI y patrones de integración.

---

## Índice

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Arquitectura de datos (Supabase)](#4-arquitectura-de-datos-supabase)
5. [Flujo de datos completo](#5-flujo-de-datos-completo)
6. [Módulo: Conexión a Supabase](#6-módulo-conexión-a-supabase)
7. [Módulo: Services (capa de acceso a datos)](#7-módulo-services-capa-de-acceso-a-datos)
8. [Módulo: Componentes React](#8-módulo-componentes-react)
9. [Módulo: App.jsx (orquestador principal)](#9-módulo-appjsx-orquestador-principal)
10. [Tiempo real: Supabase Broadcast](#10-tiempo-real-supabase-broadcast)
11. [Secciones de la UI y estado actual](#11-secciones-de-la-ui-y-estado-actual)
12. [Variables CSS y sistema de diseño](#12-variables-css-y-sistema-de-diseño)
13. [Entorno y configuración](#13-entorno-y-configuración)
14. [Cómo extender el proyecto](#14-cómo-extender-el-proyecto)
15. [Referencia rápida de tablas y relaciones](#15-referencia-rápida-de-tablas-y-relaciones)

---

## 1. Visión general del sistema

**APS Softball Statics** es una plataforma web de estadísticas de softball con dos partes diferenciadas:

```
┌──────────────────────────────────────────────────────────┐
│  App Planilla (scoresheet app)   [SISTEMA EXTERNO]        │
│  → Registra jugadas en tiempo real                        │
│  → Escribe en Supabase DB                                 │
│  → Emite broadcasts por canal match-live-{game_id}        │
└────────────────────┬─────────────────────────────────────┘
                     │  Supabase (PostgreSQL + Realtime)
                     │
┌────────────────────▼─────────────────────────────────────┐
│  Web APS  (ESTE PROYECTO)                                 │
│  → Lee datos históricos via REST / Supabase JS Client     │
│  → Se suscribe a broadcasts para datos en tiempo real     │
│  → Muestra resultados, estadísticas, equipos, jugadores   │
└──────────────────────────────────────────────────────────┘
```

**Rol de esta app:** 100% lectora. No escribe en la base de datos. Es la página pública de resultados y estadísticas.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework UI | React | 18.2.0 |
| Lenguaje | JavaScript (JSX) | ES Modules |
| Build tool | Vite + SWC | 7.1.7 |
| Backend/DB | Supabase (PostgreSQL hosted) | — |
| Cliente Supabase | @supabase/supabase-js | 2.39.8 |
| Animaciones | framer-motion | 11.0.24 |
| Iconos | lucide-react | 0.363.0 |
| Routing | react-router-dom | 6.22.3 |
| UI primitives | @radix-ui/react-avatar | 1.1.11 |
| Fuentes | Google Fonts: Inter + Outfit | — |
| CSS | CSS plano con variables CSS (sin Tailwind en producción de estilos, clases utilitarias marcadas con nombres descriptivos) | — |
| Lint | ESLint 8.57 | — |
| Deploy | (no configurado en el repo; se recomienda Vercel) | — |

---

## 3. Estructura de carpetas

```
Web-APS/
├── index.html                  # Entry point HTML. Carga fuentes y el módulo /src/main.jsx
├── vite.config.js              # Config Vite: plugin React-SWC, puerto 5173
├── package.json                # Dependencias y scripts
├── .eslintrc.cjs               # Configuración ESLint
│
├── src/
│   ├── main.jsx                # Bootstrap: ReactDOM.createRoot → <App />
│   ├── App.jsx                 # Componente raíz. Orquesta todo el estado global y layout
│   ├── index.css               # Sistema de diseño: variables CSS, clases de layout global
│   │
│   ├── lib/
│   │   └── supabase.js         # Inicialización del cliente Supabase (singleton exportado)
│   │
│   ├── services/
│   │   ├── gameService.js      # Queries relacionadas a partidos (getRecentGames, getGameDetail)
│   │   ├── playerService.js    # Queries de jugadores
│   │   └── teamService.js      # Queries de equipos
│   │
│   ├── hooks/
│   │   ├── useLiveMatch.js         # Suscripción broadcast para un partido individual (modal)
│   │   └── useLiveGameScores.js    # Suscripción broadcast para N partidos (lista de resultados)
│   │
│   ├── components/
│   │   ├── common/
│   │   │   └── LoadingSpinner.jsx   # Spinner animado con framer-motion
│   │   ├── results/
│   │   │   └── GameModal.jsx        # Modal detalle de partido: score, jugadas, lineup, defensa
│   │   ├── sections/
│   │   │   └── Resultados.jsx       # (vacío) — pendiente de extraer de App.jsx
│   │   └── stats/                   # (vacío) — pendiente de implementar
│   │
│   └── assets/
│       └── logo.png                 # Logo APS PLAY
│
├── .agents/
│   ├── rules.md                # Reglas para agentes IA en este repo
│   └── skills.md               # Skills disponibles para agentes
│
├── Documentacion Base de Datos.md   # Esquema completo de la DB
└── Documentacion Planilla.md        # API de tiempo real y broadcast
```

### Convención de módulos

- **`lib/`** — infraestructura y singletons (conexión DB, auth, etc.)
- **`services/`** — toda la lógica de acceso a datos. Los componentes NUNCA llaman a Supabase directamente; siempre pasan por un service.
- **`components/`** — componentes React organizados por dominio/feature
- **`hooks/`** — custom hooks React (todavía vacío; la lógica de tiempo real debería ir aquí)

---

## 4. Arquitectura de datos (Supabase)

### Conexión

- **URL:** `https://rbyqrbvwpsvdpntkyaoc.supabase.co`
- **Anon Key:** configurada en `src/lib/supabase.js`. Debe moverse a `.env` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en producción.
- **RLS:** habilitada en todas las tablas; actualmente permite `SELECT` público sin autenticación.

### Modelo relacional resumido

```
tournament (1)
  │
  ├──< team_tournament >── team (1)
  │         │
  │         └──< player_team_tournament >── player (1)
  │
  └──< game (N)
         │
         ├──< game_team       (2 filas: home + away — cache de runs/hits/errors)
         ├──< game_player     (N filas: lineup del partido)
         │
         └──< plate_appearance  (1 fila por turno al bate)
                  │
                  ├──< pitch                       (N lanzamientos)
                  ├──── play                       (1 resultado por turno — 1-to-1)
                  │         └──< fielding_play_participant (N fildeadores)
                  └──< runner_advance              (N movimientos de corredores)
```

### Tablas y su propósito

| Tabla | Propósito | Escribe quién |
|-------|-----------|--------------|
| `tournament` | Torneos (nombre, temporada, categoría) | App planilla / admin |
| `team` | Equipos (nombre, club, ciudad, abreviación) | App planilla / admin |
| `player` | Jugadores (nombres, DNI, mano) | App planilla / admin |
| `team_tournament` | Inscripción de equipos en torneos | App planilla / admin |
| `player_team_tournament` | Nómina de jugadores por equipo/torneo | App planilla / admin |
| `game` | Cabecera del partido (estado, fecha, equipos, innings) | App planilla |
| `game_team` | Cache de totales por equipo (runs, hits, errors, lob) | App planilla |
| `game_player` | Lineup + batting order + posición defensiva | App planilla |
| `plate_appearance` | Un turno al bate completo | App planilla |
| `pitch` | Cada lanzamiento individual | App planilla |
| `play` | Resultado del turno (1-to-1 con plate_appearance) | App planilla |
| `fielding_play_participant` | Fildeadores involucrados en la jugada | App planilla |
| `runner_advance` | Movimientos de corredores en una jugada | App planilla |

### Vistas y Vistas Materializadas (solo lectura)

Las estadísticas se calculan via vistas. Las **Materialized Views** se auto-refrescan cuando un partido cambia su estado a `closed` (trigger `trg_game_close_refresh`).

| Vista / MV | Propósito |
|------------|-----------|
| `v_batting_stats_player_game` | Estadísticas de bateo por jugador/partido (tiempo real) |
| `v_batting_stats_player_tournament` | Estadísticas de bateo por jugador/torneo |
| `v_fielding_stats_player_game` | Estadísticas defensivas por jugador/partido |
| `v_pitching_stats_player_game` | Estadísticas de pitcheo por jugador/partido |
| `v_pitching_stats_player_tournament` | Estadísticas de pitcheo por jugador/torneo |
| `mv_batting_stats_player_game` | MV — snapshot grabado de batting por partido |
| `mv_batting_stats_player_tournament` | MV — snapshot grabado de batting por torneo |
| `mv_fielding_stats_player_game` | MV — snapshot grabado de fielding |
| `mv_pitching_stats_player_game` | MV — snapshot grabado de pitching por partido |
| `mv_pitching_stats_player_tournament` | MV — snapshot grabado de pitching por torneo |

> **Regla:** Para consultas históricas usar **Materialized Views** (más rápidas). Para partidos `in_progress` usar las **Vistas** directas.

---

## 5. Flujo de datos completo

### 5.1 Carga inicial de la página

```
Browser
  │
  ├── main.jsx → ReactDOM.createRoot → <App />
  │
  └── App.jsx useEffect (mount)
        │
        ├── gameService.getRecentGames()
        │     └── supabase.from('game').select(*)
        │           with: home_team (join team), away_team (join team), game_team
        │     → setGames(data)
        │
        ├── playerService.getPlayerCount()
        │     └── supabase.from('player').select(count)
        │     → setPlayerCount(count)
        │
        ├── teamService.getTeamCount()
        │     └── supabase.from('team').select(count)
        │     → setTeamCount(count)
        │
        └── teamService.getTeams()
              └── supabase.from('team').select(*)
              → setTeams(data)
```

### 5.2 Datos que llegan de `getRecentGames()`

El objeto `game` retornado tiene la siguiente forma:

```typescript
interface GameRecord {
  game_id: number
  tournament_id: number
  scheduled_datetime: string       // ISO 8601 UTC
  field: string | null
  home_team_id: number
  away_team_id: number
  status: 'draft' | 'in_progress' | 'submitted' | 'closed'
  scheduled_innings: number        // default 7
  mercy_rule: boolean
  created_at: string               // ISO 8601 UTC

  // Relaciones resueltas por Supabase JS:
  home_team: { name: string; abbreviation: string | null }
  away_team: { name: string; abbreviation: string | null }
  game_team: Array<{ team_id: number; runs: number }>
}
```

### 5.3 Cálculo del score en el frontend

> ⚠️ **`game_team.runs` NO se usa para partidos en curso.** La app planilla solo escribe `game_id, team_id, is_home` en `game_team` durante el partido. El campo `runs` queda en 0 hasta que el partido se cierra. El score real se calcula desde `plate_appearance + runner_advance`.

**Para partidos `in_progress`** — `App.jsx` usa `useLiveGameScores` que hace:
1. Al montar: query `plate_appearance.batting_team_id` + `runner_advance(run_scored=true)` → score inicial desde DB
2. Al llegar broadcast: recalcula desde `plays[]` del payload usando Set de player IDs del equipo local

**Para partidos cerrados** — sigue usando `game_team.runs` (ya tiene el total final):
```javascript
const live = liveScores[game.game_id]  // del hook useLiveGameScores
const homeRuns = live?.homeRuns ?? game.game_team?.find(r => r.team_id === game.home_team_id)?.runs ?? 0
const awayRuns = live?.awayRuns ?? game.game_team?.find(r => r.team_id === game.away_team_id)?.runs ?? 0
```

### 5.4 Estado del partido (`game.status`)

| Estado | Significado para la web |
|--------|------------------------|
| `draft` | Partido creado, sin lineup — mostrar como "Programado" |
| `in_progress` | Partido en curso — mostrar "En curso" + indicador live |
| `submitted` | En revisión — mostrar como "Final" |
| `closed` | Finalizado con stats disponibles — mostrar "Final" |

Lógica en el componente:
```javascript
const statusLabel = game.status === 'in_progress'
  ? 'En curso'
  : (game.status === 'closed' || game.status === 'submitted')
    ? 'Final'
    : 'Programado'
const isLive = game.status === 'in_progress'
```

---

## 6. Módulo: Conexión a Supabase

**Archivo:** `src/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbyqrbvwpsvdpntkyaoc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- Exporta un **singleton** `supabase` usado por todos los services.
- Prioriza variables de entorno (`.env`) sobre los valores hardcodeados.
- Variables de entorno requeridas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 7. Módulo: Services (capa de acceso a datos)

Todos los services siguen el mismo patrón: importan `supabase` de `lib/supabase.js`, ejecutan la query y retornan los datos o un fallback (array vacío / 0 / `null`). Nunca lanzan excepciones al componente; los errores se loguean en consola y se retorna un valor seguro.

### `gameService.js`

```
getRecentGames() → GameRecord[]
  Query: game + home_team (join team) + away_team (join team) + game_team (join)
  Order: scheduled_datetime DESC
  Limit: 20

getGameDetail(gameId) → GameDetailRecord | null
  Query 1: game + home_team + away_team + game_team + tournament (single)
  Query 2: game_player con join player (ordered by batting_order)
  Query 3: plate_appearance con join batter + pitcher + play + runner_advance
  Returns: { ...game, lineup: GamePlayer[], plays: PlateAppearance[] }

getGameStats() → number
  Query: COUNT de game
```

**`getGameDetail` — detalle del objeto retornado:**
```typescript
interface GameDetailRecord {
  // todos los campos de game +
  home_team: Team          // join completo
  away_team: Team
  game_team: GameTeam[]    // 2 filas: is_home true/false
  tournament: Tournament
  lineup: Array<{
    game_id, team_id, player_id, batting_order,
    defensive_position, is_starter, lineup_role,
    player: { player_id, first_name, last_name, bat_hand, throw_hand }
  }>
  plays: Array<{
    plate_appearance_id, game_id, inning, half, pa_index,
    batting_team_id, batter_id, pitcher_id, outs_start,
    batter: { player_id, first_name, last_name }
    pitcher: { player_id, first_name, last_name }
    play: { play_id, play_type, rbi, runs_on_play, outs_on_play,
            counts_ab, counts_hit, bases_hit, description, ... }
    runner_advance: Array<{
      advance_id, runner_id, start_base, end_base,
      reason, run_scored, out_flag, out_type
    }>
  }>
}
```

### `playerService.js`

```
getPlayerCount() → number
  Query: COUNT de player

getTopPlayers() → Player[]
  Query: player.*  LIMIT 10
  (no usado en UI todavía — disponible para sección de jugadores)
```

### `teamService.js`

```
getTeamCount() → number
  Query: COUNT de team

getTeams() → Team[]
  Query: team.* (todos los campos)
  Usado para: sidebar panel de equipos
```

### Cómo agregar un nuevo service

1. Crear `src/services/miServicio.js`
2. Importar `supabase` de `../lib/supabase`
3. Exportar funciones async con manejo de error simple:
```javascript
import { supabase } from '../lib/supabase'

export const getMisDatos = async () => {
  const { data, error } = await supabase
    .from('mi_tabla')
    .select('...')
  if (error) return []
  return data
}
```
4. Importar en `App.jsx` o en el componente que corresponda.

---

## 8. Módulo: Componentes React

### `components/common/LoadingSpinner.jsx`

Spinner circular animado con `framer-motion`. Se usa mientras se cargan datos.

```jsx
// Uso:
<LoadingSpinner />
```

No recibe props.

### `components/sections/Resultados.jsx`

**Actualmente vacío.** Destinado a extraer la lógica de listado de partidos que hoy vive en `App.jsx`. Al extraerla, recibiría props:

```typescript
interface ResultadosProps {
  games: GameRecord[]
  loading: boolean
}
```

### `components/results/GameModal.jsx`

Modal completo de detalle de partido. Se abre al hacer click en una `result-card`.

**Props:**
```typescript
{ gameId: number, onClose: () => void }
```

**Estructura interna:**
- Usa `getGameDetail(gameId)` para el estado inicial (DB)
- Usa `useLiveMatch(gameId)` para recibir broadcast en tiempo real
- Si hay broadcast activo con plays, usa esos datos (tiempo real); si no, usa los plays de la DB

**3 tabs:**
| Tab | ID | Contenido |
|-----|----|-----------|
| Jugadas | `pbp` | Play-by-play agrupado por entrada/half |
| Lineup | `lineup` | Tabla de bateadores titular de cada equipo |
| Defensa | `field` | Grid visual del campo con posiciones |

**Sub-componentes internos:**
- `Linescore` — tabla de carreras por entrada (R/H/E). Los totales R usan `homeRunsDisplay/awayRunsDisplay` calculados desde broadcast si está activo
- `PlayByPlay` — agrupa jugadas reales (filtra `INNING_MARKER`, `DEF_SWAP`, `DEF_SUB`) por `inning + half`
- `LineupTable` — filtra `lineup` por `Number(team_id) === Number(teamId) && is_starter !== false`, ordenado por `batting_order`
- `DefenseField` — muestra posiciones `P C 1B 2B 3B SS LF CF RF` con avatar y apellido
- `broadcastPlaysToDisplay(plays, detail)` — convierte play[] del broadcast (códigos like `HR`, `1B`) al formato interno de plate_appearance de la DB usando `BROADCAST_CODE_TO_DB` mapping

**BROADCAST_CODE_TO_DB mapping:**
```javascript
{ '1B':'SINGLE', '2B':'DOUBLE', '3B':'TRIPLE',
  'HR':'HOME_RUN', 'IPHR':'HOME_RUN',
  'BB':'WALK', 'IBB':'INTENTIONAL_WALK',
  'HP':'HIT_BY_PITCH', 'HBP':'HIT_BY_PITCH',
  'K':'STRIKEOUT', 'Ks':'STRIKEOUT', 'Kc':'STRIKEOUT',
  'F':'FLYOUT', 'FO':'FLYOUT', 'L':'LINEOUT',
  'G':'GROUNDOUT', 'P':'POPOUT',
  'E':'REACH_ON_ERROR', 'FC':'FIELDERS_CHOICE',
  'SAC':'SAC_BUNT', 'SF':'SAC_FLY' }
```

**Cálculo de carreras en HomeRun (broadcast):** `bases[3] === true` → se agrega un `runner_advance` ficticio `{ run_scored: true, end_base: 4 }` para el bateador, evitando que el linescore muestre 0.

### `components/stats/`

Vacía. Preparada para tablas de estadísticas y leaderboards.

---

## 9. Módulo: App.jsx (orquestador principal)

`App.jsx` es actualmente el componente monolítico que maneja:

### Estado global

```javascript
const [games, setGames] = useState([])           // lista de partidos
const [teams, setTeams] = useState([])            // todos los equipos (para sidebar)
const [playerCount, setPlayerCount] = useState(0) // contador de jugadores
const [teamCount, setTeamCount] = useState(0)     // contador de equipos
const [loading, setLoading] = useState(true)      // estado de carga general
const [isMenuOpen, setIsMenuOpen] = useState(false) // sidebar móvil
const [activeSection, setActiveSection] = useState('RESULTADOS') // sección activa
const [error, setError] = useState(null)          // mensaje de error global
const [selectedGameId, setSelectedGameId] = useState(null) // ID del partido abierto en modal

// Scores en tiempo real (broadcast) para partidos en curso
const liveGames = games
  .filter(g => g.status === 'in_progress')
  .map(g => ({ gameId: g.game_id, homeTeamId: g.home_team_id }))
const liveScores = useLiveGameScores(liveGames)
// liveScores: { [gameId]: { homeRuns, awayRuns, connected } }
```

### Secciones disponibles (menuItems)

| ID | Ícono | Estado |
|----|-------|--------|
| `RESULTADOS` | Activity | ✅ Implementado |
| `EQUIPOS` | Users | ⚠️ Solo muestra lista en sidebar |
| `VIDEO` | Video | ❌ Sin contenido |
| `NOTICIAS` | BookOpen | ❌ Sin contenido |
| `POSICIONES` | Trophy | ❌ Sin contenido |
| `CALENDARIO` | Calendar | ❌ Sin contenido |
| `ESTADÍSTICAS` | Activity | ❌ Sin contenido |
| `JUGADORES` | Users | ❌ Sin contenido |

### Layout del componente

```
<div min-h-screen>
  <AnimatePresence>          ← Sidebar móvil (slide-in)
    backdrop overlay
    <sidebar>
      nav items
      subpanel (muestra lista de equipos si activeSection=EQUIPOS)
    </sidebar>
  </AnimatePresence>

  <header>                   ← Barra superior
    hamburger (mobile) | logo
    nav desktop
    search + user + btns

  <nav secondary-nav>        ← Nav secundaria (solo mobile, 4 items)

  <main>
    error banner (si hay error)

    <results-page>
      page-header (título + meta pills: N equipos, N jugadores)
      results-body
        LoadingSpinner | empty state | lista de partidos

  <footer>
```

### Estructura de una tarjeta de partido (`result-card`)

```
rc-date                → fecha + badge de estado (con punto animado si isLive)
rc-matchup
  rc-team (home)       → avatar + nombre + "Local"
  rc-score-block       → homeRuns — awayRuns
  rc-team (away)       → "Visitante" + nombre + avatar
rc-arrow               → › chevron
```

---

## 10. Tiempo real: Supabase Broadcast

> ✅ **Implementado.** La web recibe broadcast en tiempo real tanto en la lista de resultados como dentro del modal de partido.

### Canal

```
match-live-{game_id}
```

Donde `game_id` es el `game_id` de la tabla `game`.

### Evento a escuchar

```
game_update
```

### Payload: `GameBroadcast`

```typescript
interface GameBroadcast {
  homeTeamName: string
  visitorTeamName: string
  homeTeamId: string
  visitorTeamId: string
  plays: Play[]        // array COMPLETO de jugadas hasta ese momento
  innings: number      // innings programados
  timestamp: number    // Unix timestamp ms
}

interface Play {
  id: string
  inning: number
  batterId: string     // puede ser "INNING_MARKER" | "DEF_SWAP" | "DEF_SUB" → filtrar
  type: PlayType       // ver tabla en sección 10.1
  result: string
  secondaryResult?: string
  rbi: number
  out: boolean
  bases?: [boolean, boolean, boolean, boolean]  // [1ra, 2da, 3ra, home]
  runnerActions?: { [base: number]: string[] }
  runnerAdvances?: Record<string, number>        // ID jugada → base final (4=home, 0=out)
  balls?: number
  strikes?: number
}
```

### 10.1 Tabla de PlayType

| Código | DB (`play_type`) | Descripción |
|--------|-----------------|-------------|
| `1B` | `SINGLE` | Sencillo |
| `2B` | `DOUBLE` | Doble |
| `3B` | `TRIPLE` | Triple |
| `HR` | `HOME_RUN` | Cuadrangular |
| `IPHR` | `HOME_RUN` | Home run interno |
| `BB` | `WALK` | Base por bolas |
| `IBB` | `INTENTIONAL_WALK` | Base intencional |
| `HP` / `HBP` | `HIT_BY_PITCH` | Hit por lanzamiento |
| `K` / `Ks` / `Kc` | `STRIKEOUT` | Ponche |
| `F` / `FO` | `FLYOUT` | Fly out |
| `L` | `LINEOUT` | Línea out |
| `G` | `GROUNDOUT` | Rolling |
| `P` | `POPOUT` | Pop up |
| `E` | `REACH_ON_ERROR` | Alcanza por error |
| `FC` | `FIELDERS_CHOICE` | Campo del fildeador |
| `SAC` | `SAC_BUNT` | Bunt de sacrificio |
| `SF` | `SAC_FLY` | Fly de sacrificio |

### 10.2 Hook `useLiveMatch` — para el modal (1 partido)

**Archivo:** `src/hooks/useLiveMatch.js`

```javascript
export function useLiveMatch(gameId) {
  const [broadcast, setBroadcast] = useState(null)
  // se suscribe a match-live-{gameId}, config: { broadcast: { ack: false } }
  // al recibir 'game_update' → setBroadcast(payload)  // SIEMPRE reemplazar, nunca merge
  // cleanup en unmount: supabase.removeChannel(channel)
  return broadcast  // GameBroadcast | null
}
```

Usado por `GameModal.jsx`. Retorna `null` hasta el primer mensaje recibido.

### 10.3 Hook `useLiveGameScores` — para la lista (N partidos)

**Archivo:** `src/hooks/useLiveGameScores.js`

Suscribe a múltiples partidos simultáneamente y calcula sus scores.

**Input:** `Array<{ gameId: number, homeTeamId: number }>` (solo partidos `in_progress`)

**Output:** `{ [gameId]: { homeRuns: number, awayRuns: number, connected: boolean } }`

**Flujo interno:**
1. Para cada `gameId`, crea canal `match-live-{gameId}` con `ack: false`
2. Inmediatamente llama `fetchDbScore()` — 2 queries separadas para evitar problemas de FK:
   - `plate_appearance` → `{ plate_appearance_id, batting_team_id }` filtrado por `game_id`
   - `runner_advance` → `{ pa_id }` filtrado por `pa_id IN [...]` y `run_scored = true`
   - Suma carreras por equipo y setea el estado inicial
3. Al recibir broadcast: recalcula desde `broadcast.plays[]` usando Set de player IDs del equipo local (cacheado en `lineupCacheRef`)
4. El broadcast siempre gana si ya tiene datos (>0); el score de DB no pisa el broadcast

**Por qué 2 queries separadas para el score DB:** la nested relation de Supabase JS (`runner_advance(run_scored)`) requiere conocer el nombre exacto de la FK constraint. Al usar queries separadas + join manual en JS, se evita ese problema.

### 10.4 Calcular carreras desde plays[] del broadcast

```javascript
// En App.jsx / useLiveGameScores — cálculo desde broadcast:
for (const p of broadcast.plays) {
  if (SYSTEM_IDS.has(p.batterId)) continue
  const isHome = homePlayerIds.has(String(p.batterId))
  const batterScored = p.bases?.[3] === true ? 1 : 0          // HR, IPHR
  const runnersScored = Object.values(p.runnerAdvances || {})
    .filter(b => b === 4).length                               // corredores a home
  // batterScored y runnersScored son mutuamente excluyentes — no hay doble conteo
  if (isHome) homeRuns += batterScored + runnersScored
  else awayRuns += batterScored + runnersScored
}
```

### 10.5 Filtrado de jugadas del sistema

```javascript
const SYSTEM_IDS = new Set(['INNING_MARKER', 'DEF_SWAP', 'DEF_SUB'])
// Siempre filtrar antes de calcular scores o mostrar en el feed
const realPlays = plays.filter(p => !SYSTEM_IDS.has(p.batterId))
```

### 10.6 Inferencia del `half` desde broadcast

El broadcast no incluye `half` (top/bottom). Se infiere comparando el `team_id` del bateador con `home_team_id` del partido:
```javascript
half = Number(playerInfo.team_id) === Number(detail.home_team_id) ? 'B' : 'T'
```
**Importante:** usar `Number()` para comparar — los IDs pueden llegar como `string` o `number` según la fuente.

### 10.7 Indicadores en la UI

- `isBroadcasting = isLive && liveScores[gameId]?.connected` — muestra ícono 📡 en la result-card
- Punto animado `.live-dot` — visible en `isLive` independientemente del broadcast
- Badge `LIVE` en el modal — visible cuando `broadcastActive = !!broadcast`

### 10.8 URL directa a partido en vivo (app planilla)

```
https://[dominio-planilla]/?match={game_id}
```

---

## 11. Secciones de la UI y estado actual

| Sección | Datos necesarios | Service a crear/usar | Estado |
|---------|-----------------|---------------------|--------|
| Resultados | `getRecentGames()` | `gameService` | ✅ Implementado |
| Equipos | `getTeams()` detallado + stats | `teamService` | ⚠️ Solo sidebar |
| Video | (externo o CMS) | — | ❌ Pendiente |
| Noticias | (externo o CMS) | — | ❌ Pendiente |
| Posiciones | `game_team` groupBy tournament | nuevo service | ❌ Pendiente |
| Calendario | `game` por torneo ordenado por fecha | `gameService` | ❌ Pendiente |
| Estadísticas | `mv_batting_stats_player_tournament` | nuevo service | ❌ Pendiente |
| Jugadores | `player` + `mv_batting_stats_player_tournament` | `playerService` | ❌ Pendiente |

---

## 12. Variables CSS y sistema de diseño

Definido en `src/index.css`. Todo el diseño usa la paleta de colores "MLB-inspired".

### Colores (`--mlb-*`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--mlb-navy` | `#031a00` | Fondo header, footer, textos principales |
| `--mlb-blue` | `#053a00` | Color secundario |
| `--mlb-red` | `#BF0D10` | Acento, logo text, badges live |
| `--mlb-gray-bg` | `#F5F5F5` | Fondo principal |
| `--mlb-white` | `#FFFFFF` | Fondo de cards |
| `--mlb-border` | `#E7E7E7` | Bordes |
| `--mlb-text` | `#333333` | Texto general |
| `--mlb-text-light` | `#666666` | Texto secundario/muted |

### Tipografía

- **Cuerpo:** `Inter` (400, 500, 600, 700) — via Google Fonts
- **Títulos (`h1`–`h6`):** `Outfit` (400, 500, 600, 700) — via Google Fonts

### Clases utilitarias principales

| Clase | Propósito |
|-------|-----------|
| `.mlb-card` | Card blanca con borde sutil y shadow |
| `.results-page`, `.results-body`, `.results-list` | Layout de la sección de resultados |
| `.result-card` | Tarjeta individual de partido |
| `.rc-date`, `.rc-matchup`, `.rc-score-block`, `.rc-team` | Partes de la tarjeta de partido |
| `.rc-status-badge` | Badge de estado (verde live, gris normal) |
| `.live-dot` | Punto verde animado para partidos en vivo |
| `.mlb-header`, `.header-left`, `.header-center`, `.header-right` | Header layout |
| `.sidebar`, `.sidebar-overlay`, `.sidebar-header`, `.sidebar-content` | Sidebar deslizable |
| `.nav-menu`, `.nav-item` | Nav desktop |
| `.secondary-nav`, `.secondary-item` | Nav mobile secundaria |
| `.btn`, `.btn-primary`, `.btn-outline` | Botones |
| `.meta-pill` | Pill de metadata (N equipos, N jugadores) |
| `.desktop-only`, `.mobile-only` | Responsive visibility |

---

## 13. Entorno y configuración

### Variables de entorno

Crear `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://rbyqrbvwpsvdpntkyaoc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key del proyecto>
```

> Las variables sin este archivo ya están hardcodeadas en `src/lib/supabase.js` como fallback. En producción siempre usar el `.env`.

### Scripts

```bash
npm run dev       # Servidor de desarrollo en http://localhost:5173
npm run build     # Build de producción en /dist
npm run preview   # Preview del build de producción
npm run lint      # ESLint con max-warnings 0
```

### Requisitos de Supabase

Para que la app funcione correctamente, el proyecto Supabase debe tener:

- **Realtime** habilitado.
- **Broadcast** habilitado (no requiere tablas extra).
- **RLS** con política de `SELECT` público sobre: `game`, `game_team`, `team`, `player`, `game_player`, `tournament`, `plate_appearance`, `play`, `runner_advance`.
- Todas las **Materialized Views** accesibles con la anon key.

---

## 14. Cómo extender el proyecto

### Agregar una nueva sección (ejemplo: Estadísticas)

1. **Crear el service** en `src/services/statsService.js`:
```javascript
import { supabase } from '../lib/supabase'

export const getBattingLeaderboard = async (tournamentId) => {
  const { data, error } = await supabase
    .from('mv_batting_stats_player_tournament')
    .select(`*, player(first_name, last_name)`)
    .eq('tournament_id', tournamentId)
    .order('avg', { ascending: false, nullsFirst: false })
  if (error) return []
  return data
}
```

2. **Crear el componente** en `src/components/stats/BattingLeaderboard.jsx`.

3. **Conectar en `App.jsx`**: importar el service en el `useEffect` inicial, agregar estado, y renderizar el componente cuando `activeSection === 'ESTADÍSTICAS'`.

### Agregar tiempo real a un partido

1. Crear `src/hooks/useLiveMatch.js` (ver sección 10.2).
2. Crear una vista de partido en vivo que lo use.
3. Leer `?match=` de los query params para abrir automáticamente:
```javascript
const params = new URLSearchParams(window.location.search)
const matchId = params.get('match')
```

### Agregar routing (múltiples páginas)

`react-router-dom` ya está instalado. Configurar en `main.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
// ...
<BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/partido/:id" element={<MatchDetail />} />
  </Routes>
</BrowserRouter>
```

---

## 15. Referencia rápida de tablas y relaciones

### Queries más comunes para la web

**Partidos recientes con score:**
```sql
SELECT g.*, ht.name AS home_name, at.name AS away_name,
       gt_home.runs AS home_runs, gt_away.runs AS away_runs
FROM game g
JOIN team ht ON ht.team_id = g.home_team_id
JOIN team at ON at.team_id = g.away_team_id
LEFT JOIN game_team gt_home ON gt_home.game_id = g.game_id AND gt_home.team_id = g.home_team_id
LEFT JOIN game_team gt_away ON gt_away.game_id = g.game_id AND gt_away.team_id = g.away_team_id
ORDER BY g.scheduled_datetime DESC LIMIT 20;
```

**Tabla de posiciones por torneo:**
```sql
SELECT t.name, SUM(gt.runs) AS total_runs, COUNT(*) AS games_played
FROM game_team gt
JOIN team t ON t.team_id = gt.team_id
JOIN game g ON g.game_id = gt.game_id
WHERE g.tournament_id = {id} AND g.status = 'closed'
GROUP BY t.team_id, t.name ORDER BY total_runs DESC;
```

**Leaderboard de bateo:**
```sql
SELECT p.first_name, p.last_name, m.*
FROM mv_batting_stats_player_tournament m
JOIN player p ON p.player_id = m.player_id
WHERE m.tournament_id = {id}
ORDER BY m.avg DESC NULLS LAST;
```

**Score por entrada:**
```sql
SELECT pa.inning, pa.half,
       COUNT(*) FILTER (WHERE ra.run_scored = true) AS runs
FROM plate_appearance pa
LEFT JOIN runner_advance ra ON ra.pa_id = pa.plate_appearance_id
WHERE pa.game_id = {id} AND pa.batting_team_id = {team_id}
GROUP BY pa.inning, pa.half ORDER BY pa.inning, pa.half;
```

### Avatar de jugadores

```
https://api.dicebear.com/9.x/avataaars/svg?seed={player_id}&backgroundColor=b6e3f4,c0aede,d1d4f9
```

---

*Documentación generada — Softball Statics Web APS — Abril 2026*
