import { supabase } from '../supabase'
import { normalizeText } from '../../utils/schedule/normalizeText'
import { parseDateToISO } from '../../utils/schedule/parseDate'
import { isPlaceholderTeam } from '../../utils/schedule/isPlaceholderTeam'

/**
 * Importación masiva de fixture desde Excel.
 * Usa upsert para ser idempotente: reimportar el mismo Excel no genera duplicados.
 *
 * @param {object} data - Resultado del parser de Excel ({ categorias: [...] })
 * @returns {{ addedTournaments, addedTeams, addedGames }} - Conteo de registros nuevos
 */
export const importScheduleToDb = async (data) => {
    // ── 1. Recopilar torneos y equipos únicos ─────────────────────
    const tournamentsMap = new Map() // "name|category" → { name, category }
    const teamsMap = new Map()       // "name|category" → { name, category }
    const rawGames = []

    for (const cat of data.categorias) {
        if (cat.estado !== 'con_partidos' || !cat.partidos?.length) continue

        const officialCategory = cat.category || cat.categoria
        const officialTournamentName = (
            cat.tournamentName ||
            `${cat.categoria} ${cat.torneo || ''} ${cat.anio || ''}`.trim()
        )

        const tKey = `${normalizeText(officialTournamentName)}|${normalizeText(officialCategory)}`
        if (!tournamentsMap.has(tKey)) {
            tournamentsMap.set(tKey, { name: officialTournamentName, category: officialCategory })
        }

        for (const p of cat.partidos) {
            // Omitir partidos cuyos equipos son placeholders de llave (GP1, 1°, etc.)
            if (isPlaceholderTeam(p.local) || isPlaceholderTeam(p.visitante)) continue

            const hKey = `${normalizeText(p.local)}|${normalizeText(officialCategory)}`
            if (!teamsMap.has(hKey)) teamsMap.set(hKey, { name: p.local, category: officialCategory })

            const vKey = `${normalizeText(p.visitante)}|${normalizeText(officialCategory)}`
            if (!teamsMap.has(vKey)) teamsMap.set(vKey, { name: p.visitante, category: officialCategory })

            rawGames.push({
                tournamentKey: tKey,
                homeTeamKey: hKey,
                visitorTeamKey: vKey,
                field: p.diamante || 'A confirmar',
                date: parseDateToISO(p.fechaTexto),
                time: p.hora,
            })
        }
    }

    // ── 2. Garantizar que las categorías existen en la tabla categories ─
    // La FK tournaments.category → categories.name requiere que el valor
    // exista antes del insert. Se usa upsert con ignoreDuplicates para no
    // pisar los datos de min_age/max_age ya cargados con el seed.
    const uniqueCategories = [
        ...new Set([
            ...[...tournamentsMap.values()].map((t) => t.category),
            ...[...teamsMap.values()].map((t) => t.category),
        ]),
    ]
    const { error: catErr } = await supabase
        .from('categories')
        .upsert(
            uniqueCategories.map((name) => ({ name })),
            { onConflict: 'name', ignoreDuplicates: true }
        )
    if (catErr) throw catErr

    // ── 3. Upsert torneos (obtiene IDs existentes o recién creados) ─
    const tournamentRows = [...tournamentsMap.values()]
    const { data: upsertedTournaments, error: tErr } = await supabase
        .from('tournaments')
        .upsert(tournamentRows, { onConflict: 'name,category' })
        .select()
    if (tErr) throw tErr

    const tournamentIdMap = new Map(
        upsertedTournaments.map((t) => [
            `${normalizeText(t.name)}|${normalizeText(t.category)}`,
            t.id,
        ])
    )

    // ── 4. Upsert equipos ──────────────────────────────────────────
    const teamRows = [...teamsMap.values()]
    const { data: upsertedTeams, error: tmErr } = await supabase
        .from('teams')
        .upsert(teamRows, { onConflict: 'name,category' })
        .select()
    if (tmErr) throw tmErr

    const teamIdMap = new Map(
        upsertedTeams.map((t) => [
            `${normalizeText(t.name)}|${normalizeText(t.category)}`,
            t.id,
        ])
    )

    // ── 5. Construir filas de partidos ─────────────────────────────
    const gameRows = rawGames
        .map((g) => ({
            tournament_id: tournamentIdMap.get(g.tournamentKey),
            home_team_id: teamIdMap.get(g.homeTeamKey),
            visitor_team_id: teamIdMap.get(g.visitorTeamKey),
            field: g.field,
            date: g.date || null,
            time: g.time || null,
        }))
        .filter((g) => g.tournament_id && g.home_team_id && g.visitor_team_id)

    // ── 6. Upsert partidos (ignorar duplicados exactos) ────────────
    const { data: upsertedGames, error: gErr } = await supabase
        .from('games')
        .upsert(gameRows, {
            onConflict: 'tournament_id,home_team_id,visitor_team_id,date,time',
            ignoreDuplicates: true,
        })
        .select()
    if (gErr) throw gErr

    return {
        addedTournaments: tournamentRows.length,
        addedTeams: teamRows.length,
        addedGames: upsertedGames?.length ?? 0,
    }
}
