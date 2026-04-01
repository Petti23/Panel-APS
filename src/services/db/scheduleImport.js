import { supabase } from '../supabase'
import { normalizeText } from '../../utils/schedule/normalizeText'
import { parseDateToISO } from '../../utils/schedule/parseDate'
import { isPlaceholderTeam } from '../../utils/schedule/isPlaceholderTeam'

/**
 * Importación masiva de fixture desde Excel al nuevo esquema en inglés.
 * Tablas: tournament, team, game (singulares).
 *
 * @param {object} data - Resultado del parser de Excel ({ categorias: [...] })
 * @returns {{ addedTournaments, addedTeams, addedGames }}
 */
export const importScheduleToDb = async (data) => {
    // ── 1. Recopilar torneos y equipos únicos ─────────────────────
    const tournamentsMap = new Map()  // "name|category|season" → { name, category, season }
    const teamNamesSet = new Set()
    const rawGames = []

    for (const cat of data.categorias) {
        if (cat.estado !== 'con_partidos' || !cat.partidos?.length) continue

        const officialCategory = cat.category || cat.categoria
        const officialTournamentName = (
            cat.tournamentName ||
            `${cat.categoria} ${cat.torneo || ''} ${cat.anio || ''}`.trim()
        )
        const season = cat.anio ? parseInt(cat.anio, 10) : new Date().getFullYear()

        const tKey = `${normalizeText(officialTournamentName)}|${normalizeText(officialCategory)}|${season}`
        if (!tournamentsMap.has(tKey)) {
            tournamentsMap.set(tKey, { name: officialTournamentName, category: officialCategory, season })
        }

        for (const p of cat.partidos) {
            if (isPlaceholderTeam(p.local) || isPlaceholderTeam(p.visitante)) continue

            teamNamesSet.add(p.local)
            teamNamesSet.add(p.visitante)

            rawGames.push({
                tournamentKey: tKey,
                homeTeamName: p.local,
                awayTeamName: p.visitante,
                field: p.diamante || null,
                date: parseDateToISO(p.fechaTexto),
                time: p.hora,
            })
        }
    }

    // ── 2. Upsert torneos (unique: name, season, category) ────────
    const tournamentRows = [...tournamentsMap.values()]
    const { data: upsertedTournaments, error: tErr } = await supabase
        .from('tournament')
        .upsert(tournamentRows, { onConflict: 'name,season,category' })
        .select()
    if (tErr) throw tErr

    const tournamentIdMap = new Map(
        upsertedTournaments.map((t) => [
            `${normalizeText(t.name)}|${normalizeText(t.category)}|${t.season}`,
            t.tournament_id,
        ])
    )

    // ── 3. Equipos: obtener existentes e insertar los nuevos ──────
    const teamNamesList = [...teamNamesSet]
    const { data: existingTeams, error: etErr } = await supabase
        .from('team')
        .select('team_id, name')
        .in('name', teamNamesList)
    if (etErr) throw etErr

    const existingByName = new Map(existingTeams.map((t) => [normalizeText(t.name), t.team_id]))

    const newTeamNames = teamNamesList.filter((n) => !existingByName.has(normalizeText(n)))
    let insertedByName = new Map()
    if (newTeamNames.length > 0) {
        const { data: inserted, error: itErr } = await supabase
            .from('team')
            .insert(newTeamNames.map((name) => ({ name })))
            .select()
        if (itErr) throw itErr
        inserted.forEach((t) => insertedByName.set(normalizeText(t.name), t.team_id))
    }

    const teamIdMap = new Map([...existingByName, ...insertedByName])

    // ── 4. Construir e insertar partidos ──────────────────────────
    const gameRows = rawGames
        .map((g) => {
            const tournament_id = tournamentIdMap.get(g.tournamentKey)
            const home_team_id = teamIdMap.get(normalizeText(g.homeTeamName))
            const away_team_id = teamIdMap.get(normalizeText(g.awayTeamName))
            if (!tournament_id || !home_team_id || !away_team_id || !g.date) return null
            const scheduled_datetime = g.time
                ? `${g.date}T${g.time}:00`
                : `${g.date}T00:00:00`
            return { tournament_id, home_team_id, away_team_id, field: g.field, scheduled_datetime }
        })
        .filter(Boolean)

    let addedGames = 0
    if (gameRows.length > 0) {
        const { data: insertedGames, error: gErr } = await supabase
            .from('game')
            .insert(gameRows)
            .select()
        if (gErr) throw gErr
        addedGames = insertedGames?.length ?? 0
    }

    return {
        addedTournaments: tournamentRows.length,
        addedTeams: newTeamNames.length,
        addedGames,
    }
}

