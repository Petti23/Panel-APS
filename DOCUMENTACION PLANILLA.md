# Softball Statics — Integración en Tiempo Real para Web-APS

> **Destinatario:** Agente de Web-APS  
> **Propósito:** Guía completa para implementar la vista en tiempo real del partido — marcador, lineup y log de jugadas — usando el canal Supabase Broadcast emitido por la app de planilla.

---

## 1. Visión General

La app de planilla emite el estado **completo** del partido cada vez que ocurre una jugada, y también periódicamente cada 8 segundos (heartbeat). La web solo necesita:

1. Llamar a la DB para obtener el estado inicial (en caso de que el usuario entre en medio del partido).
2. Suscribirse al canal Broadcast.
3. Reemplazar su estado local con cada payload recibido.

```
Planilla (GameView)
    │
    ├─ Al anotar jugada        ──▶  Broadcast inmediato  ──▶  Web-APS
    ├─ Heartbeat cada 8s       ──▶  Broadcast periódico  ──▶  Web-APS
    └─ Al conectar canal       ──▶  Broadcast inicial    ──▶  Web-APS
                                         │
                         Supabase Realtime Channel
                         `match-live-{game_id}`
```

---

## 2. Canal Supabase Broadcast

| Parámetro | Valor |
|-----------|-------|
| Canal | `match-live-{game_id}` |
| Evento | `game_update` |
| Frecuencia | Por cada jugada + heartbeat cada 8s |
| Dirección | Solo planilla → web (unidireccional) |

`game_id` es el `bigserial` de la tabla `game` en Supabase (número entero, ej: `42`).

---

## 3. Payload — `GameBroadcast`

Cada mensaje tiene esta estructura. **Siempre contiene el estado completo**, no diferencial.

```typescript
interface GameBroadcast {
    homeTeamName: string;       // Nombre del equipo local (puede cambiar durante el partido)
    visitorTeamName: string;    // Nombre del equipo visitante
    homeTeamId: string;         // ID numérico del equipo local (string)
    visitorTeamId: string;      // ID numérico del equipo visitante (string)
    plays: Play[];              // ⭐ ARRAY COMPLETO de jugadas hasta este momento
    innings: number;            // Innings programados (usualmente 7)
    timestamp: number;          // Unix ms del momento del envío
}
```

> ⚠️ **`plays[]` es COMPLETO, no incremental.** Al recibir un evento, reemplazar el array completo. No hacer push ni merge.

---

## 4. Estructura de cada jugada (`Play`)

```typescript
interface Play {
    id: string;            // ID único de la jugada (UUID o random string)
    inning: number;        // Número de entrada (1-based, ej: 1, 2, 3...)
    batterId: string;      // ID del jugador al bate (string numérico del DB)
    type: PlayType;        // Código de jugada (ver tabla abajo)
    result: string;        // Descripción corta (ej: "HR", "F8", "6-3")
    secondaryResult?: string;   // Out secundario (ej: doble play)
    rbi: number;                // Carreras impulsadas
    out: boolean;               // ¿La jugada generó un out al bateador?
    bases?: [boolean, boolean, boolean, boolean]; // [1ra, 2da, 3ra, Home]
    runnerActions?: { [base: number]: string[] }; // acciones en bases (SB, WP, etc.)
    runnerAdvances?: Record<string, number>;       // play.id → base final (4=home, 0=out)
    balls?: number;    // Bolas del conteo
    strikes?: number;  // Strikes del conteo
}
```

### Tabla de `PlayType`

| Código | Significado | ¿Es out? | ¿Es hit? |
|--------|-------------|:--------:|:--------:|
| `1B` | Sencillo | ✗ | ✓ |
| `2B` | Doble | ✗ | ✓ |
| `3B` | Triple | ✗ | ✓ |
| `HR` | Home Run | ✗ | ✓ |
| `IPHR` | Home Run interno | ✗ | ✓ |
| `BB` | Base por bolas | ✗ | ✗ |
| `IBB` | Base intencional | ✗ | ✗ |
| `HP` / `HBP` | Hit por lanzamiento | ✗ | ✗ |
| `K` / `Ks` / `Kc` | Ponche | ✓ | ✗ |
| `F` / `FO` | Fly out | ✓ | ✗ |
| `L` | Línea out | ✓ | ✗ |
| `G` | Groundout / Rolling | ✓ | ✗ |
| `P` | Pop out | ✓ | ✗ |
| `E` | Error | ✗ | ✗ |
| `FC` | Campo del fildeador | ✗ | ✗ |
| `SAC` | Bunt de sacrificio | ✓ | ✗ |
| `SF` | Fly de sacrificio | ✓ | ✗ |
| `DEC` | Marcador interno del sistema | — | — |

