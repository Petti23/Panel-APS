import { supabase } from '../supabase'

const TABLE = 'game'

// Mapeo snake_case (DB) ↔ camelCase (app)
// scheduled_datetime (timestamptz) se descompone en date + time para la UI
const fromRow = (row) => {
    let date = null
    let time = null
    if (row.scheduled_datetime) {
        date = row.scheduled_datetime.slice(0, 10)         // 'YYYY-MM-DD'
        time = row.scheduled_datetime.slice(11, 16)        // 'HH:MM'
    }
    return {
        id: row.game_id,
        tournamentId: row.tournament_id,
        homeTeamId: row.home_team_id,
        visitorTeamId: row.away_team_id,   // alias interno mantenido
        venue: row.venue,
        field: row.field,
        date,
        time,
        status: row.status,
    }
}

const toRow = ({ tournamentId, homeTeamId, visitorTeamId, venue, field, date, time }) => {
    let scheduled_datetime = null
    if (date) {
        scheduled_datetime = time ? `${date}T${time}:00` : `${date}T00:00:00`
    }
    return {
        tournament_id: tournamentId,
        home_team_id: homeTeamId,
        away_team_id: visitorTeamId,
        venue: venue || null,
        field: field || null,
        scheduled_datetime,
    }
}

export const fetchGames = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('scheduled_datetime', { ascending: true })
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
        .eq('game_id', id)
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const deleteGame = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('game_id', id)
    if (error) throw error
}
