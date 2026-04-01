-- ================================================================
--  APS Liga — Seed de categorías oficiales
--  Ejecutar DESPUÉS de schema.sql y rls.sql
--
--  min_age / max_age: edad mínima y máxima inclusiva.
--  null = sin restricción (ej. categorías por nivel, no por edad).
--  sort_order: orden de aparición en selectores del frontend.
-- ================================================================

insert into public.categories (name, sort_order) values
    ('Escuelita',                       1),
    ('Preinfantil',                     2),
    ('Infantil',                        3),
    ('Cadete',                          4),
    ('Juveniles',                       5),
    ('U23',                             6),
    ('Primera Division (Primera A)',    7),
    ('Primera "B"',                     8),
    ('Primera Femenino',                9),
    ('Lanzamiento Lento +35',           10),
    ('Lanzamiento Lento +48',           11),
    ('Lanzamiento Lento +35 Femenino',  12)
on conflict (name) do update
    set sort_order = excluded.sort_order;
