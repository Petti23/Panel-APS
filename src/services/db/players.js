import { supabase } from '../supabase'

const TABLE = 'players'

// Mapeo snake_case (DB) ↔ camelCase (app)
const fromRow = (row) => ({
    id: row.id,
    fullName: row.full_name,
    dni: row.dni,
    category: row.category,
    teamId: row.team_id,
})

const toRow = ({ fullName, dni, category, teamId }) => ({
    full_name: fullName,
    dni: dni || null,
    category,
    team_id: teamId || null,
})

export const fetchPlayers = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(fromRow)
}

export const insertPlayer = async (player) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(player))
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const updatePlayer = async (id, player) => {
    const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(player))
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const deletePlayer = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
    if (error) throw error
}
