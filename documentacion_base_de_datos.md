# Documentación Base de Datos — Softball Statics

## Descripción General

Modelo de datos **event-centric** para estadísticas de softbol. Registra eventos completos de partidos: cada pitch, cada aparición al bate, cada corrido de bases. Las estadísticas se derivan mediante **VIEWS** y **MATERIALIZED VIEWS**.

**Archivo fuente:** `schema_english.sql` (nomenclatura en inglés)

---

## 1. ENUMS (Tipos de Dato)

| Enum | Valores |
|------|---------|
| `game_status` | `draft`, `in_progress`, `submitted`, `closed` |
| `half_inning` | `T` (Top), `B` (Bottom) |
| `bat_hand` | `R` (Right), `L` (Left), `S` (Switch) |
| `throw_hand` | `R`, `L` |
| `lineup_role` | `NORMAL`, `DP`, `FLEX`, `AP` |
| `field_position` | `P`, `C`, `1B`, `2B`, `3B`, `SS`, `LF`, `CF`, `RF`, `OF`, `EH` |
| `pitch_result` | `BALL`, `CALLED_STRIKE`, `SWINGING_STRIKE`, `FOUL`, `IN_PLAY`, `HITBY_PITCH` |
| `batted_ball_type` | `GB` (Ground ball), `FB` (Fly ball), `LD` (Line drive), `PU` (Pop up), `BUNT`, `UNK` (Unknown) |
| `pa_result_type` | `WALK`, `INTENTIONAL_WALK`, `HIT_BY_PITCH`, `STRIKEOUT`, `IN_PLAY` |
| `play_type` | `SINGLE`, `DOUBLE`, `TRIPLE`, `HOME_RUN`, `REACH_ON_ERROR`, `FIELDERS_CHOICE`, `REACH_ON_INTERFERENCE`, `GROUNDOUT`, `FLYOUT`, `LINEOUT`, `POPOUT`, `BUNT_OUT`, `WALK`, `INTENTIONAL_WALK`, `HIT_BY_PITCH`, `STRIKEOUT`, `SAC_FLY`, `SAC_BUNT`, `UNKNOWN` |
| `advance_reason` | `HIT`, `WALK`, `HIT_BY_PITCH`, `ERROR`, `FIELDERS_CHOICE`, `SAC_FLY`, `SAC_BUNT`, `STOLEN_BASE`, `CAUGHT_STEALING`, `WILD_PITCH`, `PASSED_BALL`, `BALK`, `PICKOFF`, `OTHER` |
| `out_type` | `FORCE_OUT`, `TAG_OUT`, `STRIKEOUT`, `FLYOUT`, `LINEOUT`, `PUTOUT`, `PICKOFF`, `CAUGHT_STEALING`, `INTERFERENCE`, `OTHER` |
| `fielding_role` | `ASSIST`, `PUTOUT`, `ERROR`, `FIELD` |

---

## 2. Tablas Base

### 2.1 tournament

Torneos o competencias.

| Columna | Tipo | Notas |
|---------|------|-------|
| `tournament_id` | bigserial | PK |
| `name` | text | NOT NULL |
| `season` | int | NOT NULL |
| `category` | text | Categoría (ej: sub-18, absolute) |
| `start_date` | date | Fecha de inicio |
| `end_date` | date | Fecha de fin |
| `regulations_url` | text | Link al reglamento |
| `created_at` | timestamptz | DEFAULT now() |

**Unique:** `(name, season, category)`

---

### 2.2 team

Equipos/clubes.

| Columna | Tipo | Notas |
|---------|------|-------|
| `team_id` | bigserial | PK |
| `name` | text | NOT NULL |
| `club` | text | Nombre del club |
| `city` | text | Ciudad |
| `abbreviation` | text | Sigla (ej: "RIVER") |
| `created_at` | timestamptz | DEFAULT now() |

**Unique:** `(name, club)`

---

### 2.3 player

Jugadores.

| Columna | Tipo | Notas |
|---------|------|-------|
| `player_id` | bigserial | PK |
| `first_name` | text | NOT NULL |
| `last_name` | text | NOT NULL |
| `national_id` | text | DNI o identificador nacional |
| `birth_date` | date | Fecha de nacimiento |
| `bat_hand` | bat_hand | DEFAULT 'R' |
| `throw_hand` | throw_hand | DEFAULT 'R' |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.4 team_tournament

