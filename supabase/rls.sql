-- ================================================================
--  APS Liga — Row Level Security (RLS) policies
--  Ejecutar DESPUÉS de schema.sql
--
--  Modelo de seguridad actual:
--    • Lectura pública → cualquiera puede ver los datos (fixture público)
--    • Escritura → solo usuarios autenticados (admins de la liga)
--
--  Si en el futuro se necesita restringir lectura también,
--  cambiar la política "select" a un rol específico.
-- ================================================================

-- ── Activar RLS en todas las tablas ──────────────────────────────
alter table public.categories  enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams       enable row level security;
alter table public.players     enable row level security;
alter table public.games       enable row level security;

-- ── categories ────────────────────────────────────────────────────
-- Solo lectura pública; solo admins autenticados la modifican.
create policy "categories_public_read"
    on public.categories for select
    using (true);

create policy "categories_auth_write"
    on public.categories for insert
    with check (auth.role() = 'authenticated');

create policy "categories_auth_update"
    on public.categories for update
    using (auth.role() = 'authenticated');

create policy "categories_auth_delete"
    on public.categories for delete
    using (auth.role() = 'authenticated');

-- ── tournaments ──────────────────────────────────────────────────
create policy "tournaments_public_read"
    on public.tournaments for select
    using (true);

create policy "tournaments_auth_write"
    on public.tournaments for insert
    with check (auth.role() = 'authenticated');

create policy "tournaments_auth_update"
    on public.tournaments for update
    using (auth.role() = 'authenticated');

create policy "tournaments_auth_delete"
    on public.tournaments for delete
    using (auth.role() = 'authenticated');

-- ── teams ─────────────────────────────────────────────────────────
create policy "teams_public_read"
    on public.teams for select
    using (true);

create policy "teams_auth_write"
    on public.teams for insert
    with check (auth.role() = 'authenticated');

create policy "teams_auth_update"
    on public.teams for update
    using (auth.role() = 'authenticated');

create policy "teams_auth_delete"
    on public.teams for delete
    using (auth.role() = 'authenticated');

-- ── players ───────────────────────────────────────────────────────
create policy "players_public_read"
    on public.players for select
    using (true);

create policy "players_auth_write"
    on public.players for insert
    with check (auth.role() = 'authenticated');

create policy "players_auth_update"
    on public.players for update
    using (auth.role() = 'authenticated');

create policy "players_auth_delete"
    on public.players for delete
    using (auth.role() = 'authenticated');

-- ── games ─────────────────────────────────────────────────────────
create policy "games_public_read"
    on public.games for select
    using (true);

create policy "games_auth_write"
    on public.games for insert
    with check (auth.role() = 'authenticated');

create policy "games_auth_update"
    on public.games for update
    using (auth.role() = 'authenticated');

create policy "games_auth_delete"
    on public.games for delete
    using (auth.role() = 'authenticated');

-- ================================================================
--  NOTA: Para habilitar login de admins, activar en Supabase
--  Authentication → Providers → Email o Magic Link,
--  y usar supabase.auth.signInWithPassword() desde el frontend.
-- ================================================================

create policy "tournaments_auth_write"
    on public.tournaments for insert
    with check (auth.role() = 'authenticated');

create policy "tournaments_auth_update"
    on public.tournaments for update
    using (auth.role() = 'authenticated');

create policy "tournaments_auth_delete"
    on public.tournaments for delete
    using (auth.role() = 'authenticated');

-- ── teams ─────────────────────────────────────────────────────────
create policy "teams_public_read"
    on public.teams for select
    using (true);

create policy "teams_auth_write"
    on public.teams for insert
    with check (auth.role() = 'authenticated');

create policy "teams_auth_update"
    on public.teams for update
    using (auth.role() = 'authenticated');

create policy "teams_auth_delete"
    on public.teams for delete
    using (auth.role() = 'authenticated');

-- ── players ───────────────────────────────────────────────────────
create policy "players_public_read"
    on public.players for select
    using (true);

create policy "players_auth_write"
    on public.players for insert
    with check (auth.role() = 'authenticated');

create policy "players_auth_update"
    on public.players for update
    using (auth.role() = 'authenticated');

create policy "players_auth_delete"
    on public.players for delete
    using (auth.role() = 'authenticated');

-- ── games ─────────────────────────────────────────────────────────
create policy "games_public_read"
    on public.games for select
    using (true);

create policy "games_auth_write"
    on public.games for insert
    with check (auth.role() = 'authenticated');

create policy "games_auth_update"
    on public.games for update
    using (auth.role() = 'authenticated');

create policy "games_auth_delete"
    on public.games for delete
    using (auth.role() = 'authenticated');

-- ================================================================
--  NOTA: Para habilitar login de admins, activar en Supabase
--  Authentication → Providers → Email o Magic Link,
--  y usar supabase.auth.signInWithPassword() desde el frontend.
-- ================================================================
