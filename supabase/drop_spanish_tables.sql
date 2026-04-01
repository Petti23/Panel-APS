-- ================================================================
--  APS Liga — Eliminar tablas duplicadas en español
--  Ejecutar en Supabase: SQL Editor → New Query
--
--  Tablas a eliminar (duplicados de las tablas en inglés):
--    torneo       → tournaments
--    equipo       → teams
--    jugador      → players
--    partido      → games
--
--  Se usan DROP CASCADE para eliminar también vistas y FK que
--  dependan de estas tablas. Revisar si hay datos a migrar antes
--  de ejecutar.
-- ================================================================

-- ── 1. Tablas de unión (primero, por dependencias) ────────────────
drop table if exists public.jugador_partido        cascade;
drop table if exists public.jugador_equipo_torneo  cascade;
drop table if exists public.partido_equipo         cascade;
drop table if exists public.equipo_torneo          cascade;

-- ── 2. Tablas base en español ─────────────────────────────────────
drop table if exists public.partido  cascade;
drop table if exists public.jugador  cascade;
drop table if exists public.equipo   cascade;
drop table if exists public.torneo   cascade;
