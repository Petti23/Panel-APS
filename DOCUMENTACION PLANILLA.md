# Softball Statics — Documentación Arquitectural Completa

> **Versión:** 2026  
> **Propósito:** Guía completa para agentes y desarrolladores que integren o extiendan este sistema. Cubre arquitectura, flujo de datos, contratos de API, estado local y protocolo en tiempo real.

---

## Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Tipos de Datos Centrales](#4-tipos-de-datos-centrales)
5. [Arquitectura de Capas](#5-arquitectura-de-capas)
6. [Flujo de Datos Completo](#6-flujo-de-datos-completo)
7. [Capa de Persistencia — Supabase](#7-capa-de-persistencia--supabase)
8. [Estado del Cliente (localStorage)](#8-estado-del-cliente--localstorage)
9. [Tiempo Real — Broadcast Protocol](#9-tiempo-real--broadcast-protocol)
10. [API de Servicio (`src/services/api.ts`)](#10-api-de-servicio-srcservicesapits)
11. [Lógica de Juego (`src/utils/gameLogic.ts`)](#11-lógica-de-juego-srcutilsgamelogicts)
12. [Cálculo de Estadísticas (`src/utils/statsCalculator.ts`)](#12-cálculo-de-estadísticas-srcutilsstatscalculatorts)
13. [Auto-Save y Cola de Sincronización](#13-auto-save-y-cola-de-sincronización)
14. [Navegación y Rutas](#14-navegación-y-rutas)
15. [Componentes Clave](#15-componentes-clave)
16. [Reglas de Seguridad](#16-reglas-de-seguridad)
17. [Guía de Integración para Sistemas Externos](#17-guía-de-integración-para-sistemas-externos)
18. [Diagramas de Flujo](#18-diagramas-de-flujo)

---

## 1. Visión General del Sistema

Softball Statics es una **aplicación de planilla deportiva en tiempo real** para partidos de softball. Funciona como la **fuente autoritativa de datos** durante un partido:

```
┌─────────────────────────────────────────────────────────────────┐
│  PLANILLERO  (esta app)                                         │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────────────┐   │
│  │ GameView │──▶│ useAutoSave  │──▶│ Supabase DB           │   │
│  │          │   └──────────────┘   │  game / game_player   │   │
│  │  Registra│   ┌──────────────┐   │  plate_appearance     │   │
│  │  jugadas │──▶│  Broadcaster │──▶│  play / runner_advance│   │
│  └──────────┘   │  (Broadcast) │   └───────────────────────┘   │
│                 └──────────────┘           ▲                    │
└─────────────────────────────────────────────│───────────────────┘
                                             │ REST / RPC
        ┌────────────────────────────────────┴────────────────────┐
        │  CONSUMIDORES EXTERNOS                                  │
        │                                                         │
        │  Página de Resultados  ──── Broadcast Channel ──────▶  │
        │  App de Estadísticas   ──── Supabase REST   ────────▶  │
        │  Sitio Público         ──── Materialized Views ──────▶  │
        └─────────────────────────────────────────────────────────┘
```

**Principios clave:**
- Las jugadas se guardan en `localStorage` inmediatamente (sin pérdida ante desconexión).
- Cada 10 segundos (o en eventos clave) se sincronizan con Supabase.
- Cada jugada emite un broadcast al canal `match-live-{matchId}` con el estado **completo** del partido.
- Los consumidores externos deben **REEMPLAZAR** su estado local con el payload del broadcast, no hacer merge parcial.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React | 19 |
| Lenguaje | TypeScript | 5.9 |
| Bundler | Vite | 7 |
| Estilos | TailwindCSS | 3 |
| Base de datos | Supabase (PostgreSQL) | — |
| Iconos | lucide-react | — |
| Testing | Vitest | — |

---

## 3. Estructura de Carpetas

```
src/
├── App.tsx                    # Raíz: navegación y estado de alto nivel
├── main.tsx                   # Entry point React
├── types.ts                   # ⭐ Tipos centrales del dominio
├── constants.ts               # Constantes globales
│
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.tsx  # Recuperación de errores de componentes
│   │   ├── SaveIndicator.tsx  # Indicador visual de auto-save
│   │   └── SessionRecoveryModal.tsx # Modal para recuperar sesión
│   ├── game/
│   │   ├── GameView.tsx       # ⭐ Orquestador principal del partido
│   │   ├── GameLayout.tsx     # Layout: planilla doble (local + visitante)
│   │   ├── GameplayActions.tsx # Botones de acción (Ball, Strike, etc.)
│   │   ├── ActionModal.tsx    # Modal de registro de jugada
│   │   ├── Scorecard.tsx      # Grilla por entrada de un equipo
│   │   ├── Scoreboard.tsx     # Marcador visual
│   │   ├── InningCell.tsx     # Celda individual de la grilla
│   │   ├── PlayerRow.tsx      # Fila del jugador en la grilla
│   │   ├── FieldDisplay.tsx   # Visualización del diamante
│   │   ├── FieldPlayerModal.tsx # Modal al clickear jugador en campo
│   │   ├── LiveMatchView.tsx  # ⭐ Vista para espectadores en tiempo real
│   │   ├── AddSubModal.tsx    # Modal de sustitución
│   │   ├── DefensiveSwapModal.tsx # Modal de cambio defensivo
│   │   └── TeamNameModal.tsx  # Modal para editar nombre del equipo
│   ├── lineup/
│   │   ├── LineupSetup.tsx    # Configuración del lineup antes del partido
│   │   └── PlayerEditModal.tsx # Modal de edición de jugador en el lineup
│   ├── team/
│   │   └── TeamManager.tsx    # Gestión de equipos y jugadores
│   └── tournament/
│       ├── Home.tsx           # Pantalla de inicio
│       ├── TournamentView.tsx # Vista de partidos del torneo
│       ├── CreateMatch.tsx    # Formulario de creación de partido
│       ├── SubTournamentSelect.tsx  # Selector de sub-torneo (Paranaense)
│       └── NacionalTournamentSelect.tsx # Selector de torneo Nacional
│
├── hooks/
│   ├── usePersistedState.ts   # ⭐ useState + localStorage automático
│   ├── useAutoSave.ts         # ⭐ Auto-save periódico a Supabase
│   ├── useNavigation.ts       # Navegación SPA sin router
│   ├── useOnlineStatus.ts     # Detección de conectividad
│   └── useSessionRecovery.ts  # Recuperación de sesión anterior
│
├── services/
│   ├── api.ts                 # ⭐ Todas las operaciones con Supabase
│   ├── realtime.ts            # ⭐ Broadcast: emisión y suscripción
│   ├── cache.ts               # Caché en memoria con TTL
│   ├── sessionStorage.ts      # Wrapper de localStorage con TTL/versión
│   ├── syncQueue.ts           # Cola offline para sincronización
│   └── demoHelper.ts          # Datos de demo
│
├── utils/
│   ├── gameLogic.ts           # ⭐ Lógica de softball (outs, corredores, grilla)
│   └── statsCalculator.ts     # Cálculo de estadísticas por partido
│
├── data/
│   └── dummy.ts               # Partido dummy para desarrollo/demo
│
└── lib/
    ├── supabase.ts            # Inicialización del cliente Supabase
    └── database.types.ts      # Tipos generados por Supabase CLI
```

---

## 4. Tipos de Datos Centrales

> **Archivo:** `src/types.ts`

### `Position`
```typescript
type Position = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'DH' | 'DP' | 'FLEX' | '';
```
Números 1–9 son posiciones defensivas estándar (1=P, 2=C, 3=1B, 4=2B, 5=3B, 6=SS, 7=LF, 8=CF, 9=RF). `DP` y `FLEX` son roles especiales del softball.

---

### `Player`
```typescript
interface Player {
    id: string;         // ID numérico como string (del DB) o generado localmente
    name: string;       // Nombre completo
    number: string;     // Número de camiseta
    position: Position; // Posición defensiva
    subType?: 'starter' | 'sub'; // Titular o sustituto
    photo?: string;     // URL del avatar (DiceBear)
}
```

---

### `PlayerEntry`
```typescript
interface PlayerEntry {
    player: Player;
    entryInning?: number;  // Entrada en que ingresó (undefined = titular)
    exitInning?: number;   // Entrada en que salió
}
```

---

### `LineupSlot`
```typescript
interface LineupSlot {
    id: string;
    players: PlayerEntry[]; // Historial: titular + sustitutos para esa posición en el orden al bate
}
```
Un `LineupSlot` representa **una posición en el orden al bate**. El array `players` tiene primero al titular y luego los sustitutos que lo reemplazaron. El **último elemento** es el jugador activo actualmente en esa posición.

---

### `Team`
```typescript
interface Team {
    id: string;        // ID del equipo (DB numérico como string)
    name: string;
    lineup: LineupSlot[];    // Orden al bate (hasta 10 slots con DP/FLEX)
    substitutes: Player[];   // Jugadores disponibles no en el orden al bate
}
```

**Regla de lineup DP/FLEX:**
- Si hay 10 slots, el slot en posición 10 (índice 9) es el **FLEX** — juega en defensa pero tiene posición fija DP en el orden al bate (índice del DP). El FLEX **no batea** por sí mismo.
- El último bateador válido es el índice 8 (9vo), no el 9 (FLEX).

---

### `PlayType`
```typescript
type PlayType =
    | '1B' | '2B' | '3B' | 'HR' | 'IPHR'   // Hits
    | 'BB' | 'IBB' | 'HP' | 'HBP'           // On base sin bate
    | 'K' | 'Ks' | 'Kc'                     // Ponches
    | 'F' | 'L' | 'G' | 'P' | 'FO'         // Outs en juego
    | 'E' | 'FC' | 'SAC' | 'SF' | 'DEC';   // Especiales
```

| Código | Descripción | ¿Cuenta AB? | ¿Cuenta Hit? | ¿Genera Out? |
|--------|-------------|:-----------:|:------------:|:------------:|
| `1B` | Sencillo | ✓ | ✓ | ✗ |
| `2B` | Doble | ✓ | ✓ | ✗ |
| `3B` | Triple | ✓ | ✓ | ✗ |
| `HR` | Home Run | ✓ | ✓ | ✗ |
| `IPHR` | HR interno | ✓ | ✓ | ✗ |
| `BB` | Base por bolas | ✗ | ✗ | ✗ |
| `IBB` | Base intencional | ✗ | ✗ | ✗ |
| `HP` / `HBP` | Hit por lanzamiento | ✗ | ✗ | ✗ |
| `K` / `Ks` / `Kc` | Ponche | ✓ | ✗ | ✓ |
| `F` / `FO` | Fly out | ✓ | ✗ | ✓ |
| `L` | Línea out | ✓ | ✗ | ✓ |
| `G` | Groundout | ✓ | ✗ | ✓ |
| `P` | Pop out | ✓ | ✗ | ✓ |
| `E` | Error | ✓ | ✗ | ✗ |
| `FC` | Campo del fildeador | ✓ | ✗ | ✗ |
| `SAC` | Bunt de sacrificio | ✗ | ✗ | ✓ |
| `SF` | Fly de sacrificio | ✗ | ✗ | ✓ |
| `DEC` | Marcador interno del sistema | ✗ | ✗ | ✗ |

---

### `Play`
```typescript
interface Play {
    id: string;                                     // UUID único
    inning: number;                                 // Entrada (1-based)
    batterId: string;                               // ID del bateador (numérico como string)
    type: PlayType;
    result: string;                                 // Descripción corta (ej: "F8", "6-3")
    secondaryResult?: string;                       // Out secundario (ej: doble play)
    rbi: number;
    out: boolean;                                   // ¿La jugada generó un out al bateador?
    bases?: [boolean, boolean, boolean, boolean];  // [1ra, 2da, 3ra, Home] del bateador
    runnerActions?: { [base: number]: string[] };  // Acciones en bases (ej: SB, WP)
    runnerAdvances?: Record<string, number>;        // play.id → base final (4=home, 0=out)
    balls?: number;                                 // Bolas al momento de la jugada
    strikes?: number;                               // Strikes al momento de la jugada
}
```

#### Marcadores internos del sistema

Las siguientes jugadas tienen `batterId` especial y **deben filtrarse** en el feed público:

| `batterId` | Significado |
|-----------|-------------|
| `"INNING_MARKER"` | Marcador de fin de entrada (no es turno al bate) |
| `"DEF_SWAP"` | Cambio defensivo sin sustitución |
| `"DEF_SUB"` | Sustitución de jugador |

---

### `Game`
```typescript
interface Game {
    id: string;
    date: string;          // YYYY-MM-DD
    visitorTeam: Team;
    homeTeam: Team;
    innings: number;       // Innings programados (usualmente 7)
    plays: Play[];         // Array plano de todas las jugadas en orden cronológico
}
```

> **Importante:** Las jugadas de ambos equipos están en un solo array `plays[]` sin separación por equipo. Para filtrar por equipo hay que hacer join con los `batterId` del lineup.

---

### `MatchDetails`
```typescript
interface MatchDetails {
    homeTeam: string;
    visitorTeam: string;
    homeTeamId?: number;
    visitorTeamId?: number;
    matchId?: number;       // ID de Supabase (null si aún no se persistió)
    date: string;
    time: string;
    field: string;
    innings?: number;
    homeLineup?: LineupSlot[];
    visitorLineup?: LineupSlot[];
    plays?: Play[];
}
```

---

## 5. Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTACIÓN (React Components)                               │
│  App.tsx → Home → TournamentView → GameView → LiveMatchView    │
├─────────────────────────────────────────────────────────────────┤
│  ESTADO / HOOKS                                                │
│  usePersistedState  useAutoSave  useNavigation  useOnlineStatus│
├─────────────────────────────────────────────────────────────────┤
│  SERVICIOS                                                     │
│  api.ts (CRUD Supabase)  │  realtime.ts (Broadcast)           │
│  cache.ts (memoria)      │  syncQueue.ts (offline queue)       │
│  sessionStorage.ts (localStorage wrapper)                      │
├─────────────────────────────────────────────────────────────────┤
│  UTILIDADES DE DOMINIO                                         │
│  gameLogic.ts (outs, corredores, columnas de grilla)          │
│  statsCalculator.ts (AVG, OBP, SLG, OPS por partido)         │
├─────────────────────────────────────────────────────────────────┤
│  INFRAESTRUCTURA                                               │
│  lib/supabase.ts  (cliente JS de Supabase)                    │
│  types.ts         (contrato de tipos del dominio)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Flujo de Datos Completo

### 6.1 Crear un partido nuevo

```
Home
 └─▶ TournamentView (lista partidos del torneo)
      └─▶ CreateMatch
           ├─ api.teams.getAll()                  → Supabase: SELECT team
           ├─ api.players.getByTeam(id, tourId)   → Supabase: JOIN player_team_tournament
           ├─ api.matches.create(...)              → Supabase: INSERT game (status='draft')
           └─▶ App.handleStartMatch(matchDetails)
                ├─ Limpia localStorage (claves softball_game_*)
                ├─ Si hay lineups, pre-seed localStorage con game_data
                └─▶ GameView (navigate 'game')
```

### 6.2 Configurar lineup in-app (LineupSetup)

```
GameView
 └─▶ [isSetupComplete = false] → LineupSetup
      ├─ Usuario configura orden al bate y posiciones
      └─▶ handleLineupConfirmed(homeLineup, visitorLineup, homeSubs, visitorSubs)
           ├─ setGame(prev => {...prev, homeTeam: {..., lineup, substitutes}})
           ├─ setIsSetupComplete(true)
           └─▶ [useEffect] triggerSave() → api.saveMatchFull.execute(...)
                                           → Supabase: UPSERT game + game_team + game_player
```

### 6.3 Registrar una jugada

```
GameView
 ├─ Usuario selecciona celda (inning + bateador) → setSelectedCell(...)
 ├─ Botones de GameplayActions: Ball / Strike / Foul
 │   ├─ Ball: currentBalls++ → si 4 → auto-BB (handleSavePlay('BB', ...))
 │   ├─ Strike: currentStrikes++ → si 3 → modal de ponche
 │   └─ Foul: abre FoulFieldModal
 └─ Abre ActionModal → usuario elige tipo de jugada
      └─▶ handleSavePlay(type, result, rbi, bases, ...)
           ├─ Construye objeto Play { id: uuid, inning, batterId, type, ... }
           ├─ setGame(prev => ({ ...prev, plays: [...prev.plays, newPlay] }))
           │   └─▶ usePersistedState → localStorage.setItem('softball_game_data', ...)
           └─▶ broadcaster.send(GameBroadcast)   ← Supabase Realtime Broadcast
                    {
                      homeTeamName, visitorTeamName,
                      homeTeamId, visitorTeamId,
                      plays: [...TODAS las jugadas],
                      innings,
                      timestamp
                    }
```

### 6.4 Auto-Save (cada 10 segundos)

```
useAutoSave (intervalo)
 ├─ ¿Hay cambios? (JSON.stringify !== lastSavedMark)
 ├─ ¿Online?
 │   ├─ Sí → api.saveMatchFull.execute(matchData, homeLineup, visitorLineup, plays)
 │   │        └─▶ Supabase: UPSERT game → DELETE+INSERT game_player, game_team,
 │   │                                     plate_appearance, play, runner_advance
 │   └─ No → syncQueue.enqueue('saveMatchFull', payload)
 │            └─ localStorage['softball_sync_queue']
 │            └─▶ Al reconectar (online event) → syncQueue.processQueue()
 └─ setLastSavedMark(dataString)
```

### 6.5 Reanudar un partido existente

```
TournamentView → "Reanudar" (matchId)
 └─▶ App.handleResumeMatch(matchId)
      ├─ api.matches.getFull(matchId)
      │   ├─ SELECT game (match info)
      │   ├─ SELECT game_player JOIN player (lineups)
      │   └─ SELECT plate_appearance JOIN play JOIN runner_advance (jugadas)
      ├─ Fallback: si DB no tiene lineup → usar localStorage cachedGame
      ├─ Fallback: si DB no tiene plays → usar localStorage localPlays
      ├─ Pre-seed localStorage con game_data (Game completo)
      └─▶ GameView (navigate 'game', resumeKey=Date.now())
```

---

## 7. Capa de Persistencia — Supabase

### 7.1 Tablas relevantes para la planilla

| Tabla | Descripción | Columnas clave |
|-------|-------------|----------------|
| `tournament` | Torneos | `tournament_id`, `name`, `season` |
| `team` | Equipos | `team_id`, `name` |
| `player` | Jugadores | `player_id`, `first_name`, `last_name` |
| `team_tournament` | Equipos en torneo | `(tournament_id, team_id)` |
| `player_team_tournament` | Roster por torneo | `(tournament_id, team_id, player_id)`, `jersey_number` |
| `game` | Partido | `game_id`, `home_team_id`, `away_team_id`, `status`, `scheduled_innings` |
| `game_team` | Equipos en partido | `(game_id, team_id)`, `is_home` |
| `game_player` | Lineup del partido | `(game_id, player_id)`, `batting_order`, `lineup_role`, `defensive_position`, `is_starter` |
| `plate_appearance` | Turno al bate | `pa_index`, `inning`, `half`, `batter_id`, `outs_start` |
| `play` | Resultado del turno | `play_type`, `rbi`, `outs_on_play`, `bases_hit` |
| `runner_advance` | Avances de corredores | `runner_id`, `from_base`, `to_base`, `run_scored` |

### 7.2 Mapeo PlayType app → DB

| App (`PlayType`) | DB (`play_type` enum) |
|-----------------|----------------------|
| `1B` | `SINGLE` |
| `2B` | `DOUBLE` |
| `3B` | `TRIPLE` |
| `HR`, `IPHR` | `HOME_RUN` |
| `BB` | `WALK` |
| `IBB` | `INTENTIONAL_WALK` |
| `HP`, `HBP` | `HIT_BY_PITCH` |
| `K`, `Ks`, `Kc` | `STRIKEOUT` |
| `F`, `FO` | `FLYOUT` |
| `L` | `LINEOUT` |
| `G` | `GROUNDOUT` |
| `P` | `POPOUT` |
| `E` | `REACH_ON_ERROR` |
| `FC` | `FIELDERS_CHOICE` |
| `SAC` | `SAC_BUNT` |
| `SF` | `SAC_FLY` |
| `DEC` | `UNKNOWN` |

**Archivo:** `src/services/api.ts` → `PLAY_TYPE_MAP`

### 7.3 Ciclo de vida del partido (`game.status`)

```
draft ──▶ in_progress ──▶ submitted ──▶ closed
  │                                        │
  │ (creado, sin lineup)    (stats disponibles en Materialized Views)
  │
  └─▶ [saveMatchFull lo marca in_progress al guardar]
```

### 7.4 `saveMatchFull` — Operación completa de guardado

La función `api.saveMatchFull.execute(matchData, homeLineup, visitorLineup, plays)` realiza en orden:

1. **Obtiene** el `tournament_id` por nombre del torneo.
2. **UPSERT** en `game` (actualiza si `matchId` existe, crea si no).
3. **DELETE** en `game_player`, `game_team`, `plate_appearance` (cascada a `play` y `runner_advance`) — para re-sincronización limpia.
4. **INSERT batch** en `game_team` (2 filas: home + away).
5. **INSERT batch** en `game_player` (todos los jugadores del lineup, titulares + suplentes).
6. **INSERT batch** en `plate_appearance` (todas las jugadas como PAs).
7. Para cada PA: **INSERT** en `play` y **INSERT** en `runner_advance` si hubo carreras.

> ⚠️ **El guardado es destructivo (DELETE + INSERT)**: cada save reinicia los datos del partido en la DB. Esto garantiza consistencia pero significa que la DB puede quedar momentáneamente sin datos entre el DELETE y el INSERT batch.

### 7.5 `getFull` — Lectura completa del partido

`api.matches.getFull(matchId)` retorna:

```typescript
{
    match: {
        id: number;
        home_team_id: number;
        visitor_team_id: number;
        home_team_name: string;
        visitor_team_name: string;
        match_date: string;         // YYYY-MM-DD
        match_time: string;         // HH:MM
        field: string | null;
        estado: string;             // game_status
        innings_programados: number;
    };
    homeLineup: LineupSlot[];
    visitorLineup: LineupSlot[];
    plays: Play[];
}
```

> Las jugadas recuperadas desde DB son **reconstruidas** con información parcial (no incluyen `runnerAdvances` detallados, solo `bases` y `out`). Son funcionales para la vista pero menos granulares que el estado en tiempo real del broadcast.

---

## 8. Estado del Cliente — localStorage

### 8.1 Claves usadas

Todas las claves tienen el prefijo `softball_`:

| Clave | Tipo | TTL | Descripción |
|-------|------|-----|-------------|
| `softball_game_data` | `Game` | 24h | Estado completo del partido activo |
| `softball_game_activeTeam` | `'home' \| 'visitor'` | 24h | Equipo activo en la grilla |
| `softball_game_isSetupComplete` | `boolean` | 24h | ¿El lineup fue confirmado? |
| `softball_game_isModalOpen` | `boolean` | 24h | Estado del modal de jugada |
| `softball_game_selectedCell` | `{ inning, batterId, batterName, playId?, pass? } \| null` | 24h | Celda seleccionada |
| `softball_game_currentBalls` | `number` | 24h | Bolas del conteo actual |
| `softball_game_currentStrikes` | `number` | 24h | Strikes del conteo actual |
| `softball_game_matchStartTime` | `number` | 24h | Timestamp de inicio |
| `softball_app_matchDetails` | `MatchDetails \| null` | 24h | Detalles del partido actual |
| `softball_app_resumeKey` | `number` | 24h | Key para remount de GameView |
| `softball_sync_queue` | `SyncOperation[]` | N/A | Cola de operaciones offline |

### 8.2 Wrapper `sessionStorageManager`

**Archivo:** `src/services/sessionStorage.ts`

```typescript
sessionStorageManager.set(key, value)    // Guarda con timestamp y versión
sessionStorageManager.get(key, default)  // Lee; retorna default si expirado/versión diferente
sessionStorageManager.remove(key)        // Elimina
sessionStorageManager.clearAllSoftballData()  // Limpia todo
sessionStorageManager.clearExpiredData() // Limpia expirados (al QuotaExceeded)
```

**Formato interno:**
```typescript
{
    value: T,
    timestamp: number,  // Unix ms
    version: 1          // CURRENT_VERSION — si difiere, el dato se descarta
}
```

### 8.3 `usePersistedState`

```typescript
const [state, setState] = usePersistedState<T>('clave', defaultValue);
```

Funciona exactamente como `useState` pero sincroniza automáticamente con `localStorage`. **Cada cambio de estado escribe a localStorage en el mismo render cycle** (via `useEffect`).

---

## 9. Tiempo Real — Broadcast Protocol

### 9.1 Canal

```
match-live-{matchId}
```

Donde `matchId` es el `game_id` numérico de Supabase.

### 9.2 Evento

```
game_update
```

### 9.3 Payload (`GameBroadcast`)

```typescript
interface GameBroadcast {
    homeTeamName: string;       // Nombre del equipo local
    visitorTeamName: string;    // Nombre del equipo visitante
    homeTeamId: string;         // ID numérico como string del equipo local
    visitorTeamId: string;      // ID numérico como string del equipo visitante
    plays: Play[];              // ⭐ ARRAY COMPLETO de jugadas (no incremental)
    innings: number;            // Innings programados
    timestamp: number;          // Unix ms
}
```

> **Crítico:** `plays[]` contiene **todas** las jugadas del partido hasta ese momento. El consumidor debe **reemplazar** su estado completo, no hacer merge.

### 9.4 Debounce

El broadcaster aplica un debounce de **150ms** antes de enviar. Esto significa que si se registran múltiples acciones muy rápido (ej: conteo de bolas), solo se emite el último estado.

### 9.5 Suscripción — Lado del espectador

```typescript
import { subscribeToMatch } from './services/realtime';

const unsubscribe = subscribeToMatch(
    matchId,
    (broadcast: GameBroadcast) => {
        // Reemplazar estado completo
        setPlays(broadcast.plays);
    },
    (connected: boolean) => {
        setIsConnected(connected); // 'SUBSCRIBED' → true
    }
);

// Al desmontar:
unsubscribe();
```

### 9.6 Emisión — Lado del planillero

```typescript
import { createMatchBroadcaster } from './services/realtime';

const broadcaster = createMatchBroadcaster(matchId);

// Al registrar una jugada:
broadcaster.send({
    homeTeamName, visitorTeamName,
    homeTeamId, visitorTeamId,
    plays: game.plays,
    innings: game.innings,
    timestamp: Date.now()
});

// Al cerrar el componente:
broadcaster.destroy();
```

### 9.7 Patrón de inicialización recomendado

```typescript
async function initLiveView(matchId: number) {
    // 1. Estado inicial desde DB (para usuarios que entran en medio del partido)
    const data = await api.matches.getFull(matchId);
    setLiveState({ ...data });

    // 2. Suscribirse para actualizaciones en tiempo real
    const unsubscribe = subscribeToMatch(matchId, (broadcast) => {
        // 3. Reemplazar estado completo
        setPlays(broadcast.plays);
    });

    return unsubscribe; // llamar en cleanup
}
```

---

## 10. API de Servicio (`src/services/api.ts`)

### 10.1 Caché en memoria

```typescript
import { apiCache, CACHE_TTL } from './cache';

// TTLs:
CACHE_TTL.TEAMS       = 5 minutos
CACHE_TTL.PLAYERS     = 5 minutos
CACHE_TTL.TOURNAMENTS = 5 minutos
CACHE_TTL.MATCHES     = 1 minuto
```

El caché se invalida automáticamente en cada operación de escritura (create, update, delete).

### 10.2 Validación de entradas

Toda entrada a la DB pasa por:
- `sanitizeText(input, maxLength)` — trim + truncado a maxLength (default 255)
- `validateId(id)` — valida que sea entero positivo; lanza error si no

### 10.3 Métodos disponibles

#### `api.teams`
| Método | Descripción | Tablas |
|--------|-------------|--------|
| `getAll()` | Lista todos los equipos | `team` |
| `getById(id)` | Equipo por ID | `team` |
| `create({ name })` | Crea equipo | `team` |

#### `api.players`
| Método | Descripción | Tablas |
|--------|-------------|--------|
| `getByTeam(teamId, tournamentId?)` | Jugadores del equipo (filtro torneo opcional) | `player_team_tournament JOIN player` |
| `create({ team_id, name, number }, tournamentId)` | Crea jugador y lo registra en el torneo | `player`, `team_tournament` (upsert), `player_team_tournament` |
| `delete(id, tournamentId?)` | Elimina del roster y opcionalmente del DB | `player_team_tournament`, `player` |
| `update(id, { name?, number? })` | Actualiza nombre o número | `player` |

#### `api.tournaments`
| Método | Descripción | Tablas |
|--------|-------------|--------|
| `getAll()` | Lista torneos | `tournament` |
| `getByName(name)` | Busca por nombre exacto | `tournament` |
| `getByCompetition(comp)` | Lista torneos (sin filtro real) | `tournament` |
| `create({ name })` | Crea torneo (año=current, cat='Primera') | `tournament` |
| `delete(id)` | Elimina torneo | `tournament` |

#### `api.matches`
| Método | Descripción | Tablas |
|--------|-------------|--------|
| `getByTournament(tournamentId)` | Partidos del torneo | `game JOIN team` |
| `create({ tournament_id, home_team_id, visitor_team_id, ... })` | Crea partido | `game` |
| `delete(id)` | Elimina partido | `game` |
| `updateStatus(id, status)` | Actualiza estado | `game` |
| `getFull(matchId)` | Estado completo del partido | `game`, `game_player`, `plate_appearance`, `play`, `runner_advance` |

#### `api.saveMatchFull`
| Método | Descripción |
|--------|-------------|
| `execute(matchData, homeLineup, visitorLineup, plays)` | Guardado completo: UPSERT game + DELETE+INSERT lineup y jugadas |

Retorna el `matchId` (numérico) del partido guardado.

---

## 11. Lógica de Juego (`src/utils/gameLogic.ts`)

### `calculateOuts(plays: Play[]): number`
Cuenta los outs en un array de jugadas. Considera `out` del bateador + `secondaryResult` (ej: doble play).

### `getRunnersOnBase(plays: Play[]): Play[]`
Retorna las jugadas activas cuyos bateadores están actualmente en base. Descuenta:
- Bateadores que anotaron (`bases[3] === true`)
- Corredores que fueron out o anotaron via `runnerAdvances`
- Fallback legacy: `secondaryResult` para outs secundarios

### `getRunnerPositions(runners: Play[], plays: Play[]): Record<string, number>`
Retorna la base actual (1/2/3/4) de cada corredor activo (identificado por `play.id`).
- 1 = primera base
- 2 = segunda base
- 3 = tercera base
- 4 = home (carrera)
- 0 = out

### `calculateTeamGridColumns(game: Game, team: Team): GridColumn[]`
Calcula las columnas de la grilla scorecard. Para cada entrada, determina cuántas "vueltas" al orden al bate hubo, y agrega columnas vacías anticipadas si la entrada sigue activa. Retorna `GridColumn[]`:
```typescript
interface GridColumn {
    id: string;      // '${inning}-${pass}'
    inning: number;
    pass: number;    // Vuelta al orden al bate (0-based)
    label: string;   // Número de entrada para mostrar
}
```

### `isInningEditable(game: Game, teamId: string, inning: number)`
Determina si una entrada es editable:
- La entrada del visitante 1 siempre es editable.
- Las demás entradas requieren que la semientrada anterior tenga 3 outs.
- Una semientrada con 3 outs ya no es editable.

---

## 12. Cálculo de Estadísticas (`src/utils/statsCalculator.ts`)

### `calculateGameStats(game: Game): PlayerGameStats[]`

Genera estadísticas por jugador del partido actual:

```typescript
interface PlayerGameStats {
    playerId: number;   // ID numérico del DB
    teamId: number;
    pa: number;         // Plate Appearances
    ab: number;         // At Bats (PA - BB - HBP - SF - SAC)
    h: number;          // Hits
    doubles: number;
    triples: number;
    hr: number;
    bb: number;         // Walks (BB + IBB)
    k: number;          // Strikeouts
    rbi: number;
    r: number;          // Carreras anotadas
    sf: number;         // Sacrifice flies
    sac: number;        // Sacrifice bunts
    hbp: number;        // Hit by pitch
    avg: number;        // H/AB
    obp: number;        // (H+BB+HBP) / (AB+BB+HBP+SF)
    slg: number;        // Total bases / AB
    ops: number;        // OBP + SLG
}
```

**Nota:** Solo incluye jugadores con ID numérico válido (descarta IDs de demo como `"b1"`, `"v1"`).

---

## 13. Auto-Save y Cola de Sincronización

### 13.1 `useAutoSave`

```typescript
const { status, triggerSave } = useAutoSave({
    data: gamePayload,   // objeto serializable
    intervalMs: 10000,   // cada 10 segundos
    enabled: boolean     // solo cuando isSetupComplete
});
```

`status`: `'saved' | 'saving' | 'offline' | 'error'`

El hook compara `JSON.stringify(data)` con el último guardado para evitar saves innecesarios.

### 13.2 `syncQueue`

Cuando no hay conexión, las operaciones se encolan en `localStorage['softball_sync_queue']`:

```typescript
interface SyncOperation {
    id: string;
    type: 'saveMatchFull';
    payload: { matchData, homeLineup, visitorLineup, plays };
    timestamp: number;
}
```

La cola solo mantiene **1 operación** de tipo `saveMatchFull` a la vez (la última reemplaza a la anterior). Al detectar `window.online`, se procesa automáticamente.

---

## 14. Navegación y Rutas

La app usa navegación SPA personalizada (sin React Router):

**Archivo:** `src/hooks/useNavigation.ts`

Rutas disponibles:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `home` | `Home` | Pantalla de inicio |
| `sub-tournament-select` | `SubTournamentSelect` | Selector de sub-torneo |
| `nacional-tournament-select` | `NacionalTournamentSelect` | Selector Nacional |
| `tournament` | `TournamentView` | Lista de partidos del torneo |
| `create-match` | `CreateMatch` | Formulario de nuevo partido |
| `game` | `GameView` | Planilla del partido activo |
| `live-match` | `LiveMatchView` | Vista espectador en tiempo real |
| `team-manager` | `TeamManager` | Gestión de equipos |

**URL directa al partido en vivo:**
```
https://[dominio]/?match={matchId}
```
Al detectar `?match=XXX`, la app navega automáticamente a `LiveMatchView`.

---

## 15. Componentes Clave

### `GameView`
**Archivo:** `src/components/game/GameView.tsx`

Orquestador central. Responsabilidades:
- Mantiene el estado `Game` en `usePersistedState`
- Gestiona la fase de configuración (`LineupSetup`)
- Maneja el conteo de bolas/strikes
- Registra jugadas via `handleSavePlay`
- Emite broadcasts via `createMatchBroadcaster`
- Dispara auto-save via `useAutoSave`

**Props:**
```typescript
{
    matchDetails: MatchDetails;
    tournamentName: string;
    onBack: () => void;
}
```

### `LiveMatchView`
**Archivo:** `src/components/game/LiveMatchView.tsx`

Vista de espectador. Responsabilidades:
- Carga estado inicial via `api.matches.getFull(matchId)`
- Se suscribe al canal de broadcast
- Muestra marcador por entradas, outs actuales, historial de jugadas recientes
- Filtra los marcadores internos (`INNING_MARKER`, `DEF_SWAP`, `DEF_SUB`)

**Props:**
```typescript
{
    matchId: number;
    onBack: () => void;
}
```

### `Scorecard`
Grilla interactiva con filas por jugador y columnas por entrada/vuelta. Cada celda puede contener una jugada registrada o estar vacía (esperando registro).

### `ActionModal`
Modal de registro de jugada. Tiene dos paneles:
- `inplay`: jugadas de bola en juego (hits, outs, errores)
- `quick`: jugadas sin bateo (BB, K, HBP, SAC, SF)

---

## 16. Reglas de Seguridad

- **Nunca** commitear `.env` con credenciales reales.
- Todo texto del usuario pasa por `sanitizeText()` antes de ir a la DB.
- Todo ID pasa por `validateId()` antes de queries.
- No usar `select *` — especificar columnas siempre.
- Claves de Supabase (anon key) van en `.env`, nunca hardcodeadas.
- Los errores de JS nunca se silencian — mínimo `console.error()`.
- Los errores se muestran al usuario en español.

---

## 17. Guía de Integración para Sistemas Externos

### Caso A: Página de resultados en tiempo real

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initLiveView(matchId: number) {
    // 1. Estado inicial (para quienes entran en medio del partido)
    const { data: game } = await supabase
        .from('game')
        .select('game_id, home_team_id, away_team_id, status, scheduled_innings')
        .eq('game_id', matchId)
        .single();

    // 2. Suscripción en tiempo real
    const channel = supabase
        .channel(`match-live-${matchId}`)
        .on('broadcast', { event: 'game_update' }, ({ payload }) => {
            // payload es GameBroadcast
            const { homeTeamName, visitorTeamName, plays, innings } = payload;
            // REEMPLAZAR estado local completo
            updateUI({ homeTeamName, visitorTeamName, plays, innings });
        })
        .subscribe();

    return () => supabase.removeChannel(channel);
}
```

### Caso B: Calcular carreras desde `plays[]`

```typescript
function getRunsForTeam(plays: Play[], playerIds: Set<string>): number {
    let runs = 0;
    plays
        .filter(p => playerIds.has(p.batterId))
        .forEach(p => {
            // 1. Bateador llegó a home directamente
            if (p.bases?.[3] === true) runs++;
            // 2. Corredores que anotaron via runnerAdvances
            if (p.runnerAdvances) {
                Object.values(p.runnerAdvances).forEach(base => {
                    if (base === 4) runs++;
                });
            }
        });
    return runs;
}
```

### Caso C: Calcular marcador por entradas

```typescript
function getRunsByInning(plays: Play[], playerIds: Set<string>, totalInnings: number): number[] {
    return Array.from({ length: totalInnings }, (_, i) => {
        const inning = i + 1;
        return plays
            .filter(p => p.inning === inning && playerIds.has(p.batterId))
            .reduce((runs, p) => {
                if (p.bases?.[3]) runs++;
                Object.values(p.runnerAdvances ?? {}).forEach(b => {
                    if (b === 4) runs++;
                });
                return runs;
            }, 0);
    });
}
```

### Caso D: Filtrar jugadas válidas para feed público

```typescript
const SYSTEM_MARKERS = new Set(['INNING_MARKER', 'DEF_SWAP', 'DEF_SUB']);

const publicPlays = plays.filter(p => !SYSTEM_MARKERS.has(p.batterId));
```

### Caso E: Obtener jugados en curso desde la DB

```sql
SELECT
    g.game_id,
    th.name AS equipo_local,
    tv.name AS equipo_visitante,
    g.scheduled_datetime,
    g.status,
    g.scheduled_innings
FROM game g
JOIN team th ON th.team_id = g.home_team_id
JOIN team tv ON tv.team_id = g.away_team_id
WHERE g.status IN ('in_progress', 'submitted')
ORDER BY g.scheduled_datetime DESC;
```

---

## 18. Diagramas de Flujo

### Flujo de una jugada (Play)

```
Usuario toca celda → selectedCell = { inning, batterId }
         │
         ▼
Usuario presiona botón (Ball / Strike / Foul / ActionModal)
         │
    ┌────┴─────────────────────────────┐
    │ Ball/Strike/Foul                 │ ActionModal
    │                                  │
    ▼                                  ▼
Count update                  Usuario elige tipo de jugada
    │                                  │
    ├─ 4 balls → BB auto               ▼
    ├─ 3 strikes → KModal        handleSavePlay(type, result, rbi, bases, ...)
    └─ Foul → FoulField                │
                                       ▼
                              Construir Play { id, inning, batterId, type, ... }
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                      │
                    ▼                                      ▼
          setGame(prev => addPlay)             broadcaster.send(GameBroadcast)
                    │                                      │
                    ▼                                      ▼
          localStorage['softball_game_data']    Supabase Broadcast
                    │                           'match-live-{id}'
                    │                                      │
               [cada 10s]                         [espectadores]
                    │                                      ▼
                    ▼                          LiveMatchView recibe payload
          api.saveMatchFull.execute()          → setLiveState (reemplaza plays)
                    │
                    ▼
          Supabase DB (plate_appearance,
                        play, runner_advance)
```

### Mapa de IDs de jugadores

```
DB (player_id: bigint)
    └──▶ app (Player.id: string) = player_id.toString()
              └──▶ Play.batterId = Player.id
                        └──▶ runnerAdvances keys = Play.id (no player_id)
```

> **Importante:** `runnerAdvances` mapea `play.id → base_final`. Las claves son IDs de jugadas, **no** de jugadores. Para identificar qué jugador es el corredor, correlacionar con `getRunnersOnBase()` que también retorna objetos `Play`.

---

*Documentación generada el 01/04/2026. Para actualizar, editar este archivo directamente.*

