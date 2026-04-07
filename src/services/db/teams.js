import { supabase } from '../supabase'

const TABLE = 'team'

// Mapeo snake_case (DB) ↔ camelCase (app)
const fromRow = (row) => ({
    id: row.team_id,
    name: row.name,
    club: row.club,
    city: row.city,
    abbreviation: row.abbreviation,
})

const toRow = ({ name, club, city, abbreviation }) => ({
    name: name ? name.toUpperCase() : name,
    club: club ? club.toUpperCase() : null,
    city: city || null,
    abbreviation: abbreviation ? abbreviation.toUpperCase() : null,
})

export const fetchTeams = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(fromRow)
}

export const insertTeam = async (team) => {
    const uppercaseName = team.name ? team.name.toUpperCase() : team.name;

    const { data: existing } = await supabase
        .from(TABLE)
        .select('team_id')
        .eq('name', uppercaseName)
        .maybeSingle()

    if (existing) {
        throw new Error('Ya existe un equipo registrado con ese nombre.')
    }

    const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(team))
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const updateTeam = async (id, team) => {
    const uppercaseName = team.name ? team.name.toUpperCase() : team.name;

    const { data: existing } = await supabase
        .from(TABLE)
        .select('team_id')
        .eq('name', uppercaseName)
        .neq('team_id', id)
        .maybeSingle()

    if (existing) {
        throw new Error('Ya existe otro equipo con este nombre.')
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(team))
        .eq('team_id', id)
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const deleteTeam = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('team_id', id)
    if (error) throw error
}