### Jugadas del sistema — filtrar en el feed público

Estas jugadas **no son turnos al bate reales**. Deben filtrarse antes de mostrarlas:

| `batterId` | `type` | Significado |
|-----------|--------|-------------|
| `"INNING_MARKER"` | `DEC` | Inicio de nueva entrada |
| `"DEF_SWAP"` | `DEC` | Cambio de posición defensiva |
| `"DEF_SUB"` | `DEC` | Sustitución de jugador |

```typescript
const SYSTEM_IDS = new Set(['INNING_MARKER', 'DEF_SWAP', 'DEF_SUB']);
const realPlays = plays.filter(p => !SYSTEM_IDS.has(p.batterId));
```

El campo `result` de estas jugadas tiene texto descriptivo legible (ej: `"INICIO INNING 3"`, `"SUSTITUCIÓN: Entra García por López (SS)"`). Se puede mostrar en un log secundario si se desea.

---

## 5. Cómo suscribirse — Código listo para usar

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface GameBroadcast {
    homeTeamName: string;
    visitorTeamName: string;
    homeTeamId: string;
    visitorTeamId: string;
    plays: Play[];
    innings: number;
    timestamp: number;
}

function subscribeToMatch(
    matchId: number,
    onUpdate: (data: GameBroadcast) => void,
    onConnectionChange?: (connected: boolean) => void
) {
    const channel = supabase
        .channel(`match-live-${matchId}`, { config: { broadcast: { ack: false } } })
        .on('broadcast', { event: 'game_update' }, ({ payload }) => {
            onUpdate(payload as GameBroadcast);
        })
        .subscribe((status) => {
            onConnectionChange?.(status === 'SUBSCRIBED');
        });

    return () => supabase.removeChannel(channel);
}
```

---

## 6. Patrón de inicialización recomendado

```typescript
async function initLiveView(matchId: number) {
    // 1. Obtener estado inicial desde DB (para usuarios que entran en medio del partido)
    //    Esto devuelve el último estado guardado (hasta 10s de retraso respecto al broadcast)
    const initialData = await fetchMatchFromDB(matchId);
    setGameState(initialData);

    // 2. Suscribirse al canal en tiempo real
    //    La planilla enviará el estado completo al conectarse (onReady del broadcaster)
    const unsubscribe = subscribeToMatch(
        matchId,
        (broadcast) => {
            // SIEMPRE reemplazar el estado completo, nunca hacer merge
            setGameState({
                homeTeamName: broadcast.homeTeamName,
                visitorTeamName: broadcast.visitorTeamName,
                plays: broadcast.plays,    // reemplazar todo
                innings: broadcast.innings,
                lastUpdate: new Date(broadcast.timestamp),
            });
        },
        (connected) => setIsConnected(connected)
    );

    return unsubscribe; // llamar en cleanup / unmount
}
```

> 💡 **Nota importante:** La planilla hace `send()` del estado completo automáticamente al conectar su canal WebSocket. Si la web se conecta mientras hay un partido en curso, recibirá el estado actual en los primeros segundos sin necesidad de polling adicional. El heartbeat de 8s garantiza que en el peor caso el retraso sea ≤ 8 segundos.

---

## 7. Calcular el marcador desde `plays[]`

El broadcast **no incluye el score precalculado**. La web debe calcularlo desde `plays[]`.

### Identificar qué jugador pertenece a qué equipo

El broadcast incluye `homeTeamId` y `visitorTeamId`. Los lineups se obtienen desde la DB (`game_player` join `player`). La planillera también los tiene en el broadcast indirectamente a través del `batterId` — correlacionando con los IDs de los jugadores del lineup.

### Calcular carreras de un equipo

```typescript
function getRunsForTeam(plays: Play[], playerIds: Set<string>): number {
    let runs = 0;
    plays
        .filter(p => playerIds.has(p.batterId))
        .forEach(p => {
            // 1. Bateador llegó a home directamente (HR, o bases[3] = true)
            if (p.bases?.[3] === true) runs++;

            // 2. Corredores que anotaron via runnerAdvances (base === 4 significa home)
            if (p.runnerAdvances) {
                Object.values(p.runnerAdvances).forEach(base => {
                    if (base === 4) runs++;
                });
            }
        });
    return runs;
}
```

### Calcular carreras por entrada (para el tablero)

```typescript
function getRunsByInning(
    plays: Play[],
    playerIds: Set<string>,
    totalInnings: number
): number[] {
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

### Calcular outs de una entrada

```typescript
function getOutsForInning(plays: Play[], inning: number, playerIds: Set<string>): number {
    return plays
        .filter(p => p.inning === inning && playerIds.has(p.batterId))
        .reduce((outs, p) => {
            if (p.out) outs++;
            if (p.secondaryResult) outs++; // doble play
            return outs;
        }, 0);
}
```

---

## 8. Construir el log de jugadas

```typescript
interface PlayLogEntry {
    inning: number;
    team: 'home' | 'visitor';
    playerName: string;
    type: string;       // código de jugada
    label: string;      // texto legible en español
    rbi: number;
    isSystemEvent: boolean;
    description: string; // para eventos de sistema (DEF_SWAP, DEF_SUB)
}

const PLAY_LABELS: Record<string, string> = {
    '1B': 'Sencillo', '2B': 'Doble', '3B': 'Triple',
    'HR': 'Home Run', 'IPHR': 'Home Run',
    'BB': 'Base por Bolas', 'IBB': 'Base Intencional',
    'HP': 'Hit por Lanzamiento', 'HBP': 'Hit por Lanzamiento',
    'K': 'Ponche', 'Ks': 'Ponche', 'Kc': 'Ponche Cantado',
    'F': 'Fly Out', 'FO': 'Fly Out', 'L': 'Línea Out',
    'G': 'Rolling', 'P': 'Pop Up',
    'E': 'Error', 'FC': 'Campo del Fildeador',
    'SAC': 'Sacrificio', 'SF': 'Fly Sacrificio',
    'DEC': '',
};

const SYSTEM_IDS = new Set(['INNING_MARKER', 'DEF_SWAP', 'DEF_SUB']);

function buildPlayLog(
    plays: Play[],
    homePlayerIds: Set<string>,
    getPlayerName: (id: string) => string
): PlayLogEntry[] {
    return plays.map(p => {
        const isSystem = SYSTEM_IDS.has(p.batterId);
        return {
            inning: p.inning,
            team: homePlayerIds.has(p.batterId) ? 'home' : 'visitor',
            playerName: isSystem ? '' : getPlayerName(p.batterId),
            type: p.type,
            label: PLAY_LABELS[p.type] ?? p.type,
            rbi: p.rbi,
            isSystemEvent: isSystem,
            description: isSystem ? p.result : '',
        };
    });
}
```

---

## 9. Acceso al lineup desde la DB

El broadcast **no incluye el lineup** directamente. Para mostrar los nombres de los jugadores hay que obtenerlo desde Supabase una vez al cargar la vista:

```sql
SELECT
    gp.team_id,
    gp.batting_order,
    gp.defensive_position,
    gp.is_starter,
    p.player_id,
    p.first_name || ' ' || p.last_name AS full_name
FROM game_player gp
JOIN player p ON p.player_id = gp.player_id
WHERE gp.game_id = {matchId}
ORDER BY gp.team_id, gp.batting_order;
```

Con este resultado se puede construir un mapa `player_id → nombre` para resolver los `batterId` del broadcast.

---

## 10. Acceso a datos del partido desde la DB

```sql
-- Info del partido
SELECT
    g.game_id,
    g.status,
    g.scheduled_innings,
    g.scheduled_datetime,
    g.field,
    th.name AS home_team,
    tv.name AS visitor_team
FROM game g
JOIN team th ON th.team_id = g.home_team_id
JOIN team tv ON tv.team_id = g.away_team_id
WHERE g.game_id = {matchId};
```

### Estados del partido (`status`)

| Valor | Significado |
|-------|-------------|
| `draft` | Creado, lineup no confirmado aún |
| `in_progress` | Partido en curso |
| `submitted` | En revisión |
| `closed` | Cerrado (stats disponibles) |

### Marcador desde la DB (`game_team`)

La tabla `game_team` tiene los campos `runs` y `hits` actualizados en cada auto-save (cada 10 segundos). Si la web necesita el marcador sin usar el broadcast, puede consultarlos directamente:

```sql
SELECT
    gt.team_id,
    gt.is_home,
    gt.runs,
    gt.hits,
    gt.errors,
    t.name AS team_name
FROM game_team gt
JOIN team t ON t.team_id = gt.team_id
WHERE gt.game_id = {matchId};
```

> ⚠️ Estos valores tienen hasta 10s de retraso respecto al broadcast. Para tiempo real, siempre usar el canal Broadcast y calcular el score desde `plays[]`.

### Carreras detalladas por jugada (`play` + `runner_advance`)

```sql
-- Jugadas con carreras anotadas
SELECT
    pa.inning,
    pa.half,
    p.play_type,
    p.runs_on_play,
    p.rbi
FROM play p
JOIN plate_appearance pa ON pa.plate_appearance_id = p.pa_id
WHERE pa.game_id = {matchId}
  AND p.runs_on_play > 0
ORDER BY pa.pa_index;

-- Corredores que anotaron
SELECT
    ra.runner_id,
    pl.first_name || ' ' || pl.last_name AS runner_name,
    ra.run_scored,
    ra.is_rbi_credit,
    ra.reason
FROM runner_advance ra
JOIN player pl ON pl.player_id = ra.runner_id
JOIN plate_appearance pa ON pa.plate_appearance_id = ra.pa_id
WHERE pa.game_id = {matchId}
  AND ra.run_scored = true
ORDER BY pa.pa_index;
```

---

## 11. URL directa a la vista en vivo

La app de planilla usa React Router. La URL de espectador es:

```
https://[dominio-planilla]/live/{matchId}
```

Al abrir esta ruta, la app monta directamente `LiveMatchView` con el partido indicado. Útil para compartir en redes sociales o incrustar en la web.

### Estructura de rutas de la planilla

| Ruta | Pantalla |
|------|----------|
| `/` | Selección de torneo |
| `/paranaense` | Sub-torneos paranaenses |
| `/nacional` | Sub-torneos nacionales |
| `/torneo/:name` | Lista de partidos del torneo |
| `/torneo/:name/nuevo-partido` | Crear partido + confirmar lineup |
| `/torneo/:name/partido/:matchId` | Planilla activa (GameView) |
| `/torneo/:name/equipos` | Gestión de equipos |
| `/live/:matchId` | Vista espectador (LiveMatchView) |

---

## 12. Diagrama de timing

```
Espectador abre la web
        │
        ├─▶ fetchMatchFromDB()          ← Estado de DB (puede tener hasta 10s de retraso)
        │         │
        │         └─▶ setGameState(dbData)   ← Estado inicial mostrado
        │
        ├─▶ subscribeToMatch()          ← Conecta WebSocket a Supabase
        │         │
        │         └─▶ [~1-2s] SUBSCRIBED
        │                    │
        │                    └─▶ Planilla detecta nuevo suscriptor y envía estado completo
        │                                │
        │                                └─▶ onUpdate(broadcast) → setGameState(broadcast)
        │
        └─▶ [heartbeat] cada 8s planilla envía estado completo
                    │
                    └─▶ Web siempre actualizada con ≤ 8s de latencia máxima
```

### Persistencia en DB (auto-save)

La planilla guarda el estado completo en Supabase cada **10 segundos** (o inmediatamente al confirmar el lineup). El save actualiza:

| Tabla | Qué se guarda |
|-------|--------------|
| `game` | Estado general (`in_progress`), fecha, innings |
| `game_team` | `runs`, `hits` calculados del estado actual |
| `game_player` | Lineup completo con `batting_order`, `defensive_position`, `is_starter` |
| `plate_appearance` | Un registro por turno al bate |
| `play` | Resultado del turno: `play_type`, `rbi`, `runs_on_play` |
| `runner_advance` | Un registro por cada corredor que se movió (incluyendo quien anotó) |

El patrón es **DELETE + INSERT** completo en cada save — los datos siempre son el estado actual, no acumulativo.

---

## 13. Checklist de implementación

- [ ] Instalar `@supabase/supabase-js`
- [ ] Configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en variables de entorno
- [ ] Al montar la vista: llamar `fetchMatchFromDB(matchId)` para estado inicial
- [ ] Suscribirse con `subscribeToMatch(matchId, onUpdate)`
- [ ] Al recibir broadcast: **reemplazar** `plays[]` completo (no push)
- [ ] Calcular score, outs y log desde `plays[]` localmente
- [ ] Filtrar `batterId` en `['INNING_MARKER', 'DEF_SWAP', 'DEF_SUB']` para el feed público
- [ ] Limpiar suscripción con `unsubscribe()` al desmontar el componente

---

*Última actualización: 01/04/2026 — Versión post-fix heartbeat + onReady broadcaster*

