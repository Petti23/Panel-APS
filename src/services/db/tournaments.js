import { supabase } from '../supabase'

const TABLE = 'tournament'

// Mapeo snake_case (DB) ↔ camelCase (app)
const fromRow = (row) => ({
    id: row.tournament_id,
    name: row.name,
    season: row.season,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
})

const toRow = ({ name, season, category, startDate, endDate }) => ({
    name,
    season: season ? parseInt(season, 10) : new Date().getFullYear(),
    category: category || null,
    start_date: startDate || null,
    end_date: endDate || null,
})

export const fetchTournaments = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(fromRow)
}

export const insertTournament = async (tournament) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(tournament))
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const updateTournament = async (id, tournament) => {
    const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(tournament))
        .eq('tournament_id', id)
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const deleteTournament = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('tournament_id', id)
    if (error) throw error
}