Inscripción de equipos en torneos.

| Columna | Tipo | Notas |
|---------|------|-------|
| `tournament_id` | bigint | FK → tournament(tournament_id), ON DELETE CASCADE |
| `team_id` | bigint | FK → team(team_id), ON DELETE RESTRICT |
| `zone` | text | Zona o grupo |
| `seed` | int | Cabeza de serie |
| `created_at` | timestamptz | DEFAULT now() |

**PK:** `(tournament_id, team_id)`

---

### 2.5 player_team_tournament

Roster de jugadores por equipo por torneo.

| Columna | Tipo | Notas |
|---------|------|-------|
| `tournament_id` | bigint | PK, FK → team_tournament |
| `team_id` | bigint | PK, FK → team_tournament |
| `player_id` | bigint | FK → player(player_id), ON DELETE RESTRICT |
| `jersey_number` | int | Número de camiseta |
| `primary_position` | field_position | Posición primaria |
| `active` | boolean | DEFAULT true — si false, no puede jugar |
| `created_at` | timestamptz | DEFAULT now() |

**PK:** `(tournament_id, team_id, player_id)`

---

## 3. Tablas de Juegos

### 3.1 game

Partidos.

| Columna | Tipo | Notas |
|---------|------|-------|
| `game_id` | bigserial | PK |
| `tournament_id` | bigint | FK → tournament(tournament_id), ON DELETE RESTRICT |
| `scheduled_datetime` | timestamptz | Fecha y hora programada |
| `venue` | text | Sede |
| `field` | text | Cancha |
| `home_team_id` | bigint | FK → team(team_id), ON DELETE RESTRICT |
| `away_team_id` | bigint | FK → team(team_id), ON DELETE RESTRICT |
| `status` | game_status | DEFAULT 'draft' |
| `scheduled_innings` | int | DEFAULT 7 |
| `mercy_rule` | boolean | DEFAULT false |
| `created_at` | timestamptz | DEFAULT now() |

**CHECK:** `home_team_id <> away_team_id`

**Indices:**
- `idx_game_tournament_date` ON `(tournament_id, scheduled_datetime)`
- `idx_game_tournament` ON `(tournament_id)`
- `idx_game_home_team` ON `(home_team_id)`
- `idx_game_away_team` ON `(away_team_id)`
- `idx_game_status` ON `(status)`

---

### 3.2 game_team

Totales por equipo por partido (cache).

| Columna | Tipo | Notas |
|---------|------|-------|
| `game_id` | bigint | FK → game(game_id), ON DELETE CASCADE, PK |
| `team_id` | bigint | FK → team(team_id), ON DELETE RESTRICT, PK |
| `is_home` | boolean | DEFAULT false |
| `runs` | int | DEFAULT 0 |
| `hits` | int | DEFAULT 0 |
| `errors` | int | DEFAULT 0 |
| `lob` | int | DEFAULT 0 (Left On Base) |
| `created_at` | timestamptz | DEFAULT now() |

**Índice:** `idx_game_team_team` ON `(team_id)`

---

### 3.3 game_player

Lineup de jugadores por partido.

| Columna | Tipo | Notas |
|---------|------|-------|
| `game_id` | bigint | FK → game(game_id), PK |
| `team_id` | bigint | FK → team(team_id), PK |
| `player_id` | bigint | FK → player(player_id), PK |
| `batting_order` | int | Orden de bateo 1..12 |
| `lineup_role` | lineup_role | DEFAULT 'NORMAL' — DP/FLEX/AP |
| `defensive_position` | field_position | Posición defensiva actual |
| `is_starter` | boolean | DEFAULT true |
| `inning_in` | int | Inning donde entra (null si desde el inicio) |
| `inning_out` | int | Inning donde sale (null si terminó el partido) |
| `created_at` | timestamptz | DEFAULT now() |

**Validación:** Trigger `trg_check_game_player_roster` asegura que el jugador pertenezca al roster activo del equipo en el torneo.

