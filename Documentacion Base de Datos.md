# Database Documentation — Softball Statics

> PostgreSQL database hosted on **Supabase**.  
> Event-centric model: `plate_appearance` → `pitch` → `play` → `runner_advance` + `fielding_play_participant`.  
> Stats derived via **Views** and **Materialized Views** (auto-refreshed when a game is closed).

---

## Index

1. [Model Overview](#1-model-overview)
2. [ENUMs](#2-enums)
3. [Base Tables](#3-base-tables)
   - [tournament](#31-tournament)
   - [team](#32-team)
   - [player](#33-player)
   - [team_tournament](#34-team_tournament)
   - [player_team_tournament](#35-player_team_tournament)
4. [Game Tables](#4-game-tables)
   - [game](#41-game)
   - [game_team](#42-game_team)
   - [game_player](#43-game_player)
5. [Event Tables](#5-event-tables)
   - [plate_appearance](#51-plate_appearance)
   - [pitch](#52-pitch)
   - [play](#53-play)
   - [fielding_play_participant](#54-fielding_play_participant)
   - [runner_advance](#55-runner_advance)
6. [Statistics Views](#6-statistics-views)
7. [Materialized Views](#7-materialized-views)
8. [Triggers & Functions](#8-triggers--functions)
9. [Indexes](#9-indexes)
10. [Row Level Security (RLS)](#10-row-level-security-rls)
11. [Relationship Diagram](#11-relationship-diagram)
12. [Integration Guide](#12-integration-guide)

---

## 1. Model Overview

```
tournament ──< team_tournament >── team
                    │
                    └──< player_team_tournament >── player

game ──< game_team
     ──< game_player
     ──< plate_appearance ──< pitch
                          ──< play ──< fielding_play_participant
                          ──< runner_advance
```

**Write flow (scoresheet app):**
1. Create `game` (status `draft`)
2. Load lineup → insert into `game_team` + `game_player`
3. Game starts (status `in_progress`)
4. Per at-bat: `plate_appearance` → `pitch`(es) → `play` + `runner_advance`(s) + `fielding_play_participant`(s)
5. Close game (status `closed`) → all Materialized Views refresh automatically via trigger

**Read flow (web app):**
- Historical: query Materialized Views or tables directly
- Real-time: Supabase Broadcast channel `match-live-{game_id}`

---

## 2. ENUMs

| Type | Values | Description |
|------|--------|-------------|
| `game_status` | `draft`, `in_progress`, `submitted`, `closed` | Game lifecycle state |
| `half_inning` | `T`, `B` | Top (visitor bats) / Bottom (home bats) |
| `bat_hand` | `R`, `L`, `S` | Right / Left / Switch |
| `throw_hand` | `R`, `L` | Throwing hand |
| `lineup_role` | `NORMAL`, `DP`, `FLEX`, `AP` | Softball DP/FLEX lineup role |
| `field_position` | `P`, `C`, `1B`, `2B`, `3B`, `SS`, `LF`, `CF`, `RF`, `OF`, `EH` | Defensive position |
| `pitch_result` | `BALL`, `CALLED_STRIKE`, `SWINGING_STRIKE`, `FOUL`, `IN_PLAY`, `HIT_BY_PITCH` | Individual pitch result |
| `batted_ball_type` | `GB`, `FB`, `LD`, `PU`, `BUNT`, `UNK` | Ground ball / Fly ball / Line drive / Pop up / Bunt / Unknown |
| `pa_result_type` | `WALK`, `INTENTIONAL_WALK`, `HIT_BY_PITCH`, `STRIKEOUT`, `IN_PLAY` | How the at-bat ended |
| `play_type` | See table below | Final result of the at-bat |
| `advance_reason` | `HIT`, `WALK`, `HIT_BY_PITCH`, `ERROR`, `FIELDERS_CHOICE`, `SAC_FLY`, `SAC_BUNT`, `STOLEN_BASE`, `CAUGHT_STEALING`, `WILD_PITCH`, `PASSED_BALL`, `BALK`, `PICKOFF`, `OTHER` | Runner advance reason |
| `out_type` | `FORCE_OUT`, `TAG_OUT`, `STRIKEOUT`, `FLYOUT`, `LINEOUT`, `PUTOUT`, `PICKOFF`, `CAUGHT_STEALING`, `INTERFERENCE`, `OTHER` | Type of out |
| `fielding_role` | `ASSIST`, `PUTOUT`, `ERROR`, `FIELD` | Fielder's role in a play |

### `play_type` values

| Value | App Code | Description |
|-------|----------|-------------|
| `SINGLE` | `1B` | Single |
| `DOUBLE` | `2B` | Double |
| `TRIPLE` | `3B` | Triple |
| `HOME_RUN` | `HR`, `IPHR` | Home run / Inside-the-park HR |
| `REACH_ON_ERROR` | `E` | Reached on error |
| `FIELDERS_CHOICE` | `FC` | Fielder's choice |
| `REACH_ON_INTERFERENCE` | — | Reached on interference |
| `GROUNDOUT` | `G` | Groundout |
| `FLYOUT` | `F`, `FO` | Fly out |
| `LINEOUT` | `L` | Line out |
| `POPOUT` | `P` | Pop out |
| `BUNT_OUT` | — | Bunt out |
| `WALK` | `BB` | Walk |
| `INTENTIONAL_WALK` | `IBB` | Intentional walk |
| `HIT_BY_PITCH` | `HP`, `HBP` | Hit by pitch |
| `STRIKEOUT` | `K`, `Ks`, `Kc` | Strikeout |
| `SAC_FLY` | `SF` | Sacrifice fly |
| `SAC_BUNT` | `SAC` | Sacrifice bunt |
| `UNKNOWN` | — | Unknown |

---

## 3. Base Tables

### 3.1 `tournament`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `tournament_id` | `bigserial` | NO | auto | **PK** |
| `name` | `text` | NO | — | Tournament name |
| `season` | `int` | NO | — | Season year (e.g. 2025) |
| `category` | `text` | YES | — | Category (e.g. "Open", "U-23") |
| `start_date` | `date` | YES | — | Start date |
| `end_date` | `date` | YES | — | End date |
| `regulations_url` | `text` | YES | — | URL to the tournament regulations |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

**Constraints:** `UNIQUE(name, season, category)`

```sql
CREATE TABLE IF NOT EXISTS tournament (
  tournament_id   bigserial    PRIMARY KEY,
  name            text         NOT NULL,
  season          int          NOT NULL,
  category        text,
  start_date      date,
  end_date        date,
  regulations_url text,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (name, season, category)
);
```

---

### 3.2 `team`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `team_id` | `bigserial` | NO | auto | **PK** |
| `name` | `text` | NO | — | Team name |
| `club` | `text` | YES | — | Club name |
| `city` | `text` | YES | — | City |
| `abbreviation` | `text` | YES | — | Short abbreviation (e.g. "PAR") |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

**Constraints:** `UNIQUE(name, club)`

```sql
CREATE TABLE IF NOT EXISTS team (
  team_id      bigserial    PRIMARY KEY,
  name         text         NOT NULL,
  club         text,
  city         text,
  abbreviation text,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (name, club)
);
```

---

### 3.3 `player`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `player_id` | `bigserial` | NO | auto | **PK** |
| `first_name` | `text` | NO | — | First name |
| `last_name` | `text` | NO | — | Last name |
| `national_id` | `text` | YES | — | National ID / DNI (optional) |
| `birth_date` | `date` | YES | — | Date of birth |
| `bat_hand` | `bat_hand` | NO | `'R'` | Batting hand |
| `throw_hand` | `throw_hand` | NO | `'R'` | Throwing hand |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

> **Avatar URL:** `https://api.dicebear.com/9.x/avataaars/svg?seed={player_id}&backgroundColor=b6e3f4,c0aede,d1d4f9`

```sql
CREATE TABLE IF NOT EXISTS player (
  player_id    bigserial    PRIMARY KEY,
  first_name   text         NOT NULL,
  last_name    text         NOT NULL,
  national_id  text,
  birth_date   date,
  bat_hand     bat_hand     NOT NULL DEFAULT 'R',
  throw_hand   throw_hand   NOT NULL DEFAULT 'R',
  created_at   timestamptz  NOT NULL DEFAULT now()
);
```

---

### 3.4 `team_tournament`

Teams registered in a tournament.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `tournament_id` | `bigint` | NO | — | **PK / FK** → `tournament` |
| `team_id` | `bigint` | NO | — | **PK / FK** → `team` |
| `zone` | `text` | YES | — | Zone / group (e.g. "A", "B") |
| `seed` | `int` | YES | — | Seeding position |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

```sql
CREATE TABLE IF NOT EXISTS team_tournament (
  tournament_id  bigint       NOT NULL REFERENCES tournament(tournament_id) ON DELETE CASCADE,
  team_id        bigint       NOT NULL REFERENCES team(team_id)             ON DELETE RESTRICT,
  zone           text,
  seed           int,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, team_id)
);
```

---

### 3.5 `player_team_tournament`

Tournament roster — players per team per tournament.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `tournament_id` | `bigint` | NO | — | **PK / FK** → `team_tournament` |
| `team_id` | `bigint` | NO | — | **PK / FK** → `team_tournament` |
| `player_id` | `bigint` | NO | — | **PK / FK** → `player` |
| `jersey_number` | `int` | YES | — | Jersey number |
| `primary_position` | `field_position` | YES | — | Player's main position |
| `active` | `boolean` | NO | `true` | Active in the roster |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

> 🔒 `active = true` is required for a player to be added to a game lineup (enforced by trigger).

```sql
CREATE TABLE IF NOT EXISTS player_team_tournament (
  tournament_id      bigint         NOT NULL,
  team_id            bigint         NOT NULL,
  player_id          bigint         NOT NULL REFERENCES player(player_id) ON DELETE RESTRICT,
  jersey_number      int,
  primary_position   field_position,
  active             boolean        NOT NULL DEFAULT true,
  created_at         timestamptz    NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, team_id, player_id),
  FOREIGN KEY (tournament_id, team_id)
    REFERENCES team_tournament(tournament_id, team_id) ON DELETE CASCADE
);
```

---

## 4. Game Tables

### 4.1 `game`

Game header record.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `game_id` | `bigserial` | NO | auto | **PK** |
| `tournament_id` | `bigint` | NO | — | **FK** → `tournament` |
| `scheduled_datetime` | `timestamptz` | NO | — | Scheduled date & time |
| `venue` | `text` | YES | — | Stadium / venue name |
| `field` | `text` | YES | — | Field number or name |
| `home_team_id` | `bigint` | NO | — | **FK** → `team` (home) |
| `away_team_id` | `bigint` | NO | — | **FK** → `team` (away) |
| `status` | `game_status` | NO | `'draft'` | Game lifecycle state |
| `scheduled_innings` | `int` | NO | `7` | Number of innings |
| `mercy_rule` | `boolean` | NO | `false` | Mercy rule applies |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

**Constraints:** `CHECK (home_team_id <> away_team_id)`

| Status | Description |
|--------|-------------|
| `draft` | Created, lineup not confirmed |
| `in_progress` | Lineup confirmed, game underway |
| `submitted` | Submitted for review |
| `closed` | Finalized — stats available |

```sql
CREATE TABLE IF NOT EXISTS game (
  game_id              bigserial    PRIMARY KEY,
  tournament_id        bigint       NOT NULL REFERENCES tournament(tournament_id) ON DELETE RESTRICT,
  scheduled_datetime   timestamptz  NOT NULL,
  venue                text,
  field                text,
  home_team_id         bigint       NOT NULL REFERENCES team(team_id) ON DELETE RESTRICT,
  away_team_id         bigint       NOT NULL REFERENCES team(team_id) ON DELETE RESTRICT,
  status               game_status  NOT NULL DEFAULT 'draft',
  scheduled_innings    int          NOT NULL DEFAULT 7,
  mercy_rule           boolean      NOT NULL DEFAULT false,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  CHECK (home_team_id <> away_team_id)
);
```

---

### 4.2 `game_team`

Per-team totals for a game (cache — derivable from events).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `game_id` | `bigint` | NO | — | **PK / FK** → `game` |
| `team_id` | `bigint` | NO | — | **PK / FK** → `team` |
| `is_home` | `boolean` | NO | `false` | Whether this is the home team |
| `runs` | `int` | NO | `0` | Runs scored (cache) |
| `hits` | `int` | NO | `0` | Total hits (cache) |
| `errors` | `int` | NO | `0` | Total errors (cache) |
| `lob` | `int` | NO | `0` | Left on base (cache) |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

> ⚠️ `runs`, `hits`, `errors`, `lob` are cache fields kept in sync by the app. True values can always be derived from `play` and `runner_advance`.

```sql
CREATE TABLE IF NOT EXISTS game_team (
  game_id     bigint       NOT NULL REFERENCES game(game_id) ON DELETE CASCADE,
  team_id     bigint       NOT NULL REFERENCES team(team_id) ON DELETE RESTRICT,
  is_home     boolean      NOT NULL DEFAULT false,
  runs        int          NOT NULL DEFAULT 0,
  hits        int          NOT NULL DEFAULT 0,
  errors      int          NOT NULL DEFAULT 0,
  lob         int          NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, team_id)
);
```

---

### 4.3 `game_player`

Lineup per game — players, their batting order and defensive position.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `game_id` | `bigint` | NO | — | **PK / FK** → `game` |
| `team_id` | `bigint` | NO | — | **PK / FK** → `team` |
| `player_id` | `bigint` | NO | — | **PK / FK** → `player` |
| `batting_order` | `int` | YES | — | Batting order slot (1–12) |
| `lineup_role` | `lineup_role` | NO | `'NORMAL'` | Role: `NORMAL` / `DP` / `FLEX` / `AP` |
| `defensive_position` | `field_position` | YES | — | Position played in this game |
| `is_starter` | `boolean` | NO | `true` | Starter vs. substitute |
| `inning_in` | `int` | YES | — | Inning the player entered |
| `inning_out` | `int` | YES | — | Inning the player exited (`null` = through the end) |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

> 🔒 **Trigger** `trg_check_game_player_roster` verifies the player is active in `player_team_tournament` before insert.

```sql
CREATE TABLE IF NOT EXISTS game_player (
  game_id              bigint         NOT NULL REFERENCES game(game_id)     ON DELETE CASCADE,
  team_id              bigint         NOT NULL REFERENCES team(team_id)     ON DELETE RESTRICT,
  player_id            bigint         NOT NULL REFERENCES player(player_id) ON DELETE RESTRICT,
  batting_order        int,
  lineup_role          lineup_role    NOT NULL DEFAULT 'NORMAL',
  defensive_position   field_position,
  is_starter           boolean        NOT NULL DEFAULT true,
  inning_in            int,
  inning_out           int,
  created_at           timestamptz    NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, team_id, player_id),
  FOREIGN KEY (game_id, team_id)
    REFERENCES game_team(game_id, team_id) ON DELETE CASCADE
);
```

---

## 5. Event Tables

### 5.1 `plate_appearance`

One complete at-bat. Central table of the event chain.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `plate_appearance_id` | `bigserial` | NO | auto | **PK** |
| `game_id` | `bigint` | NO | — | **FK** → `game` |
| `inning` | `int` | NO | — | Inning number (≥ 1) |
| `half` | `half_inning` | NO | — | `T` = top (visitor bats), `B` = bottom (home bats) |
| `pa_index` | `int` | NO | — | Absolute at-bat order in the game (1..n) |
| `outs_start` | `int` | NO | — | Outs at start of at-bat (0, 1, 2) |
| `batting_team_id` | `bigint` | NO | — | **FK** → `team` |
| `fielding_team_id` | `bigint` | NO | — | **FK** → `team` |
| `batter_id` | `bigint` | NO | — | **FK** → `player` |
| `pitcher_id` | `bigint` | YES | — | **FK** → `player` |
| `catcher_id` | `bigint` | YES | — | **FK** → `player` |
| `pa_result` | `pa_result_type` | NO | `'IN_PLAY'` | How the at-bat ended |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

**Constraints:**
- `UNIQUE(game_id, pa_index)`
- `CHECK(batting_team_id <> fielding_team_id)`

```sql
CREATE TABLE IF NOT EXISTS plate_appearance (
  plate_appearance_id  bigserial        PRIMARY KEY,
  game_id              bigint           NOT NULL REFERENCES game(game_id)     ON DELETE CASCADE,
  inning               int              NOT NULL CHECK (inning >= 1),
  half                 half_inning      NOT NULL,
  pa_index             int              NOT NULL,
  outs_start           int              NOT NULL CHECK (outs_start BETWEEN 0 AND 2),
  batting_team_id      bigint           NOT NULL REFERENCES team(team_id)     ON DELETE RESTRICT,
  fielding_team_id     bigint           NOT NULL REFERENCES team(team_id)     ON DELETE RESTRICT,
  batter_id            bigint           NOT NULL REFERENCES player(player_id) ON DELETE RESTRICT,
  pitcher_id           bigint           REFERENCES player(player_id)          ON DELETE RESTRICT,
  catcher_id           bigint           REFERENCES player(player_id)          ON DELETE RESTRICT,
  pa_result            pa_result_type   NOT NULL DEFAULT 'IN_PLAY',
  created_at           timestamptz      NOT NULL DEFAULT now(),
  UNIQUE (game_id, pa_index),
  CHECK (batting_team_id <> fielding_team_id)
);
```

---

### 5.2 `pitch`

Each individual pitch thrown in an at-bat.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `pitch_id` | `bigserial` | NO | auto | **PK** |
| `pa_id` | `bigint` | NO | — | **FK** → `plate_appearance.plate_appearance_id` |
| `pitch_index` | `int` | NO | — | Pitch order within the at-bat (1..n) |
| `result` | `pitch_result` | NO | — | Pitch result |
| `speed_kmh` | `numeric(5,2)` | YES | — | Speed in km/h |
| `zone` | `int` | YES | — | Strike zone cell (1–14) |
| `pitch_type` | `text` | YES | — | Pitch type (FB, CH, CU, SL…) |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

**Constraints:** `UNIQUE(pa_id, pitch_index)`

```sql
CREATE TABLE IF NOT EXISTS pitch (
  pitch_id      bigserial     PRIMARY KEY,
  pa_id         bigint        NOT NULL REFERENCES plate_appearance(plate_appearance_id) ON DELETE CASCADE,
  pitch_index   int           NOT NULL,
  result        pitch_result  NOT NULL,
  speed_kmh     numeric(5,2),
  zone          int           CHECK (zone BETWEEN 1 AND 14),
  pitch_type    text,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (pa_id, pitch_index)
);
```

---

### 5.3 `play`

Closes the at-bat. One row per `plate_appearance` (1-to-1).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `play_id` | `bigserial` | NO | auto | **PK** |
| `pa_id` | `bigint` | NO | — | **Unique FK** → `plate_appearance` (1-to-1) |
| `play_type` | `play_type` | NO | `'UNKNOWN'` | Play type |
| `batted_ball` | `batted_ball_type` | NO | `'UNK'` | Ball contact type |
| `counts_ab` | `boolean` | NO | `false` | Counts as an official at-bat? |
| `counts_hit` | `boolean` | NO | `false` | Counts as a hit? |
| `bases_hit` | `int` | NO | `0` | Bases reached by hit (0=none, 1=1B, 2=2B, 3=3B, 4=HR) |
| `rbi` | `int` | NO | `0` | Runs batted in |
| `runs_on_play` | `int` | NO | `0` | Runs scored on this play |
| `error_flag` | `boolean` | NO | `false` | Error occurred? |
| `error_position` | `field_position` | YES | — | Position that committed the error |
| `double_play` | `boolean` | NO | `false` | Double play turned? |
| `triple_play` | `boolean` | NO | `false` | Triple play turned? |
| `outs_on_play` | `int` | NO | `0` | Outs recorded (0–3) |
| `description` | `text` | YES | — | Free text (e.g. "6-4-3") |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

```sql
CREATE TABLE IF NOT EXISTS play (
  play_id          bigserial        PRIMARY KEY,
  pa_id            bigint           NOT NULL UNIQUE
                                      REFERENCES plate_appearance(plate_appearance_id) ON DELETE CASCADE,
  play_type        play_type        NOT NULL DEFAULT 'UNKNOWN',
  batted_ball      batted_ball_type NOT NULL DEFAULT 'UNK',
  counts_ab        boolean          NOT NULL DEFAULT false,
  counts_hit       boolean          NOT NULL DEFAULT false,
  bases_hit        int              NOT NULL DEFAULT 0 CHECK (bases_hit BETWEEN 0 AND 4),
  rbi              int              NOT NULL DEFAULT 0 CHECK (rbi >= 0),
  runs_on_play     int              NOT NULL DEFAULT 0 CHECK (runs_on_play >= 0),
  error_flag       boolean          NOT NULL DEFAULT false,
  error_position   field_position,
  double_play      boolean          NOT NULL DEFAULT false,
  triple_play      boolean          NOT NULL DEFAULT false,
  outs_on_play     int              NOT NULL DEFAULT 0 CHECK (outs_on_play BETWEEN 0 AND 3),
  description      text,
  created_at       timestamptz      NOT NULL DEFAULT now()
);
```

---

### 5.4 `fielding_play_participant`

Fielders involved in a play (putouts, assists, errors).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `play_id` | `bigint` | NO | — | **PK / FK** → `play` |
| `fielder_id` | `bigint` | NO | — | **PK / FK** → `player` |
| `role` | `fielding_role` | NO | — | **PK** — `ASSIST` / `PUTOUT` / `ERROR` / `FIELD` |
| `position` | `field_position` | YES | — | Defensive position played |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

> Example: a 6-4-3 double play → 3 rows: SS (`ASSIST`), 2B (`ASSIST` + `PUTOUT`), 1B (`PUTOUT`).

```sql
CREATE TABLE IF NOT EXISTS fielding_play_participant (
  play_id     bigint         NOT NULL REFERENCES play(play_id)     ON DELETE CASCADE,
  fielder_id  bigint         NOT NULL REFERENCES player(player_id) ON DELETE RESTRICT,
  role        fielding_role  NOT NULL,
  position    field_position,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  PRIMARY KEY (play_id, fielder_id, role)
);
```

---

### 5.5 `runner_advance`

Movement of each runner during a play.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `advance_id` | `bigserial` | NO | auto | **PK** |
| `pa_id` | `bigint` | NO | — | **FK** → `plate_appearance` |
| `runner_id` | `bigint` | NO | — | **FK** → `player` |
| `start_base` | `int` | NO | — | `0`=batter, `1`=1st, `2`=2nd, `3`=3rd |
| `end_base` | `int` | NO | — | `1`=1st, `2`=2nd, `3`=3rd, `4`=home, `-1`=out |
| `reason` | `advance_reason` | NO | — | Reason for movement |
| `run_scored` | `boolean` | NO | `false` | Did the runner score? |
| `is_rbi_credit` | `boolean` | NO | `false` | Does this run credit an RBI? |
| `out_flag` | `boolean` | NO | `false` | Runner put out? |
| `out_type` | `out_type` | YES | — | Type of out (if `out_flag = true`) |
| `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |

**Constraint:** `end_base = -1` requires `out_flag = true`.

```sql
CREATE TABLE IF NOT EXISTS runner_advance (
  advance_id    bigserial       PRIMARY KEY,
  pa_id         bigint          NOT NULL REFERENCES plate_appearance(plate_appearance_id) ON DELETE CASCADE,
  runner_id     bigint          NOT NULL REFERENCES player(player_id) ON DELETE RESTRICT,
  start_base    int             NOT NULL CHECK (start_base IN (0, 1, 2, 3)),
  end_base      int             NOT NULL CHECK (end_base  IN (-1, 1, 2, 3, 4)),
  reason        advance_reason  NOT NULL,
  run_scored    boolean         NOT NULL DEFAULT false,
  is_rbi_credit boolean         NOT NULL DEFAULT false,
  out_flag      boolean         NOT NULL DEFAULT false,
  out_type      out_type,
  created_at    timestamptz     NOT NULL DEFAULT now(),
  CHECK (
    (end_base = -1 AND out_flag = true) OR
    (end_base <> -1)
  )
);
```

---

## 6. Statistics Views

Computed on-the-fly from events. For production use the Materialized Views (section 7).

### `v_play_flags`
Internal helper — adds boolean flags to each play (`is_hit`, `is_sac_fly`, `is_strikeout`, etc.) Used by all other stats views.

---

### `v_batting_stats_player_game`
Batting stats per player per game.

| Column | Description |
|--------|-------------|
| `game_id` / `player_id` | Game and player |
| `pa` | Plate appearances |
| `ab` | Official at-bats |
| `h` | Hits |
| `singles` | Singles |
| `doubles` | Doubles |
| `triples` | Triples |
| `home_runs` | Home runs |
| `walks` | Walks |
| `hit_by_pitch` | Hit by pitch |
| `strikeouts` | Strikeouts |
| `rbi` | Runs batted in |
| `sac_flies` | Sacrifice flies |
| `sac_bunts` | Sacrifice bunts |
| `total_bases` | Total bases |
| `runs_scored` | Runs scored |
| `stolen_bases` | Stolen bases |
| `caught_stealing` | Caught stealing |
| `avg` | Batting average (H/AB) |
| `obp` | On-base percentage |
| `slg` | Slugging percentage (TB/AB) |
| `ops` | OPS (OBP + SLG) |

---

### `v_batting_stats_player_tournament`
Same columns as above, aggregated across all games in the tournament.

---

### `v_fielding_stats_player_game`
Fielding stats per player per game.

| Column | Description |
|--------|-------------|
| `game_id` / `player_id` | Game and fielder |
| `putouts` | Putouts |
| `assists` | Assists |
| `errors` | Errors |

---

### `v_pitching_stats_player_game`
Pitching stats per player per game.

| Column | Description |
|--------|-------------|
| `game_id` / `player_id` | Game and pitcher |
| `outs_recorded` | Outs recorded |
| `innings_pitched` | `outs_recorded / 3` |
| `hits_allowed` | Hits allowed |
| `walks_issued` | Walks issued |
| `batters_hit` | Batters hit |
| `strikeouts` | Strikeouts |
| `home_runs_allowed` | Home runs allowed |
| `runs_allowed` | Runs allowed |

---

### `v_pitching_stats_player_tournament`
Same columns as above, aggregated across all games in the tournament.

---

## 7. Materialized Views

Physically stored snapshots of the views. Auto-refreshed when a game is closed.

| Materialized View | Source | Unique Index |
|-------------------|--------|--------------|
| `mv_batting_stats_player_game` | `v_batting_stats_player_game` | `(game_id, player_id)` |
| `mv_batting_stats_player_tournament` | `v_batting_stats_player_tournament` | `(tournament_id, player_id)` |
| `mv_fielding_stats_player_game` | `v_fielding_stats_player_game` | `(game_id, player_id)` |
| `mv_pitching_stats_player_game` | `v_pitching_stats_player_game` | `(game_id, player_id)` |
| `mv_pitching_stats_player_tournament` | `v_pitching_stats_player_tournament` | `(tournament_id, player_id)` |

> Manual refresh: call `fn_refresh_stats_for_game(game_id)`.

---

## 8. Triggers & Functions

### `trg_check_game_player_roster` → `fn_check_game_player_roster()`
- **When:** `BEFORE INSERT OR UPDATE` on `game_player`
- **What:** Verifies the player is active (`active = true`) in `player_team_tournament` for the tournament of the game. Raises exception if not.

---

### `trg_game_close_refresh` → `fn_on_game_close_refresh()`
- **When:** `AFTER UPDATE OF status` on `game`
- **What:** When `status` changes to `closed`, calls `fn_refresh_stats_for_game()` to concurrently refresh all 5 Materialized Views.

---

### `fn_refresh_stats_for_game(p_game_id bigint)`
- **Use:** Manual refresh without changing game status.
- **Action:** `REFRESH MATERIALIZED VIEW CONCURRENTLY` on all 5 MVs.

---

## 9. Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `game` | `idx_game_tournament_date` | `(tournament_id, scheduled_datetime)` | List games by tournament and date |
| `game` | `idx_game_tournament` | `(tournament_id)` | Fast FK |
| `game` | `idx_game_home_team` | `(home_team_id)` | Fast FK |
| `game` | `idx_game_away_team` | `(away_team_id)` | Fast FK |
| `game` | `idx_game_status` | `(status)` | Filter by status |
| `game_player` | `idx_game_player_batting_order` | `(game_id, team_id, batting_order)` | Sort lineup |
| `game_player` | `idx_game_player_player` | `(player_id)` | Fast FK |
| `game_player` | `idx_game_player_team` | `(team_id)` | Fast FK |
| `game_team` | `idx_game_team_team` | `(team_id)` | Fast FK |
| `plate_appearance` | `idx_pa_game_inning` | `(game_id, inning, half, pa_index)` | Read by inning |
| `plate_appearance` | `idx_pa_batter` | `(batter_id)` | Batter stats |
| `plate_appearance` | `idx_pa_pitcher` | `(pitcher_id)` | Pitcher stats |
| `plate_appearance` | `idx_pa_game_batter` | `(game_id, batter_id)` | Batter in a game |
| `plate_appearance` | `idx_pa_batting_team` | `(batting_team_id)` | Fast FK |
| `plate_appearance` | `idx_pa_fielding_team` | `(fielding_team_id)` | Fast FK |
| `plate_appearance` | `idx_pa_catcher` | `(catcher_id) WHERE NOT NULL` | Partial FK |
| `pitch` | `idx_pitch_pa` | `(pa_id)` | Pitches in at-bat |
| `pitch` | `idx_pitch_pa_index` | `(pa_id, pitch_index)` | Pitch ordering |
| `play` | `idx_play_type` | `(play_type)` | Filter by play type |
| `play` | `idx_play_pa` | `(pa_id)` | Fast FK |
| `runner_advance` | `idx_runner_advance_pa` | `(pa_id)` | Advances per play |
| `runner_advance` | `idx_runner_advance_runner` | `(runner_id)` | Runner stats |
| `fielding_play_participant` | `idx_fielding_play` | `(play_id)` | Participants per play |
| `fielding_play_participant` | `idx_fielding_fielder` | `(fielder_id)` | Fast FK |
| `team_tournament` | `idx_team_tournament_team` | `(team_id)` | Fast FK |
| `player_team_tournament` | `idx_ptt_player` | `(player_id)` | Fast FK |
| `player_team_tournament` | `idx_ptt_team` | `(team_id)` | Fast FK |

---

## 10. Row Level Security (RLS)

RLS is **enabled on all tables**. Current policies allow full public access (no authentication required).

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `tournament` | ✅ | ✅ | ✅ | ✅ |
| `team` | ✅ | ✅ | ✅ | ✅ |
| `player` | ✅ | ✅ | ✅ | ✅ |
| `team_tournament` | ✅ | ✅ | ✅ | ✅ |
| `player_team_tournament` | ✅ | ✅ | ✅ | ✅ |
| `game` | ✅ | ✅ | ✅ | ✅ |
| `game_team` | ✅ | ✅ | ✅ | ✅ |
| `game_player` | ✅ | ✅ | ✅ | ✅ |
| `plate_appearance` | ✅ | ✅ | ✅ | ✅ |
| `pitch` | ✅ | ✅ | ✅ | ✅ |
| `play` | ✅ | ✅ | ✅ | ✅ |
| `fielding_play_participant` | ✅ | ✅ | ✅ | ✅ |
| `runner_advance` | ✅ | ✅ | ✅ | ✅ |

> 🔒 Policies use `USING ((select true))` for performance (evaluated once per query, not per row).  
> When adding authentication, restrict INSERT/UPDATE/DELETE to the `authenticated` role using `auth.uid()`.

---

## 11. Relationship Diagram

```
tournament (1)
  │  └───< team_tournament (N) >─────────── team (1)
  │               │
  │               └───< player_team_tournament (N) >─── player (1)
  │
  └───< game (N)
           │  ├───< game_team       (2 rows: home + away)
           │  └───< game_player     (N rows: one per player)
           │
           └───< plate_appearance   (N: one per at-bat)
                     │
                     ├───< pitch                     (N: pitches)
                     │
                     ├──── play                      (1: at-bat result)
                     │         └───< fielding_play_participant (N)
                     │
                     └───< runner_advance             (N: runner movements)
```

---

## 12. Integration Guide

### 12.1 Scoresheet App (Write)

```
[New game]
  INSERT game
  → INSERT game_team       (×2: home + away)
  → INSERT game_player     (×N: one per player)

[New play]
  INSERT plate_appearance
    ├── INSERT pitch                     (×N pitches, optional)
    ├── INSERT play
    ├── INSERT runner_advance            (×N if runners moved)
    └── INSERT fielding_play_participant (×N if fielding detail)
  UPDATE game_team  (runs / hits / errors)

[Close game]
  UPDATE game SET status = 'closed'
  → Trigger refreshes all Materialized Views automatically
```

**Auto-save:** full upsert every 10 seconds + on "Save & Exit" (waits for write confirmation).

---

### 12.2 Web App (Read)

**Games in progress:**
```sql
SELECT
    g.game_id,
    ht.name  AS home_team,
    at.name  AS away_team,
    g.scheduled_datetime,
    g.status,
    g.scheduled_innings
FROM game g
JOIN team ht ON ht.team_id = g.home_team_id
JOIN team at ON at.team_id = g.away_team_id
WHERE g.status IN ('in_progress', 'submitted')
ORDER BY g.scheduled_datetime DESC;
```

**Batting leaderboard for a tournament:**
```sql
SELECT p.first_name, p.last_name, m.*
FROM mv_batting_stats_player_tournament m
JOIN player p ON p.player_id = m.player_id
WHERE m.tournament_id = {tournament_id}
ORDER BY m.avg DESC NULLS LAST;
```

**Batting stats for a single game:**
```sql
SELECT p.first_name, p.last_name, m.*
FROM mv_batting_stats_player_game m
JOIN player p ON p.player_id = m.player_id
WHERE m.game_id = {game_id};
```

**Standings (runs per team):**
```sql
SELECT t.name, SUM(gt.runs) AS total_runs, COUNT(*) AS games_played
FROM game_team gt
JOIN team t ON t.team_id = gt.team_id
JOIN game g ON g.game_id = gt.game_id
WHERE g.tournament_id = {tournament_id} AND g.status = 'closed'
GROUP BY t.team_id, t.name
ORDER BY total_runs DESC;
```

**Score by inning:**
```sql
SELECT
    pa.inning,
    pa.half,
    COUNT(*) FILTER (WHERE ra.run_scored = true) AS runs
FROM plate_appearance pa
LEFT JOIN runner_advance ra ON ra.pa_id = pa.plate_appearance_id
WHERE pa.game_id = {game_id}
  AND pa.batting_team_id = {team_id}
GROUP BY pa.inning, pa.half
ORDER BY pa.inning, pa.half;
```

---

### 12.3 Real-Time

```
Channel: match-live-{game_id}
Event:   game_update
```

**Pattern:**
1. On page load → query `game` + `mv_batting_stats_*` for initial state
2. Subscribe to broadcast channel
3. On broadcast → replace full `plays[]` and recalculate score
4. On unmount → `supabase.removeChannel(channel)`

---

*Documentation — Softball Statics — April 2026*
