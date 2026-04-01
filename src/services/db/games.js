import { supabase } from '../supabase'

const TABLE = 'games'

// Mapeo snake_case (DB) ↔ camelCase (app)
const fromRow = (row) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    homeTeamId: row.home_team_id,
    visitorTeamId: row.visitor_team_id,
    field: row.field,
    date: row.date,
    time: row.time,
})

const toRow = ({ tournamentId, homeTeamId, visitorTeamId, field, date, time }) => ({
    tournament_id: tournamentId,
    home_team_id: homeTeamId,
    visitor_team_id: visitorTeamId,
    field: field || null,
    date: date || null,
    time: time || null,
})

export const fetchGames = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('date', { ascending: true })
    if (error) throw error
    return data.map(fromRow)
}

export const insertGame = async (game) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(game))
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const updateGame = async (id, game) => {
    const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(game))
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const deleteGame = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
    if (error) throw error
}