**Índices:**
- `idx_game_player_batting_order` ON `(game_id, team_id, batting_order)`
- `idx_game_player_player` ON `(player_id)`
- `idx_game_player_team` ON `(team_id)`

---

## 4. Tablas de Eventos (Por Aparición al Bate)

### 4.1 plate_appearance

Una aparición al bate (PA) completa.

| Columna | Tipo | Notas |
|---------|------|-------|
| `plate_appearance_id` | bigserial | PK |
| `game_id` | bigint | FK → game(game_id), ON DELETE CASCADE |
| `inning` | int | CHECK >= 1 |
| `half` | half_inning | 'T' (Top) o 'B' (Bottom) |
| `pa_index` | int | Orden absoluto dentro del partido (1..n) |
| `outs_start` | int |CHECK 0..2 — outs al inicio de la PA |
| `batting_team_id` | bigint | FK → team(team_id) |
| `fielding_team_id` | bigint | FK → team(team_id) |
| `batter_id` | bigint | FK → player(player_id) |
| `pitcher_id` | bigint | FK → player(player_id) |
| `catcher_id` | bigint | FK → player(player_id) |
| `pa_result` | pa_result_type | DEFAULT 'IN_PLAY' |
| `created_at` | timestamptz | DEFAULT now() |

**CHECK:** `batting_team_id <> fielding_team_id`

**Unique:** `(game_id, pa_index)`

**Índices:**
- `idx_pa_game_inning` ON `(game_id, inning, half, pa_index)`
- `idx_pa_batter` ON `(batter_id)`
- `idx_pa_pitcher` ON `(pitcher_id)`
- `idx_pa_game_batter` ON `(game_id, batter_id)`
- `idx_pa_batting_team` ON `(batting_team_id)`
- `idx_pa_fielding_team` ON `(fielding_team_id)`
- `idx_pa_catcher` ON `(catcher_id)` — WHERE `catcher_id IS NOT NULL`

---

### 4.2 pitch

Cada pitcheo individual dentro de una PA.

| Columna | Tipo | Notas |
|---------|------|-------|
| `pitch_id` | bigserial | PK |
| `pa_id` | bigint | FK → plate_appearance(plate_appearance_id), ON DELETE CASCADE |
| `pitch_index` | int | Orden dentro de la PA (1..n) |
| `result` | pitch_result | NOT NULL |
| `speed_kmh` | numeric(5,2) | Velocidad en km/h |
| `zone` | int | CHECK 1..14 — zona de strike |
| `pitch_type` | text | FB/CH/CU/SL/etc |
| `created_at` | timestamptz | DEFAULT now() |

**Unique:** `(pa_id, pitch_index)`

**Índices:**
- `idx_pitch_pa` ON `(pa_id)`
- `idx_pitch_pa_index` ON `(pa_id, pitch_index)`

---

### 4.3 play

Resultado de la PA; relación 1:1 con plate_appearance.

| Columna | Tipo | Notas |
|---------|------|-------|
| `play_id` | bigserial | PK |
| `pa_id` | bigint | FK → plate_appearance, UNIQUE, ON DELETE CASCADE |
| `play_type` | play_type | DEFAULT 'UNKNOWN' |
| `batted_ball` | batted_ball_type | DEFAULT 'UNK' — tipo de kontakto |
| `counts_ab` | boolean | DEFAULT false — cuenta como turno al bate |
| `counts_hit` | boolean | DEFAULT false — cuenta como hit |
| `bases_hit` | int | DEFAULT 0, CHECK 0..4 — bases del hit |
| `rbi` | int | DEFAULT 0, CHECK >= 0 |
| `runs_on_play` | int | DEFAULT 0, CHECK >= 0 — carreras producidas en la jugada |
| `error_flag` | boolean | DEFAULT false |
| `error_position` | field_position | Posición delfielder que cometió error |
| `double_play` | boolean | DEFAULT false |
| `triple_play` | boolean | DEFAULT false |
| `outs_on_play` | int | DEFAULT 0, CHECK 0..3 — outs generados |
| `description` | text | Descripción textual de la jugada |
| `created_at` | timestamptz | DEFAULT now() |

