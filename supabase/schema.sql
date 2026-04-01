-- ================================================================
--  APS Liga — Schema de base de datos
--  Ejecutar en Supabase: SQL Editor → New Query
-- ================================================================

-- ── Categorías (tabla maestra) ────────────────────────────────────
-- El campo `name` es la PK natural y es el que usan las otras tablas
-- como FK de texto. Así el frontend sigue manejando strings sin
-- necesitar buscar IDs.
create table if not exists public.categories (
    name        text        primary key,
    sort_order  int         not null default 0,  -- para ordenar en selectores
    created_at  timestamptz not null default now()
);

-- ── Torneos ──────────────────────────────────────────────────────
create table if not exists public.tournaments (
    id          uuid        primary key default gen_random_uuid(),
    name        text        not null,
    -- FK de texto: válida solo si existe en categories.name
    category    text        not null references public.categories(name) on update cascade,
    created_at  timestamptz not null default now(),
    constraint tournaments_name_category_key unique (name, category)
);

-- ── Equipos ───────────────────────────────────────────────────────
create table if not exists public.teams (
    id          uuid        primary key default gen_random_uuid(),
    name        text        not null,
    category    text        not null references public.categories(name) on update cascade,
    created_at  timestamptz not null default now(),
    constraint teams_name_category_key unique (name, category)
);

-- ── Jugadores ─────────────────────────────────────────────────────
create table if not exists public.players (
    id          uuid        primary key default gen_random_uuid(),
    full_name   text        not null,
    dni         text,
    category    text        not null references public.categories(name) on update cascade,
    team_id     uuid        references public.teams(id) on delete set null,
    created_at  timestamptz not null default now()
);

-- ── Partidos ──────────────────────────────────────────────────────
create table if not exists public.games (
    id               uuid   primary key default gen_random_uuid(),
    tournament_id    uuid   not null references public.tournaments(id) on delete cascade,
    home_team_id     uuid   references public.teams(id) on delete set null,
    visitor_team_id  uuid   references public.teams(id) on delete set null,
    field            text,
    date             date,
    time             text,
    created_at       timestamptz not null default now(),
    -- Evita duplicados al reimportar el mismo fixture
    constraint games_unique_match unique (tournament_id, home_team_id, visitor_team_id, date, time)
);

-- ── Índices de rendimiento ────────────────────────────────────────
create index if not exists games_tournament_idx  on public.games(tournament_id);
create index if not exists games_date_idx        on public.games(date);
create index if not exists players_team_idx      on public.players(team_id);
create index if not exists players_category_idx  on public.players(category);
create index if not exists teams_category_idx    on public.teams(category);