**Índices:**
- `idx_play_type` ON `(play_type)`
- `idx_play_pa` ON `(pa_id)`

---

### 4.4 fielding_play_participant

Fielders involucrados en un play.

| Columna | Tipo | Notas |
|---------|------|-------|
| `play_id` | bigint | FK → play(play_id), ON DELETE CASCADE, PK |
| `fielder_id` | bigint | FK → player(player_id), ON DELETE RESTRICT, PK |
| `role` | fielding_role | PK — ASSIST/PUTOUT/ERROR/FIELD |
| `position` | field_position | Posición donde estaba el fielder |
| `created_at` | timestamptz | DEFAULT now() |

**Índices:**
- `idx_fielding_play` ON `(play_id)`
- `idx_fielding_fielder` ON `(fielder_id)`

---

### 4.5 runner_advance

Movimientos de corredores durante una PA.

| Columna | Tipo | Notas |
|---------|------|-------|
| `advance_id` | bigserial | PK |
| `pa_id` | bigint | FK → plate_appearance(plate_appearance_id), ON DELETE CASCADE |
| `runner_id` | bigint | FK → player(player_id), ON DELETE RESTRICT |
| `start_base` | int | CHECK IN (0,1,2,3) — 0=bateador |
| `end_base` | int | CHECK IN (-1,1,2,3,4) — -1=out, 4=home |
| `reason` | advance_reason | Motivo del avance |
| `run_scored` | boolean | DEFAULT false — crosó home |
| `is_rbi_credit` | boolean | DEFAULT false — crédito de RBI |
| `out_flag` | boolean | DEFAULT false |
| `out_type` | out_type | Tipo de out si aplica |
| `created_at` | timestamptz | DEFAULT now() |

**CHECK:** `(end_base = -1 AND out_flag = true) OR (end_base <> -1)`

**Índices:**
- `idx_runner_advance_pa` ON `(pa_id)`
- `idx_runner_advance_runner` ON `(runner_id)`

---

## 5. Funciones y Triggers

### 5.1 fn_check_game_player_roster

```sql
RETURNS trigger AS $$
-- Verifica que el jugador esté en player_team_tournament
-- con active = true para el torneo del partido
$$ LANGUAGE plpgsql;
```

**Trigger:** `trg_check_game_player_roster` — BEFORE INSERT OR UPDATE en `game_player`

---

### 5.2 fn_refresh_stats_for_game

Refresca todas las materialized views para un partido.

```sql
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_batting_stats_player_game;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_batting_stats_player_tournament;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fielding_stats_player_game;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pitching_stats_player_game;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pitching_stats_player_tournament;
END;
$$ LANGUAGE plpgsql;
```

---

### 5.3 fn_on_game_close_refresh

Dispara el refresh cuando el partido pasa a `closed`.

```sql
RETURNS trigger AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'closed') THEN
    PERFORM fn_refresh_stats_for_game(NEW.game_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:** `trg_game_close_refresh` — AFTER UPDATE OF `status` en `game`

---

## 6. Vistas de Estadísticas

### 6.1 v_play_flags

Vista auxiliar con flags booleanos por play:
- `is_sac_fly`, `is_sac_bunt`, `is_walk`, `is_intentional_walk`, `is_hbp`, `is_strikeout`, `is_hit`, `is_home_run`

---

### 6.2 v_batting_stats_player_game

Estadísticas de bateo por jugador por partido.

| Campo | Descripción |
|-------|-------------|
| `game_id` | |
| `player_id` | |
| `pa` | Apariciones al plato |
| `ab` | Turnos al bate |
| `h` | Hits totales |
| `singles` | Simples (1B) |
| `doubles` | Dobles (2B) |
| `triples` | Triples (3B) |
| `home_runs` | Cuadrangulares (HR) |
| `walks` | Boletos (BB) |
| `hit_by_pitch` | Golpeado (HBP) |
| `strikeouts` | Ponches (SO) |
| `rbi` | Carreras impulsadas |
| `sac_flies` | Fly de sacrificio |
| `sac_bunts` | Bunt de sacrificio |
| `total_bases` | Bases totales (TB) |
| `runs_scored` | Carreras anotadas (R) |
| `stolen_bases` | Bases robadas (SB) |
| `caught_stealing` | Atrapado robando (CS) |
| `avg` | Promedio de bateo (AVG) |
| `obp` | Porcentaje de embasado (OBP) |
| `slg` | Slugging (SLG) |
| `ops` | OBP + SLG |

---

### 6.3 v_batting_stats_player_tournament

Agregación de `v_batting_stats_player_game` por torneo.

Mismos campos, agregados por `tournament_id, player_id`.

---

### 6.4 v_fielding_stats_player_game

Estadísticas de fildeo por jugador por partido.

| Campo | Descripción |
|-------|-------------|
| `game_id` | |
| `player_id` | |
| `putouts` | Out asistidos (PO) |
| `assists` | Asistencias (A) |
| `errors` | Errores (E) |

---

### 6.5 v_pitching_stats_player_game

Estadísticas de pitcheo por jugador por partido.

| Campo | Descripción |
|-------|-------------|
| `game_id` | |
| `player_id` | |
| `outs_recorded` | Outs registrados |
| `innings_pitched` | Innings lanzados (IP) |
| `hits_allowed` | Hits permitidos (H) |
| `walks_issued` | Boletos emitidos (BB) |
| `batters_hit` | Bateadores golpeados (HBP) |
| `strikeouts` | Ponches (SO) |
| `home_runs_allowed` | Cuadrangulares permitidos (HR) |
| `runs_allowed` | Carreras permitidas (R) |

---

### 6.6 v_pitching_stats_player_tournament

Agregación de `v_pitching_stats_player_game` por torneo.

---

## 7. Materialized Views

Para performance en frontend, las vistas se materializan y se refrescan al cerrar el partido.

| Materialized View | Unique Index | Fuente |
|-------------------|--------------|--------|
| `mv_batting_stats_player_game` | `(game_id, player_id)` | `v_batting_stats_player_game` |
| `mv_batting_stats_player_tournament` | `(tournament_id, player_id)` | `v_batting_stats_player_tournament` |
| `mv_fielding_stats_player_game` | `(game_id, player_id)` | `v_fielding_stats_player_game` |
| `mv_pitching_stats_player_game` | `(game_id, player_id)` | `v_pitching_stats_player_game` |
| `mv_pitching_stats_player_tournament` | `(tournament_id, player_id)` | `v_pitching_stats_player_tournament` |

---

## 8. Seguridad (RLS)

Todas las tablas tienen **Row Level Security** habilitada.

### Tablas con políticas públicas:

```
tournament, team, player,
team_tournament, player_team_tournament,
game, game_team, game_player,
plate_appearance, pitch, play,
fielding_play_participant, runner_advance
```

### Roles con acceso:

- `anon` — acceso sin autenticación
- `authenticated` — acceso autenticado

### Permisos:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON <todas_las_tablas> TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
```

---

## 9. Diagrama de Relaciones

```
tournament
    │
    └── team_tournament (tournament_id, team_id)
              │
              └── player_team_tournament (tournament_id, team_id, player_id)
                        │
    team ───────────────┘
    │
    └── game (tournament_id, home_team_id, away_team_id)
              │
              ├── game_team (game_id, team_id)
              │         │
              │         └── game_player (game_id, team_id, player_id)
              │
              └── plate_appearance (game_id, batting_team_id, fielding_team_id, batter_id, pitcher_id, catcher_id)
                        │
                        ├── pitch (pa_id)
                        │
                        ├── play (pa_id)
                        │         │
                        │         └── fielding_play_participant (play_id, fielder_id)
                        │
                        └── runner_advance (pa_id, runner_id)
```

---

## 10. Notas de Implementación

- Los IDs son `bigserial` (64-bit) para evitar overflow.
- Todas las tablas tienen `created_at` con `DEFAULT now()`.
- Los enum se crean con `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` para ser idempotentes.
- Las stats son **derivadas**, no se almacenan en las tablas de eventos.
- El refresh de materialized views es automático al cerrar el partido (`status = 'closed'`).
- El modelo soporta DP/FLEX/AP y cambios de jugadores (inning_in/ inning_out).